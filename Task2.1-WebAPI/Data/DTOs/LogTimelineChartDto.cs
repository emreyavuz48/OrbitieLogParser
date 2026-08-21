namespace OrbitieLogApi.DTOs;

public class LogTimelineChartDto
{
    public string Date { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int ErrorCount { get; set; }
    public int WarningCount { get; set; }
}