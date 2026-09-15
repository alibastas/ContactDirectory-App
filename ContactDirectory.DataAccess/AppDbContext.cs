using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ContactDirectory.Core;
using ContactDirectory.Core.Security;

namespace ContactDirectory.DataAccess;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Contact> Contacts { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    public DbSet<ContactRequest> ContactRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var encryptConverter = new ValueConverter<string, string>(
            v => EncryptionHelper.Encrypt(v) ?? string.Empty,
            v => EncryptionHelper.Decrypt(v) ?? string.Empty
        );

        var encryptNullableConverter = new ValueConverter<string?, string?>(
            v => EncryptionHelper.Encrypt(v),
            v => EncryptionHelper.Decrypt(v)
        );

        modelBuilder.Entity<Contact>(entity =>
        {
            entity.Property(c => c.PhoneNumber)
                .HasConversion(encryptConverter);

            entity.Property(c => c.Email)
                .HasConversion(encryptNullableConverter);
        });
    }
}