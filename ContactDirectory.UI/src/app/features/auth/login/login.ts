import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  username = signal('');
  password = signal('');
  isRegisterMode = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  isSubmitting = signal(false);
  rememberMe = signal(true);

  // KVKK Onay Durumları
  kvkkAccepted = signal(false);
  showKvkkModal = signal(false);
  hasScrolledToBottom = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Eğer kullanıcının zaten aktif geçerli bir oturumu varsa (Beni Hatırla gibi) doğrudan rehbere yönlendir
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/contacts']);
    }
  }

  onInputChange() {
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  onSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

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
          this.errorMessage.set(err.error || 'Kayıt olurken bir hata oluştu.');
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
          this.errorMessage.set(err.error || 'Kullanıcı adı veya şifre hatalı.');
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
}
