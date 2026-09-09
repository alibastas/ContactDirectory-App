using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core.DTOs;

public class DeleteAccountDto
{
    [Required(ErrorMessage = "Hesabınızı silmek için hesap şifrenizi girmelisiniz.")]
    public string Password { get; set; } = string.Empty;
}
