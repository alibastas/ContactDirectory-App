using Microsoft.EntityFrameworkCore;
using ContactDirectory.Core;

namespace ContactDirectory.DataAccess;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Contact> Contacts { get; set; }
    public DbSet<User> Users { get; set; } // Yeni eklediğimiz kullanıcı tablosu
}