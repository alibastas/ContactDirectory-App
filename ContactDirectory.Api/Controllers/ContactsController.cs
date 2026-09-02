using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ContactDirectory.Api.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ContactsController : ControllerBase
{
    private readonly IContactService _contactService;

    public ContactsController(IContactService contactService)
    {
        _contactService = contactService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ContactResponseDto>>> GetContacts(
        [FromQuery] string? searchTerm = null, 
        [FromQuery] bool isFavoriteOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        int userId = GetCurrentUserId();
        var result = await _contactService.GetContactsAsync(userId, searchTerm, isFavoriteOnly, page, pageSize);
        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ContactStatsDto>> GetContactStats()
    {
        int userId = GetCurrentUserId();
        var stats = await _contactService.GetContactStatsAsync(userId);
        return Ok(stats);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ContactResponseDto>> GetContact(int id)
    {
        int userId = GetCurrentUserId();
        var contact = await _contactService.GetContactAsync(id, userId);

        if (contact == null)
        {
            return NotFound("Kişi bulunamadı veya erişim yetkiniz yok.");
        }

        return Ok(contact);
    }

    [HttpPost]
    public async Task<ActionResult<ContactResponseDto>> PostContact(ContactCreateDto dto)
    {
        int userId = GetCurrentUserId();
        var responseDto = await _contactService.CreateContactAsync(dto, userId);

        return CreatedAtAction(nameof(GetContact), new { id = responseDto.Id }, responseDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutContact(int id, ContactUpdateDto dto)
    {
        int userId = GetCurrentUserId();
        var success = await _contactService.UpdateContactAsync(id, dto, userId);

        if (!success)
        {
            return NotFound("Kişi bulunamadı veya bu kişiyi güncelleme yetkiniz yok.");
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteContact(int id)
    {
        int userId = GetCurrentUserId();
        var success = await _contactService.DeleteContactAsync(id, userId);

        if (!success)
        {
            return NotFound("Kişi bulunamadı veya bu kişiyi silme yetkiniz yok.");
        }

        return NoContent();
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
        {
            throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");
        }
        return int.Parse(userIdClaim);
    }
}