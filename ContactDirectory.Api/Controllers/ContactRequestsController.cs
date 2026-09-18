using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace ContactDirectory.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ContactRequestsController : ControllerBase
{
    private readonly IContactRequestService _contactRequestService;

    public ContactRequestsController(IContactRequestService contactRequestService)
    {
        _contactRequestService = contactRequestService;
    }

    [HttpPost]
    [EnableRateLimiting("ContactRequestRateLimit")]
    public async Task<IActionResult> Create([FromBody] CreateContactRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        int userId = GetCurrentUserId();
        string username = GetCurrentUsername();

        var result = await _contactRequestService.CreateAsync(dto, userId, username);
        return Ok(result);
    }

    // GET: api/ContactRequests (Admin: get all requests, optionally filtered by status)
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var list = await _contactRequestService.GetAllAsync(status);
        return Ok(list);
    }

    // GET: api/ContactRequests/my (User: get current user's requests)
    [HttpGet("my")]
    public async Task<IActionResult> GetMyRequests([FromQuery] string? status)
    {
        int userId = GetCurrentUserId();
        var list = await _contactRequestService.GetMyRequestsAsync(userId, status);
        return Ok(list);
    }

    // GET: api/ContactRequests/{id} (Get request details with messages)
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        int userId = GetCurrentUserId();
        string userRole = GetCurrentUserRole();

        var item = await _contactRequestService.GetByIdAsync(id, userId, userRole);
        if (item == null) return NotFound("Talep bulunamadı veya erişim yetkiniz yok.");

        return Ok(item);
    }

    // POST: api/ContactRequests/{id}/messages (Append message to request chat)
    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(int id, [FromBody] SendMessageDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        int userId = GetCurrentUserId();
        string username = GetCurrentUsername();
        string userRole = GetCurrentUserRole();

        try
        {
            var msg = await _contactRequestService.SendMessageAsync(id, dto.Message, userId, username, userRole);
            return Ok(msg);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    // PUT: api/ContactRequests/{id}/status (Admin: update status to Pending or Completed)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        int userId = GetCurrentUserId();
        string username = GetCurrentUsername();

        var success = await _contactRequestService.UpdateStatusAsync(id, dto.Status, userId, username);
        if (!success) return NotFound();

        return NoContent();
    }

    // GET: api/ContactRequests/unviewed (Fetch unviewed requests for notification popup)
    [HttpGet("unviewed")]
    public async Task<IActionResult> GetUnviewed()
    {
        int userId = GetCurrentUserId();
        string userRole = GetCurrentUserRole();

        var list = await _contactRequestService.GetUnviewedRequestsAsync(userId, userRole);
        return Ok(list);
    }

    // PUT: api/ContactRequests/{id}/mark-viewed (Mark request as viewed by current role)
    [HttpPut("{id}/mark-viewed")]
    public async Task<IActionResult> MarkAsViewed(int id)
    {
        int userId = GetCurrentUserId();
        string userRole = GetCurrentUserRole();

        await _contactRequestService.MarkAsViewedAsync(id, userId, userRole);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        int userId = GetCurrentUserId();
        string username = GetCurrentUsername();
        string userRole = GetCurrentUserRole();

        try
        {
            var success = await _contactRequestService.DeleteAsync(id, userId, username, userRole);
            if (!success) return NotFound("Talep bulunamadı.");

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    // Helper methods
    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (claim == null) throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");
        return int.Parse(claim);
    }

    private string GetCurrentUsername()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value ?? "Kullanıcı";
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
    }
}

public class UpdateStatusDto
{
    public string Status { get; set; } = "Pending";
}
