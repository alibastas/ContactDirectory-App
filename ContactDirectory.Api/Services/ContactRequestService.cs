using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;
using ContactDirectory.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace ContactDirectory.Api.Services;

public class ContactRequestService : IContactRequestService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public ContactRequestService(AppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<ContactRequest> CreateAsync(CreateContactRequestDto dto, int userId, string username)
    {
        var contactRequest = new ContactRequest
        {
            CommunicationType = dto.CommunicationType.Trim(),
            Subject = dto.Subject?.Trim(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName?.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Email = dto.Email?.Trim().ToLowerInvariant(),
            Message = dto.Message.Trim(),
            City = dto.City?.Trim(),
            Branch = dto.Branch?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UserId = userId
        };

        _context.ContactRequests.Add(contactRequest);
        await _context.SaveChangesAsync();

        // Audit Log entry matching UI standard action types
        await _auditLogService.LogAsync(
            userId: userId,
            username: username,
            action: "CREATE",
            entityName: "ContactRequest",
            entityId: contactRequest.Id,
            details: $"İletişim talebi oluşturuldu. Tür: {contactRequest.CommunicationType}, Konu: {contactRequest.Subject}"
        );

        return contactRequest;
    }

    public async Task<List<ContactRequest>> GetAllAsync()
    {
        return await _context.ContactRequests
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> DeleteAsync(int id, int userId, string username)
    {
        var request = await _context.ContactRequests.FindAsync(id);
        if (request == null)
            return false;

        _context.ContactRequests.Remove(request);
        await _context.SaveChangesAsync();

        // Audit Log entry matching UI standard action types
        await _auditLogService.LogAsync(
            userId: userId,
            username: username,
            action: "DELETE",
            entityName: "ContactRequest",
            entityId: id,
            details: $"İletişim talebi silindi. Sahibi: {request.FirstName} {request.LastName}, Tür: {request.CommunicationType}"
        );

        return true;
    }
}