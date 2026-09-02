using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;
using ContactDirectory.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace ContactDirectory.Api.Services;

public class ContactService : IContactService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public ContactService(AppDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<ContactResponseDto>> GetContactsAsync(int userId, string? searchTerm, bool isFavoriteOnly, int page, int pageSize)
    {
        var query = _context.Contacts.Where(c => c.UserId == userId);

        if (isFavoriteOnly)
        {
            query = query.Where(c => c.IsFavorite);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            // Token-Based Search: Arama metnini boşluklardan ayır.
            // "ali öz" → ["ali", "öz"]
            // Her token'ın en az bir alanda eşleşmesi gerekir (AND mantığı).
            //
            // PostgreSQL Türkçe Karakter Desteği:
            // Veritabanı C locale ile oluşturulmuş, bu yüzden ILIKE Türkçe
            // büyük-küçük harf dönüşümünü (Ö↔ö, Ş↔ş, İ↔i, Ğ↔ğ) yapamıyor.
            // Çözüm: ICU collation "tr-TR-x-icu" ile LOWER() kullanmak.
            var tokens = searchTerm.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);

            foreach (var token in tokens)
            {
                var pattern = $"%{token.ToLowerInvariant()}%";
                query = query.Where(c =>
                    EF.Functions.Like(
                        EF.Functions.Collate(c.FirstName ?? "", "tr-TR-x-icu").ToLower(), pattern) ||
                    EF.Functions.Like(
                        EF.Functions.Collate(c.LastName ?? "", "tr-TR-x-icu").ToLower(), pattern) ||
                    EF.Functions.Like(
                        EF.Functions.Collate(c.PhoneNumber ?? "", "tr-TR-x-icu").ToLower(), pattern) ||
                    EF.Functions.Like(
                        EF.Functions.Collate(c.Email ?? "", "tr-TR-x-icu").ToLower(), pattern));
            }
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => EF.Functions.Collate(c.FirstName ?? "", "tr-TR-x-icu"))
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ContactResponseDto
            {
                Id = c.Id,
                FirstName = c.FirstName,
                LastName = c.LastName,
                PhoneNumber = c.PhoneNumber,
                Email = c.Email,
                IsFavorite = c.IsFavorite
            })
            .ToListAsync();

        return new PagedResult<ContactResponseDto>
        {
            TotalCount = totalCount,
            Items = items
        };
    }

    public async Task<ContactResponseDto?> GetContactAsync(int id, int userId)
    {
        return await _context.Contacts
            .Where(c => c.Id == id && c.UserId == userId)
            .Select(c => new ContactResponseDto
            {
                Id = c.Id,
                FirstName = c.FirstName,
                LastName = c.LastName,
                PhoneNumber = c.PhoneNumber,
                Email = c.Email,
                IsFavorite = c.IsFavorite
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ContactResponseDto> CreateContactAsync(ContactCreateDto dto, int userId)
    {
        var contact = new Contact
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            PhoneNumber = dto.PhoneNumber,
            Email = dto.Email,
            IsFavorite = dto.IsFavorite,
            UserId = userId
        };

        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();

        var username = await GetUsernameAsync(userId);
        await _auditLogService.LogAsync(
            userId,
            username,
            "CREATE",
            "Contact",
            contact.Id,
            $"Yeni kişi eklendi: {contact.FirstName} {contact.LastName} ({contact.PhoneNumber})"
        );

        return new ContactResponseDto
        {
            Id = contact.Id,
            FirstName = contact.FirstName,
            LastName = contact.LastName,
            PhoneNumber = contact.PhoneNumber,
            Email = contact.Email,
            IsFavorite = contact.IsFavorite
        };
    }

    public async Task<bool> UpdateContactAsync(int id, ContactUpdateDto dto, int userId)
    {
        var existing = await _context.Contacts
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (existing == null)
        {
            return false;
        }

        existing.FirstName = dto.FirstName;
        existing.LastName = dto.LastName;
        existing.PhoneNumber = dto.PhoneNumber;
        existing.Email = dto.Email;
        existing.IsFavorite = dto.IsFavorite;

        await _context.SaveChangesAsync();

        var username = await GetUsernameAsync(userId);
        await _auditLogService.LogAsync(
            userId,
            username,
            "UPDATE",
            "Contact",
            existing.Id,
            $"Kişi güncellendi: {existing.FirstName} {existing.LastName}"
        );

        return true;
    }

    public async Task<bool> DeleteContactAsync(int id, int userId)
    {
        var contact = await _context.Contacts
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (contact == null)
        {
            return false;
        }

        var fullName = $"{contact.FirstName} {contact.LastName}";
        var contactId = contact.Id;

        _context.Contacts.Remove(contact);
        await _context.SaveChangesAsync();

        var username = await GetUsernameAsync(userId);
        await _auditLogService.LogAsync(
            userId,
            username,
            "DELETE",
            "Contact",
            contactId,
            $"Kişi silindi: {fullName}"
        );

        return true;
    }

    private async Task<string> GetUsernameAsync(int userId)
    {
        return await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.Username)
            .FirstOrDefaultAsync() ?? $"User#{userId}";
    }

    public async Task<ContactStatsDto> GetContactStatsAsync(int userId)
    {
        var totalContacts = await _context.Contacts.CountAsync(c => c.UserId == userId);
        var favoriteContacts = await _context.Contacts.CountAsync(c => c.UserId == userId && c.IsFavorite);

        return new ContactStatsDto
        {
            TotalContacts = totalContacts,
            FavoriteContacts = favoriteContacts
        };
    }
}
