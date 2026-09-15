using System;
using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core;

public class ContactRequest
{
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string CommunicationType { get; set; } = string.Empty;

    [MaxLength(70)]
    public string? Subject { get; set; }

    [Required]
    [MaxLength(30)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? LastName { get; set; }

    [Required]
    [MaxLength(11)]
    public string PhoneNumber { get; set; } = string.Empty;

    [EmailAddress]
    [MaxLength(60)]
    public string? Email { get; set; }

    [Required]
    [MinLength(5)]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(25)]
    public string? City { get; set; }

    [MaxLength(35)]
    public string? Branch { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
}