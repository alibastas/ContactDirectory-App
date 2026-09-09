namespace ContactDirectory.Core.DTOs;

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int TotalContacts { get; set; }
    public int TotalLogs { get; set; }
    public List<UserSummaryDto> UserSummaries { get; set; } = new();
}

public class UserSummaryDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int ContactCount { get; set; }
    public string? AvatarUrl { get; set; }
}
