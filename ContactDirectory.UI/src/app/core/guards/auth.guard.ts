import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

/**
 * AuthGuard — Korumalı rotalara erişimi kontrol eder.
 *
 * Token yoksa veya süresi dolmuşsa kullanıcıyı /login'e yönlendirir.
 * AuthService üzerinden hem localStorage (Beni Hatırla) hem de sessionStorage (standart oturum) destekler.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    authService.logout();
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
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  if (!authService.isAdmin()) {
    router.navigate(['/contacts']);
    return false;
  }

  return true;
};

