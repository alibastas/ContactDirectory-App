using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;
using ContactDirectory.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace ContactDirectory.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ContactRequestsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ContactRequestsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    [EnableRateLimiting("ContactRequestRateLimit")]
    public async Task<IActionResult> Create([FromBody] CreateContactRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

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
            CreatedAt = DateTime.UtcNow
        };

        _context.ContactRequests.Add(contactRequest);
        await _context.SaveChangesAsync();

        return Ok(contactRequest);
    }

    // Admin-only: list all requests sorted by creation date descending
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.ContactRequests
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(list);
    }

    // Admin-only: delete a contact request
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var request = await _context.ContactRequests.FindAsync(id);
        if (request == null)
        {
            return NotFound();
        }

        _context.ContactRequests.Remove(request);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
