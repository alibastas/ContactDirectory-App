import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  shakeCard = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // If user navigates to login page, destroy any existing session to enforce re-login
    this.authService.logout();
  }

  onSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    const userData = { username: this.username(), password: this.password() };

    if (this.isRegisterMode()) {
      this.authService.register(userData).subscribe({
        next: () => {
          this.successMessage.set('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
          this.isRegisterMode.set(false);
          this.password.set('');
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error || 'Kayıt olurken bir hata oluştu.');
          this.isSubmitting.set(false);
          this.triggerShake();
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
          this.triggerShake();
        }
      });
    }
  }

  toggleMode() {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  triggerShake() {
    this.shakeCard.set(true);
    setTimeout(() => { 
      this.shakeCard.set(false); 
    }, 500);
  }
}
