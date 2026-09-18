using System.ComponentModel.DataAnnotations;

namespace ContactDirectory.Core.DTOs;

public class SendMessageDto
{
    [Required]
    [MinLength(1)]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;
}
