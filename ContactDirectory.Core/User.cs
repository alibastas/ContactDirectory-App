namespace ContactDirectory.Core;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User"; // "Admin" veya "User"

    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
}