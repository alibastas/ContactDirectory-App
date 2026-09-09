using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core.DTOs;

public class DeleteAllContactsDto
{
    [Required(ErrorMessage = "Rehberi silmek için hesap şifrenizi girmelisiniz.")]
    public string Password { get; set; } = string.Empty;
}
