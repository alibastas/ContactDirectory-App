using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace ContactDirectory.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegisterDto request)
    {
        var result = await _authService.RegisterAsync(request);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Message);
        }

        return Ok(new { message = result.Message });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto request)
    {
        var result = await _authService.LoginAsync(request);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Message);
        }

        return Ok(new { token = result.Token, role = result.Role });
    }
}