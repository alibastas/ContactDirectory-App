namespace ContactDirectory.Core;

public class Contact
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool IsFavorite { get; set; }
    public string? AvatarUrl { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }
}