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
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        int userId = GetCurrentUserId();
        string username = GetCurrentUsername();

        var result = await _contactRequestService.CreateAsync(dto, userId, username);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _contactRequestService.GetAllAsync();
        return Ok(list);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        int userId = GetCurrentUserId();
        string username = GetCurrentUsername();

        var success = await _contactRequestService.DeleteAsync(id, userId, username);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    // Helper methods to extract user identity from JWT claims
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
            throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");
        return int.Parse(userIdClaim);
    }

    private string GetCurrentUsername()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value ?? "Kullanıcı";
    }
}