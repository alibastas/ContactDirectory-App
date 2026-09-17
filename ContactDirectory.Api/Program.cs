using System.Text;
using System.Threading.RateLimiting;
using ContactDirectory.Api.Interfaces;
using ContactDirectory.Api.Services;
using ContactDirectory.Core.Security;
using ContactDirectory.DataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 0. Sütun Bazlı AES-256 Şifreleme Servisi
var encryptionKey = builder.Configuration["Encryption:Key"];
var encryptionService = new AesEncryptionService(encryptionKey);
EncryptionHelper.Initialize(encryptionService);
builder.Services.AddSingleton<IEncryptionService>(encryptionService);

// 1. Veritabanı (PostgreSQL) Ayarı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. JWT Authentication (Kimlik Doğrulama) Ayarları
var jwtSettings = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
        };
    });

builder.Services.AddAuthorization();

// 3. CORS Ayarları (Sadece izin verilen frontend origin'leri)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4200", "http://127.0.0.1:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 4. Rate Limiting (Kaba kuvvet ve spam saldırılarına karşı istek sınırlama)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Kimlik doğrulama endpoint'leri için IP bazlı limit: Dakikada maks 10 istek
    options.AddPolicy("AuthRateLimit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_auth",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // İletişim talebi oluşturma için IP bazlı limit: Dakikada maks 5 istek
    options.AddPolicy("ContactRequestRateLimit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_contact",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Dependency Injection (Service Layer)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IContactRequestService, ContactRequestService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// 5. Swagger Ayarları
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo { Title = "ContactDirectory API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Örnek: 'Bearer {token}'",
        Name = "Authorization",
        In = Microsoft.OpenApi.ParameterLocation.Header,
        Type = Microsoft.OpenApi.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(doc => new Microsoft.OpenApi.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", doc),
            new List<string>()
        }
    });
});

var app = builder.Build();

// Global Exception Handler: Production ortamında iç hata stack trace sızıntısını engeller
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(exceptionApp =>
    {
        exceptionApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"message\":\"Beklenmeyen bir sunucu hatasi olustu. Lutfen daha sonra tekrar deneyiniz.\"}");
        });
    });
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("DefaultCorsPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Mevcut açık metin kişileri otomatik olarak AES-256 ile şifrele (Geriye Dönük Veri Göçü)
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var unencryptedIds = await context.Database
            .SqlQueryRaw<int>("""
                SELECT "Id" FROM "Contacts" 
                WHERE "PhoneNumber" NOT LIKE 'ENC:%' 
                   OR ("Email" IS NOT NULL AND "Email" NOT LIKE 'ENC:%')
            """)
            .ToListAsync();

        if (unencryptedIds.Count > 0)
        {
            var unencryptedContacts = await context.Contacts
                .Where(c => unencryptedIds.Contains(c.Id))
                .ToListAsync();

            foreach (var c in unencryptedContacts)
            {
                context.Entry(c).Property(x => x.PhoneNumber).IsModified = true;
                if (c.Email != null)
                {
                    context.Entry(c).Property(x => x.Email).IsModified = true;
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine($"[Şifreleme] {unencryptedContacts.Count} adet eski açık metin kişi başarıyla AES-256 ile şifrelendi.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Şifreleme Göçü Uyarısı] {ex.Message}");
    }
}

app.Run();