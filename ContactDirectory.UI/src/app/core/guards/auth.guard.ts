import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * AuthGuard — Korumalı rotalara erişimi kontrol eder.
 *
 * Token yoksa veya süresi dolmuşsa kullanıcıyı /login'e yönlendirir.
 * Angular'ın modern fonksiyonel guard yapısını kullanır (class-based değil).
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // JWT token süre kontrolü
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Unix timestamp → milliseconds
    if (Date.now() >= expiry) {
      // Token süresi dolmuş → temizle ve login'e yönlendir
      localStorage.removeItem('token');
      router.navigate(['/login']);
      return false;
    }
  } catch {
    // Token parse edilemezse geçersiz say
    localStorage.removeItem('token');
    router.navigate(['/login']);
    return false;
  }

  return true;
};

/**
 * AdminGuard — Sadece 'Admin' rolündeki kullanıcıların erişimine izin verir.
 * Admin değilse ana sayfaya (/contacts) yönlendirir.
 */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    if (Date.now() >= expiry) {
      localStorage.removeItem('token');
      router.navigate(['/login']);
      return false;
    }

    const role = localStorage.getItem('current_user_role') ||
                 payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                 payload.role;

    if (role?.toLowerCase() !== 'admin') {
      router.navigate(['/contacts']);
      return false;
    }

    return true;
  } catch {
    router.navigate(['/login']);
    return false;
  }
};
