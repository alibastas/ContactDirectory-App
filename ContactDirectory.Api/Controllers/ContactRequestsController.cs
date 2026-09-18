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
    public async Task<IActionResult> Create()
    {
        CreateContactRequestDto? dto;
        IFormFile? file = null;

        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync();
            dto = new CreateContactRequestDto
            {
                CommunicationType = form.ContainsKey("communicationType") ? form["communicationType"].ToString() : (form.ContainsKey("CommunicationType") ? form["CommunicationType"].ToString() : ""),
                Subject = form.ContainsKey("subject") ? form["subject"].ToString() : (form.ContainsKey("Subject") ? form["Subject"].ToString() : null),
                FirstName = form.ContainsKey("firstName") ? form["firstName"].ToString() : (form.ContainsKey("FirstName") ? form["FirstName"].ToString() : ""),
                LastName = form.ContainsKey("lastName") ? form["lastName"].ToString() : (form.ContainsKey("LastName") ? form["LastName"].ToString() : null),
                PhoneNumber = form.ContainsKey("phoneNumber") ? form["phoneNumber"].ToString() : (form.ContainsKey("PhoneNumber") ? form["PhoneNumber"].ToString() : ""),
                Email = form.ContainsKey("email") ? form["email"].ToString() : (form.ContainsKey("Email") ? form["Email"].ToString() : null),
                Message = form.ContainsKey("message") ? form["message"].ToString() : (form.ContainsKey("Message") ? form["Message"].ToString() : ""),
                City = form.ContainsKey("city") ? form["city"].ToString() : (form.ContainsKey("City") ? form["City"].ToString() : null),
                Branch = form.ContainsKey("branch") ? form["branch"].ToString() : (form.ContainsKey("Branch") ? form["Branch"].ToString() : null)
            };
            file = form.Files.FirstOrDefault();
        }
        else
        {
            dto = await Request.ReadFromJsonAsync<CreateContactRequestDto>();
        }

        if (dto == null) return BadRequest("Geçersiz istek içeriği.");

        var validationResults = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var validationContext = new System.ComponentModel.DataAnnotations.ValidationContext(dto);
        if (!System.ComponentModel.DataAnnotations.Validator.TryValidateObject(dto, validationContext, validationResults, true))
        {
            foreach (var err in validationResults)
            {
                ModelState.AddModelError(err.MemberNames.FirstOrDefault() ?? string.Empty, err.ErrorMessage ?? "Geçersiz alan");
            }
            return BadRequest(ModelState);
        }

        int userId = GetCurrentUserId();
        string username = GetCurrentUsername();

        try
        {
            var result = await _contactRequestService.CreateAsync(dto, userId, username, file);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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

    // GET: api/ContactRequests/{id}/attachment (Download attached file)
    [HttpGet("{id}/attachment")]
    public async Task<IActionResult> DownloadAttachment(int id)
    {
        int userId = GetCurrentUserId();
        string userRole = GetCurrentUserRole();

        var attachment = await _contactRequestService.GetAttachmentAsync(id, userId, userRole);
        if (attachment == null)
        {
            return NotFound("Ek dosya bulunamadı veya erişim yetkiniz yok.");
        }

        return File(attachment.Value.FileStream, attachment.Value.ContentType, attachment.Value.FileName);
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
