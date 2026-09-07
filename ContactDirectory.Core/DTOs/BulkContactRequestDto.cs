namespace ContactDirectory.Core.DTOs;

public class BulkContactRequestDto
{
    public List<ContactCreateDto> Contacts { get; set; } = new();

    /// <summary>
    /// Duplicate handling strategy: "skip" (default), "update", or "allow"
    /// </summary>
    public string DuplicateStrategy { get; set; } = "skip";
}

public class BulkContactResponseDto
{
    public int AddedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public int TotalProcessed => AddedCount + UpdatedCount + SkippedCount;
    public string Message { get; set; } = string.Empty;
}
