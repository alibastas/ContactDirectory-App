using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core.DTOs;

public class ChangePasswordDto
{
    [Required(ErrorMessage = "Mevcut şifre zorunludur.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Yeni şifre zorunludur.")]
    [MinLength(4, ErrorMessage = "Yeni şifre en az 4 karakter olmalıdır.")]
    public string NewPassword { get; set; } = string.Empty;
}
