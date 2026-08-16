using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrbitieLogApi.Models;

[Table("Logs", Schema = "dbo")]
public class Log
{
    [Key]
    public int Id { get; set; }
    
    public DateTimeOffset Timestamp { get; set; }
    
    [MaxLength(10)]
    public string? LogLevel { get; set; }
    
    [MaxLength(255)]
    public string? SourceContext { get; set; }
    
    public string? Message { get; set; }
    
    public string? Exception { get; set; }
}