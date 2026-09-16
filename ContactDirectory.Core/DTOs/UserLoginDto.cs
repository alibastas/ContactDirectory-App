using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core.DTOs;

public class UserLoginDto
{
    [Required(ErrorMessage = "Kullanıcı adı zorunludur.")]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre zorunludur.")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}
