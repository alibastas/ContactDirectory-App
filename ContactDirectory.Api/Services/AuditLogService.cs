using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;
using ContactDirectory.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace ContactDirectory.Api.Services;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _context;

    public AuditLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(int userId, string username, string action, string entityName, int? entityId, string details)
    {
        var log = new AuditLog
        {
            UserId = userId,
            Username = username,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = details,
            Timestamp = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<PagedResult<AuditLogDto>> GetLogsAsync(int page = 1, int pageSize = 20, string? actionFilter = null)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(actionFilter))
        {
            query = query.Where(l => l.Action.ToUpper() == actionFilter.ToUpper());
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AuditLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                Username = l.Username,
                Action = l.Action,
                EntityName = l.EntityName,
                EntityId = l.EntityId,
                Details = l.Details,
                Timestamp = l.Timestamp
            })
            .ToListAsync();

        return new PagedResult<AuditLogDto>
        {
            TotalCount = totalCount,
            Items = items
        };
    }

    public async Task<AdminDashboardDto> GetAdminStatsAsync()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalContacts = await _context.Contacts.CountAsync();
        var totalLogs = await _context.AuditLogs.CountAsync();

        var userSummaries = await _context.Users
            .Select(u => new UserSummaryDto
            {
                UserId = u.Id,
                Username = u.Username,
                Role = u.Role,
                ContactCount = u.Contacts.Count(),
                AvatarUrl = u.AvatarUrl
            })
            .OrderByDescending(u => u.ContactCount)
            .ToListAsync();

        return new AdminDashboardDto
        {
            TotalUsers = totalUsers,
            TotalContacts = totalContacts,
            TotalLogs = totalLogs,
            UserSummaries = userSummaries
        };
    }

    public async Task<bool> UpdateUserRoleAsync(int targetUserId, string newRole, int performedByUserId, string performedByUsername)
    {
        var user = await _context.Users.FindAsync(targetUserId);
        if (user == null) return false;

        var oldRole = user.Role;
        user.Role = newRole;
        await _context.SaveChangesAsync();

        await LogAsync(
            performedByUserId,
            performedByUsername,
            "UPDATE",
            "UserRole",
            user.Id,
            $"Kullanıcı rolü güncellendi: '{user.Username}' kullanıcısının rolü '{oldRole}' -> '{newRole}' yapıldı."
        );

        return true;
    }
}

