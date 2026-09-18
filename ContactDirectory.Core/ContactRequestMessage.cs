using System;
using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core;

public class ContactRequestMessage
{
    public int Id { get; set; }

    public int ContactRequestId { get; set; }

    public int SenderUserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string SenderName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string SenderRole { get; set; } = "User"; // "Admin" veya "User"

    [Required]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
