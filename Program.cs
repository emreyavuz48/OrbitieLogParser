using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Data;
using System.Text;
using System.Text.RegularExpressions;

var builder = Host.CreateDefaultBuilder(args);

builder.ConfigureServices((hostContext, services) =>
{
    services.AddHostedService<LogSyncWorker>();
});

var host = builder.Build();
await host.RunAsync();

// Worker service sınıfı
public class LogSyncWorker : BackgroundService
{
    private readonly ILogger<LogSyncWorker> _logger;
    private readonly string _connectionString = "Server=localhost,1433;Database=OrbitieLogDb;User Id=sa;Password=Orbitie12345!;TrustServerCertificate=True;";
    
    // Geliştirme (Test) aşamasında ana dizini kullanır. Canlıya alırken AppContext.BaseDirectory yapılabilir.
    private readonly string _logDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Logs"); 
    
    private readonly Dictionary<string, long> _fileOffsets = new();
    private readonly Dictionary<string, LogEntry> _pendingLogs = new();

    private static readonly Regex LogPattern = new Regex(
        @"^(?<timestamp>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(\.\d+)?\s+[+-]\d{2}:\d{2})\s+\[(?<level>\w{3,4})\]\s+(?<rest>.*)", 
        RegexOptions.Compiled);

    public LogSyncWorker(ILogger<LogSyncWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Orbitie Log Senkronizasyon Servisi başlatıldı.");

        if (!Directory.Exists(_logDirectory))
        {
            Directory.CreateDirectory(_logDirectory);
            _logger.LogWarning($"Logs klasörü bulunamadı ve oluşturuldu: {_logDirectory}");
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessLogFilesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Log tarama periyodu sırasında bir hata oluştu.");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }

        await FlushPendingLogsAsync();
    }

    private async Task ProcessLogFilesAsync(CancellationToken stoppingToken)
    {
        var readyToInsertLogs = new List<LogEntry>();
        var files = Directory.GetFiles(_logDirectory, "*.txt")
            .Concat(Directory.GetFiles(_logDirectory, "*.log"));

        foreach (var filePath in files)
        {
            ProcessSingleFile(filePath, readyToInsertLogs);
        }

        if (readyToInsertLogs.Any())
        {
            await BulkInsertToDatabaseAsync(readyToInsertLogs, stoppingToken);
        }
    }

    private void ProcessSingleFile(string filePath, List<LogEntry> readyToInsertLogs)
    {
        long currentOffset = _fileOffsets.TryGetValue(filePath, out var offset) ? offset : 0;

        try
        {
            // FileShare.ReadWrite ile dosya kilitlenmesini önler
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);

            if (fs.Length < currentOffset)
            {
                currentOffset = 0;
                _pendingLogs.Remove(filePath);
            }

            if (fs.Length == currentOffset) return;

            fs.Seek(currentOffset, SeekOrigin.Begin);

            using var reader = new StreamReader(fs, Encoding.UTF8);
            string? line;
            
            while ((line = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                var match = LogPattern.Match(line);
                if (match.Success)
                {
                    if (_pendingLogs.TryGetValue(filePath, out var pendingLog))
                    {
                        readyToInsertLogs.Add(pendingLog);
                    }

                    var restOfMessage = match.Groups["rest"].Value.Trim();
                    string? sourceContext = null;
                    string message = restOfMessage;

                    var firstSpaceIndex = restOfMessage.IndexOf(' ');
                    if (firstSpaceIndex > 0)
                    {
                        sourceContext = restOfMessage.Substring(0, firstSpaceIndex);
                        message = restOfMessage.Substring(firstSpaceIndex + 1).Trim();
                    }
                    else
                    {
                        sourceContext = restOfMessage;
                        message = string.Empty;
                    }

                    var newLog = new LogEntry
                    {
                        Timestamp = DateTimeOffset.Parse(match.Groups["timestamp"].Value),
                        LogLevel = match.Groups["level"].Value,
                        SourceContext = sourceContext,
                        Message = message,
                        Exception = null
                    };

                    _pendingLogs[filePath] = newLog;
                }
                else
                {
                    // Multiline Exception birleştirme
                    if (_pendingLogs.TryGetValue(filePath, out var pendingLog))
                    {
                        if (string.IsNullOrEmpty(pendingLog.Exception))
                            pendingLog.Exception = line;
                        else
                            pendingLog.Exception += Environment.NewLine + line;
                    }
                }
            }

            _fileOffsets[filePath] = fs.Position;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, $"Dosya işlenirken hata oluştu: {filePath}");
        }
    }

    private async Task BulkInsertToDatabaseAsync(List<LogEntry> logs, CancellationToken stoppingToken)
    {
        try
        {
            using var dt = new DataTable();
            dt.Columns.Add("Timestamp", typeof(DateTimeOffset));
            dt.Columns.Add("LogLevel", typeof(string));
            dt.Columns.Add("SourceContext", typeof(string));
            dt.Columns.Add("Message", typeof(string));
            dt.Columns.Add("Exception", typeof(string));

            foreach (var log in logs)
            {
                // DBNull.Value koruması
                dt.Rows.Add(
                    log.Timestamp, 
                    log.LogLevel, 
                    (object?)log.SourceContext ?? DBNull.Value, 
                    (object?)log.Message ?? DBNull.Value, 
                    (object?)log.Exception ?? DBNull.Value
                );
            }

            using var bulkCopy = new SqlBulkCopy(_connectionString)
            {
                DestinationTableName = "dbo.Logs",
                BatchSize = 5000,
                BulkCopyTimeout = 30
            };

            bulkCopy.ColumnMappings.Add("Timestamp", "Timestamp");
            bulkCopy.ColumnMappings.Add("LogLevel", "LogLevel");
            bulkCopy.ColumnMappings.Add("SourceContext", "SourceContext");
            bulkCopy.ColumnMappings.Add("Message", "Message");
            bulkCopy.ColumnMappings.Add("Exception", "Exception");

            await bulkCopy.WriteToServerAsync(dt, stoppingToken);
            
            _logger.LogInformation($"Başarıyla {logs.Count} yeni log veritabanına aktarıldı.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SqlBulkCopy sırasında veritabanı aktarım hatası oluştu.");
        }
    }

    private async Task FlushPendingLogsAsync()
    {
        var remainingLogs = _pendingLogs.Values.ToList();
        if (remainingLogs.Any())
        {
            _logger.LogInformation($"Servis durduruluyor. Bekleyen {remainingLogs.Count} adet son log aktarılıyor...");
            await BulkInsertToDatabaseAsync(remainingLogs, CancellationToken.None);
            _pendingLogs.Clear();
        }
    }
}

// log modeli
public class LogEntry
{
    public DateTimeOffset Timestamp { get; set; }
    public string LogLevel { get; set; } = string.Empty;
    public string? SourceContext { get; set; }
    public string? Message { get; set; }
    public string? Exception { get; set; }
}