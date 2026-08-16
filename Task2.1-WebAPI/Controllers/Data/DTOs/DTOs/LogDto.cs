namespace OrbitieLogApi.DTOs;

public class LogDto
{
    public int Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string? LogLevel { get; set; }
    public string? SourceContext { get; set; }
    public string? Message { get; set; }
    public string? Exception { get; set; }
}