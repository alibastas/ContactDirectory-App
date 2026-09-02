using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ContactDirectory.Api.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
[ApiController]
public class AdminController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AdminController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<AdminDashboardDto>> GetAdminStats()
    {
        var stats = await _auditLogService.GetAdminStatsAsync();
        return Ok(stats);
    }

    [HttpGet("logs")]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? actionFilter = null)
    {
        var logs = await _auditLogService.GetLogsAsync(page, pageSize, actionFilter);
        return Ok(logs);
    }
}
