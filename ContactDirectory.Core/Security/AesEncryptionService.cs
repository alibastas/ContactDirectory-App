using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace ContactDirectory.Core.Security;

public class AesEncryptionService : IEncryptionService
{
    private const string Prefix = "ENC:v1:";
    private readonly byte[] _key;

    // 256-bit (32 bytes) varsayılan güvenli anahtar (Fallback)
    private static readonly byte[] DefaultKey = Encoding.UTF8.GetBytes("Cont@ctDir_Secr3t_K3y_2026_32B!!");

    public AesEncryptionService(string? customKey = null)
    {
        if (string.IsNullOrWhiteSpace(customKey))
        {
            _key = DefaultKey;
        }
        else
        {
            // Anahtar uzunluğunu 32 bayta (256-bit) normalize et (SHA-256 ile türet)
            using var sha = SHA256.Create();
            _key = sha.ComputeHash(Encoding.UTF8.GetBytes(customKey));
        }
    }

    public string? Encrypt(string? plainText)
    {
        if (string.IsNullOrEmpty(plainText))
        {
            return plainText;
        }

        // Zaten şifrelenmişse tekrar şifreleme
        if (plainText.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return plainText;
        }

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.GenerateIV(); // Her şifrelemede benzersiz rastgele 16 bayt IV üret

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();

        // Başına IV yaz
        ms.Write(aes.IV, 0, aes.IV.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs, Encoding.UTF8))
        {
            sw.Write(plainText);
        }

        var cipherBytes = ms.ToArray();
        return Prefix + Convert.ToBase64String(cipherBytes);
    }

    public string? Decrypt(string? cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
        {
            return cipherText;
        }

        // Şifreli değilse (eski açık metin veriler) olduğu gibi döndür (Geriye dönük uyumluluk)
        if (!cipherText.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return cipherText;
        }

        try
        {
            var base64Part = cipherText.Substring(Prefix.Length);
            var fullBytes = Convert.FromBase64String(base64Part);

            if (fullBytes.Length < 16)
            {
                return cipherText;
            }

            using var aes = Aes.Create();
            aes.Key = _key;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            // İlk 16 bayt IV'dir
            var iv = new byte[16];
            Buffer.BlockCopy(fullBytes, 0, iv, 0, 16);
            aes.IV = iv;

            var cipherBytesLength = fullBytes.Length - 16;
            var cipherBytes = new byte[cipherBytesLength];
            Buffer.BlockCopy(fullBytes, 16, cipherBytes, 0, cipherBytesLength);

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(cipherBytes);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs, Encoding.UTF8);

            return sr.ReadToEnd();
        }
        catch
        {
            // Çözme sırasında beklenmedik hata olursa veriyi kaybetmemek için orijinal metni dön
            return cipherText;
        }
    }
}
