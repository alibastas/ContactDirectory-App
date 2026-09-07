using System;

namespace ContactDirectory.Core.Security;

public static class EncryptionHelper
{
    private static IEncryptionService _service = new AesEncryptionService();

    public static void Initialize(IEncryptionService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }

    public static string? Encrypt(string? plainText) => _service.Encrypt(plainText);

    public static string? Decrypt(string? cipherText) => _service.Decrypt(cipherText);
}
