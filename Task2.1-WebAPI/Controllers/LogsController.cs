using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrbitieLogApi.Data;
using OrbitieLogApi.DTOs;

namespace OrbitieLogApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly LogDbContext _context;

    public LogsController(LogDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Task 2.1 - Log Listeleme ve Filtreleme (Pagination & Search)
    /// GET: /api/logs
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResponseDto<LogDto>>> GetLogs([FromQuery] LogQueryParameters parameters)
    {
        var query = _context.Logs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.LogLevel))
        {
            query = query.Where(x => x.LogLevel == parameters.LogLevel);
        }

        if (!string.IsNullOrWhiteSpace(parameters.SourceContext))
        {
            query = query.Where(x => x.SourceContext != null && x.SourceContext.Contains(parameters.SourceContext));
        }

        if (parameters.StartDate.HasValue)
        {
            query = query.Where(x => x.Timestamp >= parameters.StartDate.Value);
        }

        if (parameters.EndDate.HasValue)
        {
            query = query.Where(x => x.Timestamp <= parameters.EndDate.Value);
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)parameters.PageSize);

        var items = await query
            .OrderByDescending(x => x.Timestamp)
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(x => new LogDto
            {
                Id = x.Id,
                Timestamp = x.Timestamp,
                LogLevel = x.LogLevel,
                SourceContext = x.SourceContext,
                Message = x.Message,
                Exception = x.Exception
            })
            .ToListAsync();

        return Ok(new PagedResponseDto<LogDto>
        {
            Page = parameters.Page,
            PageSize = parameters.PageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Items = items
        });
    }

    /// <summary>
    /// Task 2.2 - Dashboard Özet Metrikler API'ı (KPI)
    /// GET: /api/logs/summary
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<LogSummaryDto>> GetLogSummary()
    {
        var counts = await _context.Logs
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Errors = g.Count(l => l.LogLevel == "ERR" || l.LogLevel == "Error"),
                Warnings = g.Count(l => l.LogLevel == "WRN" || l.LogLevel == "Warning" || l.LogLevel == "Warn")
            })
            .FirstOrDefaultAsync();

        var mostErrorModule = await _context.Logs
            .AsNoTracking()
            .Where(l => (l.LogLevel == "ERR" || l.LogLevel == "Error") 
                     && !string.IsNullOrEmpty(l.SourceContext))
            .GroupBy(l => l.SourceContext)
            .Select(g => new 
            { 
                Module = g.Key, 
                Count = g.Count() 
            })
            .OrderByDescending(x => x.Count)
            .Select(x => x.Module)
            .FirstOrDefaultAsync();

        var summary = new LogSummaryDto
        {
            TotalLogs = counts?.Total ?? 0,
            ErrorCount = counts?.Errors ?? 0,
            WarningCount = counts?.Warnings ?? 0,
            MostErrorModule = string.IsNullOrEmpty(mostErrorModule) ? "N/A" : mostErrorModule
        };

        return Ok(summary);
    }

    /// <summary>
    /// Task 2.3 - Timeline Grafiği (Zaman Serisi)
    /// GET: /api/logs/chart/timeline
    /// </summary>
    [HttpGet("chart/timeline")]
    public async Task<IActionResult> GetTimelineChartData(
        [FromQuery] DateTimeOffset? startDate = null, 
        [FromQuery] DateTimeOffset? endDate = null)
    {
        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
        {
            return BadRequest(new { message = "startDate, endDate tarihinden büyük olamaz." });
        }

        try
        {
            var query = _context.Logs.AsNoTracking();

            if (startDate.HasValue)
                query = query.Where(x => x.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(x => x.Timestamp <= endDate.Value);

            var dbResult = await query
                .GroupBy(x => x.Timestamp.Date)
                .Select(g => new 
                {
                    Date = g.Key,
                    TotalCount = g.Count(),
                    ErrorCount = g.Count(x => x.LogLevel == "ERR" || x.LogLevel == "Error"),
                    WarningCount = g.Count(x => x.LogLevel == "WRN" || x.LogLevel == "Warning" || x.LogLevel == "Warn")
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var result = dbResult.Select(x => new LogTimelineChartDto
            {
                Date = x.Date.ToString("yyyy-MM-dd"),
                TotalCount = x.TotalCount,
                ErrorCount = x.ErrorCount,
                WarningCount = x.WarningCount
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Timeline verisi alınırken bir veritabanı hatası oluştu.", error = ex.Message });
        }
    }

    /// <summary>
    /// Task 2.3 - Modül Bazlı Dağılım Grafiği (Bar/Pie Chart)
    /// GET: /api/logs/chart/by-module
    /// </summary>
    [HttpGet("chart/by-module")]
    public async Task<IActionResult> GetModuleChartData(
        [FromQuery] DateTimeOffset? startDate = null, 
        [FromQuery] DateTimeOffset? endDate = null,
        [FromQuery] int top = 10)
    {
        if (top <= 0) top = 10;

        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
        {
            return BadRequest(new { message = "startDate, endDate tarihinden büyük olamaz." });
        }

        try
        {
            var query = _context.Logs.AsNoTracking();

            if (startDate.HasValue)
                query = query.Where(x => x.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(x => x.Timestamp <= endDate.Value);

            var result = await query
                .GroupBy(x => (x.SourceContext == null || x.SourceContext == "") ? "Unknown" : x.SourceContext)
                .Select(g => new LogModuleChartDto
                {
                    ModuleName = g.Key,
                    TotalCount = g.Count(),
                    ErrorCount = g.Count(x => x.LogLevel == "ERR" || x.LogLevel == "Error")
                })
                .OrderByDescending(x => x.TotalCount)
                .Take(top)
                .ToListAsync();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Modül verisi alınırken bir veritabanı hatası oluştu.", error = ex.Message });
        }
    }
}