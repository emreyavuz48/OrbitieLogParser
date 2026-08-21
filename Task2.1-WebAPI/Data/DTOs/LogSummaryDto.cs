namespace OrbitieLogApi.DTOs;

public class LogSummaryDto
{
    public int TotalLogs { get; set; }
    public int ErrorCount { get; set; }
    public int WarningCount { get; set; }
    public string MostErrorModule { get; set; } = "N/A";
}