import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { Contact } from '../../core/models/contact.model';
import { Router, ActivatedRoute } from '@angular/router';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { TopbarComponent } from '../../shared/components/topbar/topbar';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    InputTextModule, ButtonModule, ToastModule,
    TopbarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-bg">
      <p-toast position="top-right" />
      
      <!-- Topbar -->
      <app-topbar>
        <ng-container actions>
          <button class="btn-secondary" (click)="goBack()">
            <i class="pi pi-arrow-left"></i>
            <span>Listeye Dön</span>
          </button>
        </ng-container>
      </app-topbar>

      <main class="main-content-centered">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading()">
          <div class="loading-pulse"></div>
          <p>Kişi bilgileri yükleniyor...</p>
        </div>

        <div class="card form-card-centered" *ngIf="!isLoading()">
          <div class="card-header">
            <div class="card-header-icon" [class.editing]="isEditing()">
              <i class="pi" [ngClass]="{'pi-user-edit': isEditing(), 'pi-user-plus': !isEditing()}"></i>
            </div>
            <h2>{{ isEditing() ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle' }}</h2>
          </div>

          <form (ngSubmit)="onSubmit()" class="contact-form">
            <div class="form-field">
              <label for="contact-firstName">
                <i class="pi pi-user" style="margin-right: 6px; font-size: 0.8rem;"></i>Ad
              </label>
              <input type="text" id="contact-firstName" pInputText [(ngModel)]="activeContact.firstName" name="firstName"
                placeholder="Örn: Ahmet" class="custom-input" required />
            </div>

            <div class="form-field">
              <label for="contact-lastName">
                <i class="pi pi-user" style="margin-right: 6px; font-size: 0.8rem;"></i>Soyad
              </label>
              <input type="text" id="contact-lastName" pInputText [(ngModel)]="activeContact.lastName" name="lastName"
                placeholder="Örn: Yılmaz" class="custom-input" required />
            </div>

            <div class="form-field">
              <label for="contact-phoneNumber">
                <i class="pi pi-phone" style="margin-right: 6px; font-size: 0.8rem;"></i>Telefon Numarası
              </label>
              <input type="text" id="contact-phoneNumber" pInputText [(ngModel)]="activeContact.phoneNumber" name="phoneNumber"
                placeholder="0555..." maxlength="11" (keypress)="numberOnly($event)"
                class="custom-input" required />
            </div>

            <div class="form-field">
              <label for="contact-email">
                <i class="pi pi-envelope" style="margin-right: 6px; font-size: 0.8rem;"></i>E-posta
                <span class="optional-tag">isteğe bağlı</span>
              </label>
              <input type="email" id="contact-email" pInputText [(ngModel)]="activeContact.email" name="email"
                placeholder="ornek@mail.com" class="custom-input" />
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isSaving()" [class.btn-warning]="isEditing()">
                <i class="pi" [ngClass]="{'pi-spin pi-spinner': isSaving(), 'pi-check': isEditing() && !isSaving(), 'pi-plus': !isEditing() && !isSaving()}"></i>
                {{ isSaving() ? 'İşleniyor...' : (isEditing() ? 'Güncelle' : 'Kaydet') }}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-bg {
      background: var(--surface-ground);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .btn-secondary {
      background: var(--surface-card);
      color: var(--text-secondary);
      border: 1px solid var(--surface-border);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all var(--transition-fast);
    }
    .btn-secondary:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
      border-color: var(--primary-200);
    }

    .main-content-centered {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .card {
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--surface-border-light);
    }
    
    .form-card-centered {
      width: 100%;
      max-width: 500px;
    }

    .card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      text-align: center;
    }
    
    .card-header-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      background: var(--primary-50);
      color: var(--primary-600);
    }
    .card-header-icon.editing {
      background: var(--warning-50);
      color: var(--warning-600);
    }

    .card-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .optional-tag {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      background: var(--surface-section);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .custom-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-border);
      transition: all var(--transition-fast);
      background: var(--surface-card);
      font-size: 1rem;
      color: var(--text-primary);
    }
    .custom-input:focus {
      outline: none;
      border-color: var(--primary-400);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .form-actions {
      margin-top: 1rem;
    }

    .btn-primary {
      width: 100%;
      background: var(--primary-600);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--primary-700);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .btn-warning {
      background: var(--warning-500);
    }
    .btn-warning:hover:not(:disabled) {
      background: var(--warning-600);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
    }
    .loading-pulse {
      width: 48px; height: 48px;
      border-radius: var(--radius-full);
      border: 3px solid var(--primary-100);
      border-top-color: var(--primary-500);
      animation: spin 0.8s linear infinite;
    }
    .loading-state p {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ContactFormComponent implements OnInit {
  activeContact: Contact = { firstName: '', lastName: '', phoneNumber: '', email: '' };
  isEditing = signal(false);
  isSaving = signal(false);
  isLoading = signal(false);

  constructor(
    private contactService: ContactService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing.set(true);
      this.loadContact(parseInt(idParam, 10));
    }
  }

  loadContact(id: number) {
    this.isLoading.set(true);
    this.contactService.getContactById(id).subscribe({
      next: (contact) => {
        this.activeContact = {
          id: contact.id,
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          phoneNumber: contact.phoneNumber || '',
          email: contact.email || ''
        };
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Kişi yüklenirken hata:', err);
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Kişi bulunamadı veya erişilemedi.' });
        this.isLoading.set(false);
        setTimeout(() => this.goBack(), 1500);
      }
    });
  }

  goBack() {
    this.router.navigate(['/contacts']);
  }

  onSubmit() {
    if (!this.activeContact.firstName || !this.activeContact.phoneNumber || this.isSaving()) return;

    this.isSaving.set(true);

    if (this.isEditing() && this.activeContact.id) {
      this.contactService.updateContact(this.activeContact.id, this.activeContact).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Kişi güncellendi, yönlendiriliyorsunuz.' });
          setTimeout(() => this.goBack(), 1000);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Güncelleme başarısız oldu.' });
          this.isSaving.set(false);
        }
      });
    } else {
      this.contactService.addContact(this.activeContact).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Yeni kişi eklendi, yönlendiriliyorsunuz.' });
          setTimeout(() => this.goBack(), 1000);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Kişi eklenirken hata oluştu.' });
          this.isSaving.set(false);
        }
      });
    }
  }

  numberOnly(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
}
