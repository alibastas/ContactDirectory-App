using ContactDirectory.Api.Interfaces;
using ContactDirectory.Core;
using ContactDirectory.Core.DTOs;
using ContactDirectory.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ContactDirectory.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IAuditLogService _auditLogService;

    public AuthService(AppDbContext context, IConfiguration configuration, IAuditLogService auditLogService)
    {
        _context = context;
        _configuration = configuration;
        _auditLogService = auditLogService;
    }

    public async Task<(bool IsSuccess, string Message)> RegisterAsync(UserRegisterDto request)
    {
        var trimmedUsername = request.Username?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmedUsername) || trimmedUsername.Length < 3)
        {
            return (false, "Kullanıcı adı en az 3 karakter olmalıdır.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            return (false, "Şifre en az 6 karakter olmalıdır.");
        }

        if (await _context.Users.AnyAsync(u => u.Username.ToLower() == trimmedUsername.ToLower()))
        {
            return (false, "Bu kullanıcı adı zaten alınmış.");
        }

        // Default work factor (11) is slow on some machines. Using 10 speeds it up significantly while remaining secure.
        string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 10);

        var user = new User
        {
            Username = trimmedUsername,
            PasswordHash = passwordHash,
            Role = "User" // Yeni kayıtlar varsayılan olarak "User" rolünde
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return (true, "Kayıt başarılı!");
    }

    public async Task<(bool IsSuccess, string Token, string Role, string Message)> LoginAsync(UserLoginDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return (false, string.Empty, string.Empty, "Kullanıcı adı veya şifre hatalı.");
        }

        // Beni Hatırla işaretliyse 14 gün (20,160 dk), değilse appsettings'teki süre (varsayılan 60 dk)
        int expireMinutes = request.RememberMe 
            ? (14 * 24 * 60) 
            : Convert.ToInt32(_configuration.GetSection("Jwt")["ExpireMinutes"] ?? "60");

        string token = CreateToken(user, expireMinutes, request.RememberMe);
        return (true, token, user.Role, "Giriş başarılı.");
    }

    public async Task<(bool IsSuccess, string Token, string Role, string Message)> RefreshTokenAsync(ClaimsPrincipal userPrincipal)
    {
        var userIdClaim = userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return (false, string.Empty, string.Empty, "Geçersiz kimlik oturumu.");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return (false, string.Empty, string.Empty, "Kullanıcı bulunamadı.");
        }

        bool isRememberMe = userPrincipal.FindFirst("remember_me")?.Value == "true";
        int expireMinutes = isRememberMe 
            ? (14 * 24 * 60) 
            : Convert.ToInt32(_configuration.GetSection("Jwt")["ExpireMinutes"] ?? "60");

        string newToken = CreateToken(user, expireMinutes, isRememberMe);
        return (true, newToken, user.Role, "Oturum başarıyla yenilendi.");
    }

    public async Task<(bool IsSuccess, string Message)> ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return (false, "Kullanıcı bulunamadı.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return (false, "Mevcut şifreniz hatalı.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            return (false, "Yeni şifre en az 6 karakter olmalıdır.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, 10);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            user.Id,
            user.Username,
            "UPDATE",
            "User",
            user.Id,
            "Kullanıcı şifresini başarıyla değiştirdi."
        );

        return (true, "Şifreniz başarıyla değiştirildi.");
    }

    public async Task<(bool IsSuccess, string Message)> DeleteAccountAsync(int userId, string password)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return (false, "Kullanıcı bulunamadı.");
        }

        if (string.IsNullOrWhiteSpace(password) || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return (false, "Girdiğiniz hesap şifresi hatalı. Hesap silme işlemi iptal edildi.");
        }

        var username = user.Username;

        // Kullanıcıya ait tüm kişileri temizle
        var userContacts = await _context.Contacts.Where(c => c.UserId == userId).ToListAsync();
        if (userContacts.Count > 0)
        {
            _context.Contacts.RemoveRange(userContacts);
        }

        // Kullanıcıyı sil
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId,
            username,
            "DELETE",
            "User",
            userId,
            $"Kullanıcı şifre doğrulamasıyla hesabını ve tüm verilerini kalıcı olarak sildi: {username}"
        );

        return (true, "Hesabınız ve tüm verileriniz başarıyla silindi.");
    }

    public async Task<(bool IsSuccess, string? AvatarUrl, string Message)> UpdateAvatarAsync(int userId, string? avatarUrl)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return (false, null, "Kullanıcı bulunamadı.");
        }

        user.AvatarUrl = avatarUrl;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId,
            user.Username,
            "UPDATE",
            "User",
            userId,
            "Kullanıcı profil fotoğrafını güncelledi."
        );

        return (true, user.AvatarUrl, "Profil fotoğrafı başarıyla güncellendi.");
    }

    public async Task<string?> GetAvatarAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.AvatarUrl;
    }

    private string CreateToken(User user, int expireMinutes, bool rememberMe)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("remember_me", rememberMe ? "true" : "false")
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(expireMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
