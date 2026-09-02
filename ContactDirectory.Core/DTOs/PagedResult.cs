namespace ContactDirectory.Core.DTOs;

public class PagedResult<T>
{
    public int TotalCount { get; set; }
    public IEnumerable<T> Items { get; set; } = new List<T>();
}
