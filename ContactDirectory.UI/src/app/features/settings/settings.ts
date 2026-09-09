import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services & Components
import { ThemeService, AppTheme } from '../../services/theme.service';
import { AuthService } from '../../services/auth';
import { ContactService } from '../../services/contact.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar';
import { CountryOption, getSortedCountryOptions } from '../../core/constants/countries';

export type SettingsTab = 'appearance' | 'preferences' | 'security' | 'danger';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ConfirmDialogModule,
    DialogModule,
    ToastModule,
    TopbarComponent
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService]
})
export class SettingsComponent implements OnInit {
  readonly themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private contactService = inject(ContactService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Active Tab
  readonly activeTab = signal<SettingsTab>('appearance');

  // Preferences State
  readonly nameSortFormat = signal<'first-last' | 'last-first'>('first-last');
  readonly defaultPageSize = signal<number>(20);
  readonly pageSizeOptions = [
    { label: '10 Kişi', value: 10 },
    { label: '20 Kişi (Varsayılan)', value: 20 },
    { label: '50 Kişi', value: 50 },
    { label: '100 Kişi', value: 100 }
  ];

  // Country Prefix Options
  readonly countryOptions: CountryOption[] = getSortedCountryOptions();
  readonly selectedCountryCode = signal<string>('+90');

  // Password Form State
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  readonly isChangingPassword = signal<boolean>(false);

  // Danger Zone: Delete All Contacts with Password Modal
  readonly showDeleteContactsDialog = signal<boolean>(false);
  deleteContactsPassword = '';
  readonly isDeletingContacts = signal<boolean>(false);

  // Danger Zone: Delete Entire Account with Password Modal
  readonly showDeleteAccountDialog = signal<boolean>(false);
  deleteAccountPassword = '';
  readonly isDeletingAccount = signal<boolean>(false);

  ngOnInit(): void {
    // Load stored preferences
    const storedFormat = localStorage.getItem('contact_name_format') as 'first-last' | 'last-first';
    if (storedFormat) {
      this.nameSortFormat.set(storedFormat);
    }

    const storedPageSize = localStorage.getItem('contact_page_size');
    if (storedPageSize) {
      this.defaultPageSize.set(parseInt(storedPageSize, 10));
    }

    const storedCountryCode = localStorage.getItem('contact_default_country_code');
    if (storedCountryCode) {
      this.selectedCountryCode.set(storedCountryCode);
    }
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.router.navigate(['/contacts']);
  }

  // --- Theme Controls ---
  setTheme(theme: AppTheme): void {
    this.themeService.setTheme(theme);
    const themeName = theme === 'light' ? 'Açık Tema' : theme === 'dark' ? 'Koyu Tema' : 'Sistem Varsayılanı';
    this.messageService.add({
      severity: 'info',
      summary: 'Tema Güncellendi',
      detail: `${themeName} aktif edildi.`
    });
  }

  // --- Preferences Controls ---
  setNameSortFormat(format: 'first-last' | 'last-first'): void {
    this.nameSortFormat.set(format);
    localStorage.setItem('contact_name_format', format);
    this.messageService.add({
      severity: 'success',
      summary: 'Kaydedildi',
      detail: 'Kişi adı sıralama tercihi güncellendi.'
    });
  }

  onPageSizeChange(size: number): void {
    this.defaultPageSize.set(size);
    localStorage.setItem('contact_page_size', size.toString());
    this.messageService.add({
      severity: 'success',
      summary: 'Kaydedildi',
      detail: `Sayfa başına ${size} kişi varsayılan olarak ayarlandı.`
    });
  }

  onCountryCodeChange(code: string): void {
    if (!code) return;
    this.selectedCountryCode.set(code);
    localStorage.setItem('contact_default_country_code', code);
    const country = this.countryOptions.find(c => c.dialCode === code);
    this.messageService.add({
      severity: 'success',
      summary: 'Varsayılan Ülke Güncellendi',
      detail: `${country?.name || ''} (${code}) varsayılan uluslararası ön ek olarak kaydedildi.`
    });
  }

  // --- Security: Change Password ---
  onChangePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Eksik Alan',
        detail: 'Lütfen tüm şifre alanlarını doldurunuz.'
      });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Şifre Uyuşmazlığı',
        detail: 'Yeni şifreler birbiriyle eşleşmiyor.'
      });
      return;
    }

    if (this.newPassword.length < 4) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Yetersiz Uzunluk',
        detail: 'Yeni şifre en az 4 karakterden oluşmalıdır.'
      });
      return;
    }

    this.isChangingPassword.set(true);
    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.isChangingPassword.set(false);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Başarılı',
          detail: res.message || 'Şifreniz başarıyla değiştirildi.'
        });
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        const msg = err.error?.message || err.error || 'Şifre değiştirilirken bir hata oluştu.';
        this.messageService.add({
          severity: 'error',
          summary: 'Hata',
          detail: typeof msg === 'string' ? msg : 'Mevcut şifreniz hatalı olabilir.'
        });
      }
    });
  }

  // --- Danger Zone: Delete All Contacts with Password Modal ---
  openDeleteContactsDialog(): void {
    this.deleteContactsPassword = '';
    this.showDeleteContactsDialog.set(true);
  }

  cancelDeleteContacts(): void {
    this.showDeleteContactsDialog.set(false);
    this.deleteContactsPassword = '';
  }

  confirmDeleteAllContacts(): void {
    if (!this.deleteContactsPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Şifre Zorunlu',
        detail: 'Tüm rehberi silmek için lütfen hesap şifrenizi giriniz.'
      });
      return;
    }

    this.isDeletingContacts.set(true);
    this.contactService.deleteAllContacts(this.deleteContactsPassword).subscribe({
      next: (res) => {
        this.isDeletingContacts.set(false);
        this.showDeleteContactsDialog.set(false);
        this.deleteContactsPassword = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Rehber Temizlendi',
          detail: res.message || 'Tüm kişileriniz silindi.'
        });
      },
      error: (err) => {
        this.isDeletingContacts.set(false);
        const msg = err.error?.message || err.error || 'Rehber silinirken bir sorun oluştu.';
        this.messageService.add({
          severity: 'error',
          summary: 'İşlem Başarısız',
          detail: typeof msg === 'string' ? msg : 'Girdiğiniz hesap şifresi hatalı.'
        });
      }
    });
  }

  // --- Danger Zone: Delete Entire Account with Password Modal ---
  openDeleteAccountDialog(): void {
    this.deleteAccountPassword = '';
    this.showDeleteAccountDialog.set(true);
  }

  cancelDeleteAccount(): void {
    this.showDeleteAccountDialog.set(false);
    this.deleteAccountPassword = '';
  }

  confirmDeleteAccount(): void {
    if (!this.deleteAccountPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Şifre Zorunlu',
        detail: 'Hesabınızı kalıcı olarak silmek için lütfen hesap şifrenizi giriniz.'
      });
      return;
    }

    this.isDeletingAccount.set(true);
    this.authService.deleteAccount(this.deleteAccountPassword).subscribe({
      next: () => {
        this.isDeletingAccount.set(false);
        this.showDeleteAccountDialog.set(false);
        this.deleteAccountPassword = '';
        this.authService.logout();
        this.messageService.add({
          severity: 'info',
          summary: 'Hesap Silindi',
          detail: 'Hesabınız başarıyla silindi. Giriş ekranına yönlendiriliyorsunuz.'
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (err) => {
        this.isDeletingAccount.set(false);
        const msg = err.error?.message || err.error || 'Hesap silinirken bir sorun oluştu.';
        this.messageService.add({
          severity: 'error',
          summary: 'İşlem Başarısız',
          detail: typeof msg === 'string' ? msg : 'Girdiğiniz hesap şifresi hatalı.'
        });
      }
    });
  }
}
