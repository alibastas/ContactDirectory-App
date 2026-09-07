import { Injectable, signal, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';

/**
 * SessionService — Hareketsizlik (Inactivity / Idle Timeout) Yönetimi
 *
 * Sorumluluklar:
 * - Kullanıcı etkileşimlerini (fare, klavye, tıklama, kaydırma) dinler.
 * - Kullanıcı 25 dakika boyunca hiçbir etkileşimde bulunmazsa geri sayım uyarısı başlatır.
 * - 60 saniye boyunca "Oturumu Uzat" denilmezse otomatik güvenli çıkış yapar.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  /** 25 dakika hareketsizlik sınırı (ms) */
  private readonly IDLE_THRESHOLD_MS = 25 * 60 * 1000;
  /** 60 saniyelik geri sayım süresi */
  private readonly WARNING_COUNTDOWN_SECONDS = 60;

  private lastActivityTime = Date.now();
  private idleCheckInterval: any = null;
  private countdownTimer: any = null;

  /** Uyarı modalının görünürlük durumu */
  showWarning = signal<boolean>(false);
  /** Kalan saniye sinyali */
  countdown = signal<number>(this.WARNING_COUNTDOWN_SECONDS);

  constructor() {
    this.initUserActivityListeners();
    this.startMonitoring();
  }

  /** Kullanıcı etkileşimlerini dinleyip son işlem zamanını günceller */
  private initUserActivityListeners(): void {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    let lastThrottledTime = 0;
    const handleActivity = () => {
      const now = Date.now();
      // Çok sık tetiklenmeyi önlemek için her 5 saniyede bir son hareket zamanını güncelle
      if (now - lastThrottledTime > 5000) {
        lastThrottledTime = now;
        // Eğer uyarı modalı açık değilse zaman damgasını sıfırla
        if (!this.showWarning()) {
          this.lastActivityTime = now;
        }
      }
    };

    this.ngZone.runOutsideAngular(() => {
      activityEvents.forEach(eventType => {
        window.addEventListener(eventType, handleActivity, { passive: true });
      });
    });
  }

  /** Periyodik olarak hareketsizliği kontrol eden döngü */
  private startMonitoring(): void {
    if (this.idleCheckInterval) return;

    this.ngZone.runOutsideAngular(() => {
      this.idleCheckInterval = setInterval(() => {
        // Eğer kullanıcı giriş yapmamışsa veya "Beni Hatırla" seçeneği aktifse hareketsizlik zaman aşımını işletme
        if (!this.authService.isLoggedIn() || this.authService.isRememberMe()) {
          return;
        }

        const now = Date.now();
        const elapsed = now - this.lastActivityTime;

        if (elapsed >= this.IDLE_THRESHOLD_MS && !this.showWarning()) {
          this.ngZone.run(() => {
            this.triggerWarning();
          });
        }
      }, 10000); // 10 saniyede bir kontrol et
    });
  }

  /** Uyarı modalını ve geri sayımı başlat */
  private triggerWarning(): void {
    this.showWarning.set(true);
    this.countdown.set(this.WARNING_COUNTDOWN_SECONDS);

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        clearInterval(this.countdownTimer);
        this.logoutNow();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  /** Kullanıcı "Oturumu Uzat" butonuna bastığında çağrılır */
  extendSession(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.showWarning.set(false);
    this.lastActivityTime = Date.now();
    this.countdown.set(this.WARNING_COUNTDOWN_SECONDS);

    // Backend'de token'ı tazele
    this.authService.refreshToken().subscribe({
      next: () => {},
      error: (err) => console.warn('Oturum uzatma hatası:', err)
    });
  }

  /** Hemen çıkış yap */
  logoutNow(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.showWarning.set(false);
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
