namespace OrbitieLogApi.DTOs;

public class LogModuleChartDto
{
    public string ModuleName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int ErrorCount { get; set; }
}