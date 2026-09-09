import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Contact } from '../../../../core/models/contact.model';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-contact-details',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [header]="'Kişi Detayları'"
      [visible]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '400px', 'max-width': '95vw' }"
      [breakpoints]="{ '640px': '95vw' }"
      [dismissableMask]="true"
      styleClass="contact-details-dialog"
    >
      <div class="details-content" *ngIf="contact">
        
        <div class="header-section">
          <div class="avatar" [style.background]="getAvatarGradient(contact.firstName)">
            {{ getInitials(contact.firstName, contact.lastName) }}
          </div>
          <h2 class="name">{{ contact.firstName }} {{ contact.lastName }}</h2>
          <div class="fav-badge" *ngIf="contact.isFavorite">
            <i class="pi pi-star-fill"></i> Favori
          </div>
        </div>

        <div class="info-section">
          <div class="info-item">
            <div class="info-icon"><i class="pi pi-phone"></i></div>
            <div class="info-text">
              <span class="info-label">Telefon Numarası</span>
              <span class="info-value">
                <a [href]="'tel:' + contact.phoneNumber">{{ contact.phoneNumber }}</a>
              </span>
            </div>
          </div>

          <div class="info-item" *ngIf="contact.email">
            <div class="info-icon"><i class="pi pi-envelope"></i></div>
            <div class="info-text">
              <span class="info-label">E-posta Adresi</span>
              <span class="info-value">
                <a [href]="'mailto:' + contact.email">{{ contact.email }}</a>
              </span>
            </div>
          </div>
        </div>

      </div>

      <ng-template #footer pTemplate="footer">
        <div class="footer-actions">
          <button pButton label="Kapat" class="p-button-text p-button-secondary" (click)="close()"></button>
          <button pButton icon="pi pi-pencil" label="Düzenle" class="p-button-outlined" (click)="onEdit()"></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    ::ng-deep .contact-details-dialog .p-dialog-header {
      border-bottom: 1px solid var(--surface-border);
      padding: 1.25rem 1.5rem;
    }
    ::ng-deep .contact-details-dialog .p-dialog-content {
      padding: 0;
    }
    ::ng-deep .contact-details-dialog .p-dialog-footer {
      border-top: 1px solid var(--surface-border);
      padding: 1rem 1.5rem;
    }

    .details-content {
      display: flex;
      flex-direction: column;
    }

    .header-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2.5rem 1.5rem;
      background: var(--surface-ground);
      border-bottom: 1px solid var(--surface-border-light);
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-md);
    }

    .name {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
    }

    .fav-badge {
      margin-top: 0.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--warning-50);
      color: var(--warning-600);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 600;
    }

    .info-section {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .info-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--primary-50);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .info-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.25rem;
      min-height: 40px;
    }

    .info-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 1rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .info-value a {
      color: var(--primary-600);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .info-value a:hover {
      color: var(--primary-800);
      text-decoration: underline;
    }

    .footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      width: 100%;
    }
  `]
})
export class ContactDetailsComponent {
  @Input() contact: Contact | null = null;
  @Input() visible: boolean = false;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() edit = new EventEmitter<number>();

  private avatarGradients = [
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)',
  ];

  getInitials(firstName: string, lastName: string): string {
    if (!firstName && !lastName) return '';
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  }

  getAvatarGradient(firstName: string): string {
    if (!firstName) return this.avatarGradients[0];
    let hash = 0;
    for (let i = 0; i < firstName.length; i++) {
      hash = firstName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.avatarGradients.length;
    return this.avatarGradients[index];
  }

  close() {
    this.visibleChange.emit(false);
  }

  onEdit() {
    if (this.contact?.id) {
      this.edit.emit(this.contact.id);
      this.close();
    }
  }
}
