import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../core/models/auth.model';

/**
 * AuthService — Kimlik doğrulama işlemlerini yönetir.
 *
 * Sorumluluklar:
 * - Login / Register API çağrıları
 * - Token yönetimi (saklama, okuma, silme)
 * - Oturum durumu kontrolü
 *
 * Güvenlik Notları:
 * - Şifre asla localStorage'da saklanmaz.
 * - Token süresi JWT payload'ından kontrol edilir.
 */

/** localStorage key'leri — magic string kullanımını önler */
const STORAGE_KEYS = {
  TOKEN: 'token',
  USERNAME: 'current_username',
} as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/Auth`;

  constructor(private http: HttpClient) {}

  /** Yeni kullanıcı kaydı */
  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request);
  }

  /** Kullanıcı girişi — başarılıysa token ve username saklanır */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        if (response?.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
          localStorage.setItem(STORAGE_KEYS.USERNAME, request.username);
        }
      })
    );
  }

  /** Oturumu sonlandır — tüm kimlik verilerini temizle */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
  }

  /** Kullanıcının aktif bir oturumu var mı? */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Token süresi dolmuş mu kontrol et
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  /** Saklanan JWT token'ı döndür */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /** Giriş yapan kullanıcının adını döndür */
  getUsername(): string {
    return localStorage.getItem(STORAGE_KEYS.USERNAME) || 'Bilinmeyen Kullanıcı';
  }
}