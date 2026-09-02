namespace ContactDirectory.Core;

public class AuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // "CREATE", "UPDATE", "DELETE"
    public string EntityName { get; set; } = string.Empty; // "Contact"
    public int? EntityId { get; set; }
    public string Details { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
