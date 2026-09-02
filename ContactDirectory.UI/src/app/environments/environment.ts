/**
 * Environment configuration — Merkezi yapılandırma dosyası.
 *
 * Tüm servisler API URL'ini buradan alır.
 * Production build'de bu dosya `environment.prod.ts` ile değiştirilir.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5099/api'
};
