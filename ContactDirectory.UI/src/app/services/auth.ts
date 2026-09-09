import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, finalize } from 'rxjs';
import { environment } from '../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../core/models/auth.model';

/**
 * AuthService — Kimlik doğrulama ve oturum sürekliliği işlemlerini yönetir.
 *
 * Sorumluluklar:
 * - Login / Register / Refresh API çağrıları
 * - "Beni Hatırla" tercihine göre localStorage / sessionStorage akıllı depolama
 * - Sliding Expiration (Oturumun işlem yaparken otomatik yenilenmesi)
 * - Oturum durumu ve rol kontrolü
 */

const STORAGE_KEYS = {
  TOKEN: 'token',
  USERNAME: 'current_username',
  ROLE: 'current_user_role',
  REMEMBER_ME: 'remember_me'
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

  /** Kullanıcı şifresini değiştir */
  changePassword(request: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, request);
  }

  /** Kullanıcı hesabını ve tüm verilerini kalıcı olarak sil (şifre doğrulamalı) */
  deleteAccount(password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/delete-account`, { password });
  }

  /**
   * Kullanıcı girişi:
   * - rememberMe true ise: localStorage (kalıcı oturum)
   * - rememberMe false ise: sessionStorage (tarayıcı/sekme kapanınca silinir)
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        if (response?.token) {
          const isRememberMe = !!request.rememberMe;
          const targetStorage = isRememberMe ? localStorage : sessionStorage;
          const otherStorage = isRememberMe ? sessionStorage : localStorage;

          // Çakışmayı önlemek için diğer depolama alanını temizle
          this.clearStorageKeys(otherStorage);

          // Hedef depolamaya kaydet
          targetStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
          targetStorage.setItem(STORAGE_KEYS.USERNAME, request.username);
          targetStorage.setItem(STORAGE_KEYS.REMEMBER_ME, isRememberMe ? 'true' : 'false');

          let role = response.role;
          if (!role) {
            role = this.extractRoleFromToken(response.token);
          }
          targetStorage.setItem(STORAGE_KEYS.ROLE, role);
        }
      })
    );
  }

  private isRefreshing = false;

  /** 
   * Oturum yenileme (Sliding Expiration):
   * Backend'den yeni bir JWT token alır ve mevcut depolama alanında günceller.
   * Eşzamanlı mükerrer istekleri engellemek için guard kullanır.
   */
  refreshToken(): Observable<LoginResponse> {
    if (this.isRefreshing) {
      return of({ token: this.getToken() || '', role: this.getRole() });
    }

    this.isRefreshing = true;
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => {
        if (response?.token) {
          this.updateToken(response.token, response.role);
        }
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }

  /** Mevcut depolama alanında token'ı günceller */
  updateToken(newToken: string, newRole?: string): void {
    const storage = this.getActiveStorage();
    storage.setItem(STORAGE_KEYS.TOKEN, newToken);
    if (newRole) {
      storage.setItem(STORAGE_KEYS.ROLE, newRole);
    }
  }

  /** Oturumu sonlandır — her iki depolama alanını da tamamen temizle */
  logout(): void {
    this.clearStorageKeys(localStorage);
    this.clearStorageKeys(sessionStorage);
  }

  /** Kullanıcının aktif geçerli bir oturumu var mı? */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  /** Token'ın dolmasına kaç dakika kaldığını hesaplar */
  getTokenRemainingMinutes(): number {
    const token = this.getToken();
    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const remainingMs = (payload.exp * 1000) - Date.now();
      return Math.max(0, Math.floor(remainingMs / 60000));
    } catch {
      return 0;
    }
  }

  /** Saklanan JWT token'ı döndür (localStorage veya sessionStorage) */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /** Giriş yapan kullanıcının adını döndür */
  getUsername(): string {
    return localStorage.getItem(STORAGE_KEYS.USERNAME) || 
           sessionStorage.getItem(STORAGE_KEYS.USERNAME) || 
           'Bilinmeyen Kullanıcı';
  }

  /** Giriş yapan kullanıcının rolünü döndür (Admin / User) */
  getRole(): string {
    return localStorage.getItem(STORAGE_KEYS.ROLE) || 
           sessionStorage.getItem(STORAGE_KEYS.ROLE) || 
           'User';
  }

  /** Kullanıcı admin mi? */
  isAdmin(): boolean {
    return this.getRole().toLowerCase() === 'admin';
  }

  /** Beni Hatırla ile mi giriş yapılmış? */
  isRememberMe(): boolean {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  }

  /** Aktif depolama alanını belirler */
  private getActiveStorage(): Storage {
    if (localStorage.getItem(STORAGE_KEYS.TOKEN)) {
      return localStorage;
    }
    return sessionStorage;
  }

  /** Belirtilen depolama alanındaki auth anahtarlarını siler */
  private clearStorageKeys(storage: Storage): void {
    storage.removeItem(STORAGE_KEYS.TOKEN);
    storage.removeItem(STORAGE_KEYS.USERNAME);
    storage.removeItem(STORAGE_KEYS.ROLE);
    storage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  }

  /** Token içerisinden rol bilgisini ayıklar */
  private extractRoleFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
             payload.role || 
             'User';
    } catch {
      return 'User';
    }
  }
}