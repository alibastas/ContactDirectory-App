using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core.DTOs;

public class CreateContactRequestDto
{
    [Required(ErrorMessage = "İletişim türü gereklidir.")]
    [StringLength(50)]
    public string CommunicationType { get; set; } = "Talep";

    [StringLength(150)]
    public string? Subject { get; set; }

    [Required(ErrorMessage = "Ad alanı gereklidir.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Ad en az 2 karakter olmalıdır.")]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(100)]
    public string? LastName { get; set; }

    [Required(ErrorMessage = "Telefon numarası gereklidir.")]
    [Phone(ErrorMessage = "Geçersiz telefon numarası formatı.")]
    [StringLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Geçersiz e-posta adresi formatı.")]
    [StringLength(150)]
    public string? Email { get; set; }

    [Required(ErrorMessage = "Mesaj alanı gereklidir.")]
    [StringLength(2000, MinimumLength = 5, ErrorMessage = "Mesaj en az 5 karakter olmalıdır.")]
    public string Message { get; set; } = string.Empty;

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(100)]
    public string? Branch { get; set; }
}
