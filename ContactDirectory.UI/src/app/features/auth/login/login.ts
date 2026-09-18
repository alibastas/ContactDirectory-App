import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../../services/auth';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, OnDestroy {
  username = signal('');
  password = signal('');
  isRegisterMode = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  isSubmitting = signal(false);
  rememberMe = signal(false);

  // KVKK Onay Durumları
  kvkkAccepted = signal(false);
  showKvkkModal = signal(false);
  hasScrolledToBottom = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Login ekranı her zaman açık tema olarak görüntülenir
    this.themeService.forceLightMode();

    // Eğer kullanıcının zaten aktif geçerli bir oturumu varsa (Beni Hatırla gibi) doğrudan rehbere yönlendir
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/contacts']);
    }
  }

  ngOnDestroy() {
    // Login ekranından ayrılırken kullanıcının kayıtlı tema tercihini geri yükle
    this.themeService.restoreTheme();
  }

  onInputChange() {
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  onSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.username().trim()) {
      this.errorMessage.set('Lütfen kullanıcı adınızı giriniz.');
      return;
    }

    if (!this.password()) {
      this.errorMessage.set('Lütfen şifrenizi giriniz.');
      return;
    }

    if (this.isRegisterMode() && !this.kvkkAccepted()) {
      this.errorMessage.set('Lütfen kayıt olmadan önce KVKK Aydınlatma Metni\'ni inceleyip onaylayınız.');
      return;
    }

    this.isSubmitting.set(true);
    const userData = { 
      username: this.username().trim(), 
      password: this.password(),
      rememberMe: this.rememberMe()
    };

    if (this.isRegisterMode()) {
      this.authService.register(userData).subscribe({
        next: () => {
          this.successMessage.set('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
          this.isRegisterMode.set(false);
          this.password.set('');
          this.kvkkAccepted.set(false);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.errorMessage.set(this.extractErrorMessage(err, 'Kayıt olurken bir hata oluştu.'));
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.authService.login(userData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/contacts']);
        },
        error: (err) => {
          this.errorMessage.set(this.extractErrorMessage(err, 'Kullanıcı adı veya şifre hatalı.'));
          this.isSubmitting.set(false);
        }
      });
    }
  }

  toggleMode() {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.errorMessage.set('');
    this.successMessage.set('');
    this.kvkkAccepted.set(false);
    this.hasScrolledToBottom.set(false);
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  openKvkkModal(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.kvkkAccepted()) {
      this.hasScrolledToBottom.set(false);
    }
    this.showKvkkModal.set(true);
  }

  onCheckboxClick(event: Event) {
    if (this.kvkkAccepted()) {
      // Zaten onaylıysa kullanıcının tiki kaldırmasına izin ver
      this.kvkkAccepted.set(false);
      return;
    }
    // Onaylı değilse doğrudan işaretlenemez, modalı açıp okut
    event.preventDefault();
    this.openKvkkModal();
  }

  onScrollText(event: Event) {
    const el = event.target as HTMLElement;
    // Metnin en altına 30px kalana kadar kaydırıldı mı?
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 30) {
      this.hasScrolledToBottom.set(true);
    }
  }

  acceptKvkk() {
    if (this.hasScrolledToBottom()) {
      this.kvkkAccepted.set(true);
      this.showKvkkModal.set(false);
    }
  }

  closeKvkkModal() {
    this.showKvkkModal.set(false);
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (!err) return fallback;

    if (err.status === 429) {
      return 'Çok fazla istek yapıldı. Güvenliğiniz için lütfen 1 dakika bekleyip tekrar deneyiniz.';
    }

    if (err.status === 401) {
      return 'Kullanıcı adı veya şifre hatalı.';
    }

    if (err.status === 0 || err.status === 503) {
      return 'Sunucuya bağlanılamadı. Lütfen sunucunun açık olduğundan veya internet bağlantınızdan emin olun.';
    }

    if (err.status === 500) {
      return 'Sunucu kaynaklı bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.';
    }

    if (typeof err === 'string' && !err.includes('Http failure')) return err;
    if (typeof err.error === 'string' && !err.error.includes('Http failure') && !err.error.includes('<!DOCTYPE')) {
      return err.error;
    }
    if (err.error?.message && typeof err.error.message === 'string') return err.error.message;

    if (err.error?.errors && typeof err.error.errors === 'object') {
      const messages = Object.values(err.error.errors).flat().filter(m => typeof m === 'string') as string[];
      if (messages.length > 0) {
        const joined = messages.join(' ');
        if (joined.includes('Password') && (joined.includes('required') || joined.includes('zorunlu'))) {
          return 'Lütfen şifrenizi giriniz.';
        }
        if (joined.includes('Username') && (joined.includes('required') || joined.includes('zorunlu'))) {
          return 'Lütfen kullanıcı adınızı giriniz.';
        }
        return joined;
      }
    }

    if (err.error?.title && typeof err.error.title === 'string' && !err.error.title.includes('validation errors')) {
      return err.error.title;
    }

    if (err.message && typeof err.message === 'string' && !err.message.includes('Http failure')) {
      return err.message;
    }

    return fallback;
  }
}
