using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core.DTOs;

public class ContactUpdateDto
{
    [Required(ErrorMessage = "Ad alanı zorunludur.")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Ad en fazla 100 karakter olabilir.")]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Soyad en fazla 100 karakter olabilir.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Telefon numarası zorunludur.")]
    [Phone(ErrorMessage = "Geçersiz telefon numarası formatı.")]
    [StringLength(30, ErrorMessage = "Telefon numarası en fazla 30 karakter olabilir.")]
    public string PhoneNumber { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Geçersiz e-posta adresi formatı.")]
    [StringLength(150, ErrorMessage = "E-posta adresi en fazla 150 karakter olabilir.")]
    public string? Email { get; set; }

    public bool IsFavorite { get; set; }

    [StringLength(500, ErrorMessage = "Avatar URL'i en fazla 500 karakter olabilir.")]
    public string? AvatarUrl { get; set; }
}
