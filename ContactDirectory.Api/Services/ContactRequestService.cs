using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;
using ContactDirectory.DataAccess;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ContactDirectory.Api.Services;

public class ContactRequestService : IContactRequestService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly IWebHostEnvironment _env;

    private static readonly string[] AllowedAttachmentExtensions = new[]
    {
        ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".doc", ".docx", ".xls", ".xlsx"
    };
    private const long MaxAttachmentSizeBytes = 10 * 1024 * 1024; // 10 MB

    public ContactRequestService(AppDbContext context, IAuditLogService auditLogService, IWebHostEnvironment env)
    {
        _context = context;
        _auditLogService = auditLogService;
        _env = env;
    }

    public async Task<ContactRequest> CreateAsync(CreateContactRequestDto dto, int userId, string username, IFormFile? file = null)
    {
        string? storedFileName = null;
        string? originalFileName = null;
        string? contentType = null;
        long? fileSize = null;

        if (file != null && file.Length > 0)
        {
            if (file.Length > MaxAttachmentSizeBytes)
            {
                throw new ArgumentException("Dosya boyutu en fazla 10 MB olabilir.");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedAttachmentExtensions.Contains(extension))
            {
                throw new ArgumentException("Desteklenmeyen dosya türü. Yalnızca Resim (PNG, JPG, WEBP), PDF, Word ve Excel dosyaları yüklenebilir.");
            }

            var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", "contact-requests");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            storedFileName = $"{Guid.NewGuid():N}{extension}";
            var destinationPath = Path.Combine(uploadsFolder, storedFileName);

            using (var stream = new FileStream(destinationPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            originalFileName = Path.GetFileName(file.FileName);
            contentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;
            fileSize = file.Length;
        }

        var contactRequest = new ContactRequest
        {
            CommunicationType = dto.CommunicationType.Trim(),
            Subject = dto.Subject?.Trim(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName?.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Email = CleanAndNormalizeEmail(dto.Email),
            Message = dto.Message.Trim(),
            City = dto.City?.Trim(),
            Branch = dto.Branch?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UserId = userId,
            Status = "Pending",
            IsViewedByAdmin = false,
            IsViewedByUser = true,
            IsDeletedByAdmin = false,
            IsDeletedByUser = false,
            AttachmentFileName = originalFileName,
            AttachmentContentType = contentType,
            AttachmentStoredFileName = storedFileName,
            AttachmentFileSize = fileSize
        };

        _context.ContactRequests.Add(contactRequest);
        await _context.SaveChangesAsync();


        // Add initial message to the chat history
        string senderDisplayName = !string.IsNullOrWhiteSpace(contactRequest.LastName)
            ? $"{contactRequest.FirstName} {contactRequest.LastName} (@{username})"
            : $"{contactRequest.FirstName} (@{username})";

        var initialMessage = new ContactRequestMessage
        {
            ContactRequestId = contactRequest.Id,
            SenderUserId = userId,
            SenderName = senderDisplayName,
            SenderRole = "User",
            Message = contactRequest.Message,
            CreatedAt = contactRequest.CreatedAt
        };
        _context.ContactRequestMessages.Add(initialMessage);
        await _context.SaveChangesAsync();

        contactRequest.Username = username;

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

    public async Task<List<ContactRequest>> GetAllAsync(string? status = null)
    {
        var query = _context.ContactRequests
            .Include(r => r.Messages.OrderBy(m => m.CreatedAt))
            .Where(r => !r.IsDeletedByAdmin)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        await PopulateUsernamesAsync(list);
        return list;
    }

    public async Task<List<ContactRequest>> GetMyRequestsAsync(int userId, string? status = null)
    {
        var query = _context.ContactRequests
            .Include(r => r.Messages.OrderBy(m => m.CreatedAt))
            .Where(r => r.UserId == userId && !r.IsDeletedByUser);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        await PopulateUsernamesAsync(list);
        return list;
    }

    public async Task<ContactRequest?> GetByIdAsync(int id, int userId, string userRole)
    {
        var request = await _context.ContactRequests
            .Include(r => r.Messages.OrderBy(m => m.CreatedAt))
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null) return null;

        // Authorization and soft delete checks
        if (userRole == "Admin")
        {
            if (request.IsDeletedByAdmin) return null;
        }
        else
        {
            if (request.UserId != userId || request.IsDeletedByUser) return null;
        }

        await PopulateUsernamesAsync(new List<ContactRequest> { request });
        return request;
    }

    public async Task<(Stream FileStream, string ContentType, string FileName)?> GetAttachmentAsync(int requestId, int userId, string userRole)
    {
        var request = await _context.ContactRequests.FindAsync(requestId);
        if (request == null) return null;

        // Authorization check: User can only access own request, Admin can access all non-deleted by admin
        if (userRole == "Admin")
        {
            if (request.IsDeletedByAdmin) return null;
        }
        else
        {
            if (request.UserId != userId || request.IsDeletedByUser) return null;
        }

        if (string.IsNullOrEmpty(request.AttachmentStoredFileName))
            return null;

        var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", "contact-requests");
        var filePath = Path.Combine(uploadsFolder, request.AttachmentStoredFileName);

        if (!File.Exists(filePath))
            return null;

        var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var contentType = request.AttachmentContentType ?? "application/octet-stream";
        var fileName = request.AttachmentFileName ?? "attachment";

        return (fileStream, contentType, fileName);
    }


    public async Task<ContactRequestMessage> SendMessageAsync(int requestId, string messageText, int userId, string username, string userRole)
    {
        var request = await _context.ContactRequests.FindAsync(requestId);
        if (request == null)
            throw new KeyNotFoundException("Talep bulunamadı.");

        if (userRole != "Admin" && request.UserId != userId)
            throw new UnauthorizedAccessException("Bu talebe mesaj yazma yetkiniz yok.");

        string senderDisplayName;
        if (userRole == "Admin")
        {
            senderDisplayName = username;
        }
        else
        {
            senderDisplayName = !string.IsNullOrWhiteSpace(request.LastName)
                ? $"{request.FirstName} {request.LastName} (@{username})"
                : $"{request.FirstName} (@{username})";
        }

        var msg = new ContactRequestMessage
        {
            ContactRequestId = requestId,
            SenderUserId = userId,
            SenderName = senderDisplayName,
            SenderRole = userRole == "Admin" ? "Admin" : "User",
            Message = messageText.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.ContactRequestMessages.Add(msg);

        // Update unread and notification flags
        if (userRole == "Admin")
        {
            request.IsViewedByAdmin = true;
            request.IsViewedByUser = false;
        }
        else
        {
            request.IsViewedByUser = true;
            request.IsViewedByAdmin = false;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId: userId,
            username: username,
            action: "UPDATE",
            entityName: "ContactRequest",
            entityId: requestId,
            details: $"Talebe yanıt/mesaj eklendi. Rol: {msg.SenderRole}"
        );

        return msg;
    }

    public async Task<bool> UpdateStatusAsync(int requestId, string status, int userId, string username)
    {
        var request = await _context.ContactRequests.FindAsync(requestId);
        if (request == null) return false;

        request.Status = status;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId: userId,
            username: username,
            action: "UPDATE",
            entityName: "ContactRequest",
            entityId: requestId,
            details: $"Talep durumu güncellendi: {status}"
        );

        return true;
    }

    public async Task<bool> MarkAsViewedAsync(int requestId, int userId, string userRole)
    {
        var request = await _context.ContactRequests.FindAsync(requestId);
        if (request == null) return false;

        if (userRole == "Admin")
        {
            request.IsViewedByAdmin = true;
        }
        else if (request.UserId == userId)
        {
            request.IsViewedByUser = true;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ContactRequest>> GetUnviewedRequestsAsync(int userId, string userRole)
    {
        List<ContactRequest> list;
        if (userRole == "Admin")
        {
            list = await _context.ContactRequests
                .Where(r => !r.IsViewedByAdmin && !r.IsDeletedByAdmin)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
        else
        {
            list = await _context.ContactRequests
                .Where(r => r.UserId == userId && !r.IsViewedByUser && !r.IsDeletedByUser)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        await PopulateUsernamesAsync(list);
        return list;
    }

    private async Task PopulateUsernamesAsync(List<ContactRequest> requests)
    {
        if (requests == null || requests.Count == 0) return;

        var userIds = requests.Select(r => r.UserId).Distinct().ToList();
        var users = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Username })
            .ToDictionaryAsync(u => u.Id, u => u.Username);

        foreach (var req in requests)
        {
            if (users.TryGetValue(req.UserId, out var uname))
            {
                req.Username = uname;
            }
        }
    }

    public async Task<bool> DeleteAsync(int id, int userId, string username, string userRole)
    {
        var request = await _context.ContactRequests.FindAsync(id);
        if (request == null) return false;

        // Authorization check: non-admins can only delete their own requests
        if (userRole != "Admin" && request.UserId != userId)
        {
            throw new UnauthorizedAccessException("You are not authorized to delete this request.");
        }

        // Independent soft deletion per side
        if (userRole == "Admin")
        {
            request.IsDeletedByAdmin = true;
        }
        else
        {
            request.IsDeletedByUser = true;
        }

        // Hard delete once deleted by both sides
        if (request.IsDeletedByAdmin && request.IsDeletedByUser)
        {
            if (!string.IsNullOrEmpty(request.AttachmentStoredFileName))
            {
                try
                {
                    var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", "contact-requests");
                    var filePath = Path.Combine(uploadsFolder, request.AttachmentStoredFileName);
                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                    }
                }
                catch
                {
                    // Ignore file delete errors during database cleanup
                }
            }

            _context.ContactRequests.Remove(request);
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId: userId,
            username: username,
            action: "DELETE",
            entityName: "ContactRequest",
            entityId: id,
            details: $"İletişim talebi silindi (Taraf: {userRole}, Silici: {username}). Sahibi: {request.FirstName} {request.LastName}"
        );

        return true;
    }

    private static string? CleanAndNormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        var trimmed = email.Trim().ToLowerInvariant();

        // Sanitize punycode and common Turkish keyboard typos
        trimmed = trimmed.Replace("xn--gmal-75a", "gmail.com")
                         .Replace("xn--gmai-nza", "gmail.com")
                         .Replace("gmaıl", "gmail")
                         .Replace("hotmaıl", "hotmail")
                         .Replace("outmaıl", "outlook");

        // Normalize Turkish characters in email local-part
        trimmed = trimmed.Replace('ı', 'i')
                         .Replace('ğ', 'g')
                         .Replace('ü', 'u')
                         .Replace('ş', 's')
                         .Replace('ö', 'o')
                         .Replace('ç', 'c');

        return trimmed;
    }
}
