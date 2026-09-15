using System.Security.Claims;
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
        [FromQuery] int pageSize = 1000,
        [FromQuery] string? actionFilter = null)
    {
        var logs = await _auditLogService.GetLogsAsync(page, pageSize, actionFilter);
        return Ok(logs);
    }

    [HttpPut("users/{userId}/role")]
    public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateRoleDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Role) || 
            (request.Role != "Admin" && request.Role != "User"))
        {
            return BadRequest("Geçersiz rol. Sadece 'Admin' veya 'User' atanabilir.");
        }

        var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
        int.TryParse(currentUserIdStr, out var currentUserId);
        var currentUsername = User.Identity?.Name ?? "Admin";

        var success = await _auditLogService.UpdateUserRoleAsync(userId, request.Role, currentUserId, currentUsername);
        if (!success)
        {
            return NotFound("Kullanıcı bulunamadı.");
        }

        return Ok(new { message = $"Kullanıcı rolü başarıyla '{request.Role}' olarak güncellendi." });
    }
}

