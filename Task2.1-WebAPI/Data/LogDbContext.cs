using Microsoft.EntityFrameworkCore;
using OrbitieLogApi.Models;

namespace OrbitieLogApi.Data;

public class LogDbContext : DbContext
{
    public LogDbContext(DbContextOptions<LogDbContext> options) : base(options)
    {
    }

    public DbSet<Log> Logs { get; set; }
}