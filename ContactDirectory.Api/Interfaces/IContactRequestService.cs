using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;

namespace ContactDirectory.Api.Interfaces;

public interface IContactRequestService
{
    Task<ContactRequest> CreateAsync(CreateContactRequestDto dto, int userId, string username);
    Task<List<ContactRequest>> GetAllAsync(string? status = null);
    Task<List<ContactRequest>> GetMyRequestsAsync(int userId, string? status = null);
    Task<ContactRequest?> GetByIdAsync(int id, int userId, string userRole);
    Task<ContactRequestMessage> SendMessageAsync(int requestId, string messageText, int userId, string username, string userRole);
    Task<bool> UpdateStatusAsync(int requestId, string status, int userId, string username);
    Task<bool> MarkAsViewedAsync(int requestId, int userId, string userRole);
    Task<List<ContactRequest>> GetUnviewedRequestsAsync(int userId, string userRole);
    Task<bool> DeleteAsync(int id, int userId, string username, string userRole);
}
