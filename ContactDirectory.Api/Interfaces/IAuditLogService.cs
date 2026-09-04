using ContactDirectory.Core.DTOs;

namespace ContactDirectory.Api.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(int userId, string username, string action, string entityName, int? entityId, string details);
    Task<PagedResult<AuditLogDto>> GetLogsAsync(int page = 1, int pageSize = 20, string? actionFilter = null);
    Task<AdminDashboardDto> GetAdminStatsAsync();
    Task<bool> UpdateUserRoleAsync(int targetUserId, string newRole, int performedByUserId, string performedByUsername);
}

