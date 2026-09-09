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

    public async Task<PagedResult<ContactResponseDto>> GetContactsAsync(
        int userId, 
        string? searchTerm, 
        bool isFavoriteOnly, 
        int page, 
        int pageSize,
        string? firstName = null,
        string? lastName = null,
        string? phoneNumber = null,
        string? email = null)
    {
        var query = _context.Contacts.Where(c => c.UserId == userId);

        if (isFavoriteOnly)
        {
            query = query.Where(c => c.IsFavorite);
        }

        bool hasSearch = !string.IsNullOrWhiteSpace(searchTerm) ||
                         !string.IsNullOrWhiteSpace(firstName) ||
                         !string.IsNullOrWhiteSpace(lastName) ||
                         !string.IsNullOrWhiteSpace(phoneNumber) ||
                         !string.IsNullOrWhiteSpace(email);

        if (!hasSearch)
        {
            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(c => EF.Functions.Collate(c.FirstName ?? "", "tr-TR-x-icu"))
                .ThenBy(c => EF.Functions.Collate(c.LastName ?? "", "tr-TR-x-icu"))
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
        else
        {
            // Şifrelenmiş alanlar (PhoneNumber, Email) veritabanında AES-256 olarak saklandığından,
            // SQL seviyesinde LIKE araması yapılamaz. Bu nedenle kullanıcının rehberindeki kişiler
            // çekilir (EF Core ValueConverter ile otomatik çözülür) ve bellek üzerinde filtrelenir.
            var allUserContacts = await query
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

            var filtered = allUserContacts.AsEnumerable();

            // Genel Arama (searchTerm)
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var tokens = searchTerm.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                filtered = filtered.Where(c =>
                {
                    var fn = c.FirstName ?? "";
                    var ln = c.LastName ?? "";
                    var pn = c.PhoneNumber ?? "";
                    var em = c.Email ?? "";

                    return tokens.All(token =>
                        fn.Contains(token, StringComparison.CurrentCultureIgnoreCase) ||
                        ln.Contains(token, StringComparison.CurrentCultureIgnoreCase) ||
                        pn.Contains(token, StringComparison.OrdinalIgnoreCase) ||
                        em.Contains(token, StringComparison.OrdinalIgnoreCase));
                });
            }

            // Detaylı Arama Filtreleri
            if (!string.IsNullOrWhiteSpace(firstName))
            {
                var fnFilter = firstName.Trim();
                filtered = filtered.Where(c => (c.FirstName ?? "").Contains(fnFilter, StringComparison.CurrentCultureIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(lastName))
            {
                var lnFilter = lastName.Trim();
                filtered = filtered.Where(c => (c.LastName ?? "").Contains(lnFilter, StringComparison.CurrentCultureIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(phoneNumber))
            {
                var pnRaw = phoneNumber.Trim();
                var pnDigits = new string(pnRaw.Where(char.IsDigit).ToArray());
                filtered = filtered.Where(c =>
                {
                    var pn = c.PhoneNumber ?? "";
                    if (!string.IsNullOrEmpty(pnDigits))
                    {
                        var cDigits = new string(pn.Where(char.IsDigit).ToArray());
                        if (cDigits.Contains(pnDigits, StringComparison.OrdinalIgnoreCase)) return true;
                    }
                    return pn.Contains(pnRaw, StringComparison.OrdinalIgnoreCase);
                });
            }

            if (!string.IsNullOrWhiteSpace(email))
            {
                var emFilter = email.Trim();
                filtered = filtered.Where(c => (c.Email ?? "").Contains(emFilter, StringComparison.OrdinalIgnoreCase));
            }

            var filteredList = filtered.ToList();
            var totalCount = filteredList.Count;
            var items = filteredList
                .OrderBy(c => c.FirstName, StringComparer.CurrentCultureIgnoreCase)
                .ThenBy(c => c.LastName, StringComparer.CurrentCultureIgnoreCase)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<ContactResponseDto>
            {
                TotalCount = totalCount,
                Items = items
            };
        }
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

        var isFavoriteChanged = existing.IsFavorite != dto.IsFavorite;
        var onlyFavoriteChanged = isFavoriteChanged &&
            string.Equals(existing.FirstName?.Trim(), dto.FirstName?.Trim(), StringComparison.OrdinalIgnoreCase) &&
            string.Equals(existing.LastName?.Trim(), dto.LastName?.Trim(), StringComparison.OrdinalIgnoreCase) &&
            string.Equals(existing.PhoneNumber?.Trim(), dto.PhoneNumber?.Trim(), StringComparison.Ordinal) &&
            string.Equals(existing.Email?.Trim() ?? "", dto.Email?.Trim() ?? "", StringComparison.OrdinalIgnoreCase);

        existing.FirstName = dto.FirstName;
        existing.LastName = dto.LastName;
        existing.PhoneNumber = dto.PhoneNumber;
        existing.Email = dto.Email;
        existing.IsFavorite = dto.IsFavorite;

        await _context.SaveChangesAsync();

        var username = await GetUsernameAsync(userId);

        string logDetails;
        if (onlyFavoriteChanged)
        {
            logDetails = dto.IsFavorite
                ? $"Kişi favorilere eklendi: {existing.FirstName} {existing.LastName}"
                : $"Kişi favorilerden çıkarıldı: {existing.FirstName} {existing.LastName}";
        }
        else
        {
            logDetails = $"Kişi güncellendi: {existing.FirstName} {existing.LastName}";
        }

        await _auditLogService.LogAsync(
            userId,
            username,
            "UPDATE",
            "Contact",
            existing.Id,
            logDetails
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

    public async Task<List<ContactResponseDto>> GetFilteredContactsForExportAsync(
        int userId, 
        string? searchTerm, 
        bool isFavoriteOnly,
        string? firstName = null,
        string? lastName = null,
        string? phoneNumber = null,
        string? email = null)
    {
        var query = _context.Contacts.Where(c => c.UserId == userId);

        if (isFavoriteOnly)
        {
            query = query.Where(c => c.IsFavorite);
        }

        var allContacts = await query
            .OrderBy(c => EF.Functions.Collate(c.FirstName ?? "", "tr-TR-x-icu"))
            .ThenBy(c => EF.Functions.Collate(c.LastName ?? "", "tr-TR-x-icu"))
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

        bool hasSearch = !string.IsNullOrWhiteSpace(searchTerm) ||
                         !string.IsNullOrWhiteSpace(firstName) ||
                         !string.IsNullOrWhiteSpace(lastName) ||
                         !string.IsNullOrWhiteSpace(phoneNumber) ||
                         !string.IsNullOrWhiteSpace(email);

        if (!hasSearch)
        {
            return allContacts;
        }

        var filtered = allContacts.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var tokens = searchTerm.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            filtered = filtered.Where(c =>
            {
                var fn = c.FirstName ?? "";
                var ln = c.LastName ?? "";
                var pn = c.PhoneNumber ?? "";
                var em = c.Email ?? "";

                return tokens.All(token =>
                    fn.Contains(token, StringComparison.CurrentCultureIgnoreCase) ||
                    ln.Contains(token, StringComparison.CurrentCultureIgnoreCase) ||
                    pn.Contains(token, StringComparison.OrdinalIgnoreCase) ||
                    em.Contains(token, StringComparison.OrdinalIgnoreCase));
            });
        }

        if (!string.IsNullOrWhiteSpace(firstName))
        {
            var fnFilter = firstName.Trim();
            filtered = filtered.Where(c => (c.FirstName ?? "").Contains(fnFilter, StringComparison.CurrentCultureIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(lastName))
        {
            var lnFilter = lastName.Trim();
            filtered = filtered.Where(c => (c.LastName ?? "").Contains(lnFilter, StringComparison.CurrentCultureIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(phoneNumber))
        {
            var pnRaw = phoneNumber.Trim();
            var pnDigits = new string(pnRaw.Where(char.IsDigit).ToArray());
            filtered = filtered.Where(c =>
            {
                var pn = c.PhoneNumber ?? "";
                if (!string.IsNullOrEmpty(pnDigits))
                {
                    var cDigits = new string(pn.Where(char.IsDigit).ToArray());
                    if (cDigits.Contains(pnDigits, StringComparison.OrdinalIgnoreCase)) return true;
                }
                return pn.Contains(pnRaw, StringComparison.OrdinalIgnoreCase);
            });
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var emFilter = email.Trim();
            filtered = filtered.Where(c => (c.Email ?? "").Contains(emFilter, StringComparison.OrdinalIgnoreCase));
        }

        return filtered.ToList();
    }

    private static string NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
        return new string(phone.Where(char.IsDigit).ToArray());
    }

    public async Task<BulkContactResponseDto> BulkCreateContactsAsync(int userId, BulkContactRequestDto request)
    {
        if (request == null || request.Contacts == null || request.Contacts.Count == 0)
        {
            return new BulkContactResponseDto
            {
                AddedCount = 0,
                UpdatedCount = 0,
                SkippedCount = 0,
                Message = "Eklenecek kayıt bulunamadı."
            };
        }

        var strategy = (request.DuplicateStrategy ?? "skip").Trim().ToLowerInvariant();

        // Kullanıcının mevcut kişilerini çek (EF Core telefon ve e-postayı otomatik çözer)
        var existingContacts = await _context.Contacts
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var existingPhoneMap = new Dictionary<string, Contact>();
        foreach (var ec in existingContacts)
        {
            var norm = NormalizePhone(ec.PhoneNumber);
            if (!string.IsNullOrEmpty(norm) && !existingPhoneMap.ContainsKey(norm))
            {
                existingPhoneMap[norm] = ec;
            }
        }

        var addedCount = 0;
        var updatedCount = 0;
        var skippedCount = 0;
        var newEntitiesToAdd = new List<Contact>();
        var seenInBatch = new HashSet<string>();

        foreach (var dto in request.Contacts)
        {
            var fn = dto.FirstName?.Trim() ?? string.Empty;
            var ln = dto.LastName?.Trim() ?? string.Empty;
            var rawPhone = dto.PhoneNumber?.Trim() ?? string.Empty;
            var normPhone = NormalizePhone(rawPhone);
            var email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();

            if (string.IsNullOrWhiteSpace(fn) || string.IsNullOrWhiteSpace(rawPhone))
            {
                skippedCount++;
                continue;
            }

            bool isDuplicate = (!string.IsNullOrEmpty(normPhone) && existingPhoneMap.ContainsKey(normPhone))
                               || (!string.IsNullOrEmpty(normPhone) && seenInBatch.Contains(normPhone));

            if (isDuplicate)
            {
                if (strategy == "skip")
                {
                    skippedCount++;
                    continue;
                }
                else if (strategy == "update")
                {
                    if (!string.IsNullOrEmpty(normPhone) && existingPhoneMap.TryGetValue(normPhone, out var existingEntity))
                    {
                        existingEntity.FirstName = fn;
                        if (!string.IsNullOrWhiteSpace(ln)) existingEntity.LastName = ln;
                        if (!string.IsNullOrWhiteSpace(email)) existingEntity.Email = email;
                        updatedCount++;
                    }
                    else
                    {
                        var inBatchEntity = newEntitiesToAdd.FirstOrDefault(e => NormalizePhone(e.PhoneNumber) == normPhone);
                        if (inBatchEntity != null)
                        {
                            inBatchEntity.FirstName = fn;
                            if (!string.IsNullOrWhiteSpace(ln)) inBatchEntity.LastName = ln;
                            if (!string.IsNullOrWhiteSpace(email)) inBatchEntity.Email = email;
                            updatedCount++;
                        }
                        else
                        {
                            skippedCount++;
                        }
                    }
                }
                else // "allow"
                {
                    var entity = new Contact
                    {
                        FirstName = fn,
                        LastName = ln,
                        PhoneNumber = rawPhone,
                        Email = email,
                        IsFavorite = dto.IsFavorite,
                        UserId = userId
                    };
                    newEntitiesToAdd.Add(entity);
                    addedCount++;
                    if (!string.IsNullOrEmpty(normPhone)) seenInBatch.Add(normPhone);
                }
            }
            else
            {
                var entity = new Contact
                {
                    FirstName = fn,
                    LastName = ln,
                    PhoneNumber = rawPhone,
                    Email = email,
                    IsFavorite = dto.IsFavorite,
                    UserId = userId
                };
                newEntitiesToAdd.Add(entity);
                addedCount++;
                if (!string.IsNullOrEmpty(normPhone))
                {
                    seenInBatch.Add(normPhone);
                    existingPhoneMap[normPhone] = entity;
                }
            }
        }

        if (newEntitiesToAdd.Count > 0)
        {
            await _context.Contacts.AddRangeAsync(newEntitiesToAdd);
        }

        await _context.SaveChangesAsync();

        var username = await GetUsernameAsync(userId);
        await _auditLogService.LogAsync(
            userId,
            username,
            "CREATE",
            "Contact",
            null,
            $"Toplu aktarım tamamlandı: {addedCount} yeni eklendi, {updatedCount} güncellendi, {skippedCount} atlandı. (Strateji: {strategy})"
        );

        return new BulkContactResponseDto
        {
            AddedCount = addedCount,
            UpdatedCount = updatedCount,
            SkippedCount = skippedCount,
            Message = $"{addedCount} yeni kişi eklendi" +
                      (updatedCount > 0 ? $", {updatedCount} kişi güncellendi" : "") +
                      (skippedCount > 0 ? $", {skippedCount} yinelenen/geçersiz kayıt atlandı" : "") + "."
        };
    }

    public async Task<(bool IsSuccess, int DeletedCount, string Message)> DeleteAllContactsAsync(int userId, string password)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return (false, 0, "Kullanıcı hesabı bulunamadı.");
        }

        if (string.IsNullOrWhiteSpace(password) || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return (false, 0, "Girdiğiniz hesap şifresi hatalı. Rehber silme işlemi iptal edildi.");
        }

        var contacts = await _context.Contacts
            .Where(c => c.UserId == userId)
            .ToListAsync();

        int count = contacts.Count;
        if (count > 0)
        {
            _context.Contacts.RemoveRange(contacts);
            await _context.SaveChangesAsync();

            var username = await GetUsernameAsync(userId);
            await _auditLogService.LogAsync(
                userId,
                username,
                "DELETE",
                "Contact",
                null,
                $"Kullanıcı şifre doğrulamasıyla tüm rehberini temizledi ({count} kişi silindi)."
            );
        }

        return (true, count, $"Rehberinizdeki tüm kişiler ({count} kişi) başarıyla silindi.");
    }
}

