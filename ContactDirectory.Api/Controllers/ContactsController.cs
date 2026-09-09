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
        [FromQuery] int pageSize = 10,
        [FromQuery] string? firstName = null,
        [FromQuery] string? lastName = null,
        [FromQuery] string? phoneNumber = null,
        [FromQuery] string? email = null)
    {
        int userId = GetCurrentUserId();
        var result = await _contactService.GetContactsAsync(
            userId, 
            searchTerm, 
            isFavoriteOnly, 
            page, 
            pageSize, 
            firstName, 
            lastName, 
            phoneNumber, 
            email);
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

    [HttpPost("delete-all")]
    [HttpDelete("delete-all")]
    public async Task<IActionResult> DeleteAllContacts([FromBody] DeleteAllContactsDto dto)
    {
        int userId = GetCurrentUserId();
        var result = await _contactService.DeleteAllContactsAsync(userId, dto.Password);
        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Message });
        }
        return Ok(new { deletedCount = result.DeletedCount, message = result.Message });
    }

    [HttpGet("export-data")]
    public async Task<ActionResult<List<ContactResponseDto>>> GetExportData(
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool isFavoriteOnly = false,
        [FromQuery] string? firstName = null,
        [FromQuery] string? lastName = null,
        [FromQuery] string? phoneNumber = null,
        [FromQuery] string? email = null)
    {
        int userId = GetCurrentUserId();
        var data = await _contactService.GetFilteredContactsForExportAsync(
            userId, 
            searchTerm, 
            isFavoriteOnly, 
            firstName, 
            lastName, 
            phoneNumber, 
            email);
        return Ok(data);
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<BulkContactResponseDto>> BulkCreateContacts([FromBody] BulkContactRequestDto request)
    {
        if (request == null || request.Contacts == null || request.Contacts.Count == 0)
        {
            return BadRequest("Eklenecek kişi listesi boş olamaz.");
        }

        int userId = GetCurrentUserId();
        var result = await _contactService.BulkCreateContactsAsync(userId, request);
        return Ok(result);
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