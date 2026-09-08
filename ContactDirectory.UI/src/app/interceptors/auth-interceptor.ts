import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

/**
 * authInterceptor — Kurumsal HTTP Interceptor:
 * 1. İsteklere Bearer JWT Token ekler (localStorage veya sessionStorage).
 * 2. Sliding Expiration: Kullanıcı aktif işlem yaparken token süresi 15 dk'nın altına düşmüşse arka planda sessizce yeniler.
 * 3. 401 Unauthorized yakalama: Beklenmeyen yetkisiz hatalarda oturumu temizleyip login ekranına yönlendirir.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // Sliding Token Refresh Kontrolü (Login ve Refresh istekleri hariç)
  const isAuthEndpoint = req.url.includes('/Auth/login') || 
                         req.url.includes('/Auth/refresh') || 
                         req.url.includes('/Auth/register');

  if (token && !isAuthEndpoint && authService.isLoggedIn()) {
    const remainingMinutes = authService.getTokenRemainingMinutes();
    const isRememberMe = authService.isRememberMe();

    // Akıllı Yenileme Eşiği:
    // - "Beni Hatırla" aktifse (14 günlük oturum): Son 2 gün (2880 dakika) kaldığında yenile
    // - Standart oturumda (60 dakikalık oturum): Son 15 dakika kaldığında yenile
    const refreshThresholdMinutes = isRememberMe ? (48 * 60) : 15;

    if (remainingMinutes > 0 && remainingMinutes <= refreshThresholdMinutes) {
      authService.refreshToken().subscribe({
        error: (err) => console.warn('Sliding token refresh uyarısı:', err)
      });
    }
  }

  // Token varsa Authorization başlığı ekle
  let requestToSend = req;
  if (token) {
    requestToSend = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(requestToSend).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized durumunda oturumu kapatıp login sayfasına yönlendir
      if (error.status === 401 && !isAuthEndpoint) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};