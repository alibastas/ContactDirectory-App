using ContactDirectory.Core;
using ContactDirectory.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContactDirectory.Api.Controllers
{
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
            public async Task<IActionResult> Create([FromBody] ContactRequest request)
            {
                request.CreatedAt = DateTime.UtcNow;

                _context.ContactRequests.Add(request);

                await _context.SaveChangesAsync();

                return Ok(request);
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
}

