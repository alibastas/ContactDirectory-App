using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;

namespace ContactDirectory.Api.Interfaces;

public interface IContactService
{
    Task<PagedResult<ContactResponseDto>> GetContactsAsync(int userId, string? searchTerm, bool isFavoriteOnly, int page, int pageSize);
    Task<ContactResponseDto?> GetContactAsync(int id, int userId);
    Task<ContactResponseDto> CreateContactAsync(ContactCreateDto dto, int userId);
    Task<bool> UpdateContactAsync(int id, ContactUpdateDto dto, int userId);
    Task<bool> DeleteContactAsync(int id, int userId);
    Task<ContactStatsDto> GetContactStatsAsync(int userId);
    Task<List<ContactResponseDto>> GetFilteredContactsForExportAsync(int userId, string? searchTerm, bool isFavoriteOnly);
    Task<int> BulkCreateContactsAsync(int userId, List<ContactCreateDto> contacts);
}

