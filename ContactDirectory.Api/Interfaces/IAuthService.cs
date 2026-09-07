using System.Security.Claims;
using ContactDirectory.Core.DTOs;

namespace ContactDirectory.Api.Interfaces;

public interface IAuthService
{
    Task<(bool IsSuccess, string Message)> RegisterAsync(UserRegisterDto request);
    Task<(bool IsSuccess, string Token, string Role, string Message)> LoginAsync(UserLoginDto request);
    Task<(bool IsSuccess, string Token, string Role, string Message)> RefreshTokenAsync(ClaimsPrincipal userPrincipal);
}

