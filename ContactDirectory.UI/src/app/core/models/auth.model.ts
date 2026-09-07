/**
 * Authentication DTO'ları — Frontend ↔ Backend arasındaki
 * kimlik doğrulama veri yapıları.
 *
 * `any` tipi yerine bu interface'ler kullanılır.
 */

/** Login isteği için gönderilen veri */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/** Login başarılı olduğunda backend'den dönen yanıt */
export interface LoginResponse {
  token: string;
  role: string;
  message?: string;
}

/** Kayıt isteği için gönderilen veri */
export interface RegisterRequest {
  username: string;
  password: string;
}

/** Kayıt başarılı olduğunda backend'den dönen yanıt */
export interface RegisterResponse {
  message: string;
}
