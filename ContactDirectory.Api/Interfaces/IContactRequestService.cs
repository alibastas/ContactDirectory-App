using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;

namespace ContactDirectory.Api.Interfaces;

public interface IContactRequestService
{
    Task<ContactRequest> CreateAsync(CreateContactRequestDto dto, int userId, string username);
    Task<List<ContactRequest>> GetAllAsync();
    Task<bool> DeleteAsync(int id, int userId, string username);
}