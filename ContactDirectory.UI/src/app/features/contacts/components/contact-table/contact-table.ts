import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Contact } from '../../../../core/models/contact.model';
import { TableModule, Table } from 'primeng/table';
import { isPresetAvatar, getPresetSvg } from '../../../../core/constants/avatars';

@Component({
  selector: 'app-contact-table',
  standalone: true,
  imports: [CommonModule, TableModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Table -->
    <div class="table-wrapper">
      <p-table #dt [value]="contacts" [tableStyle]="{ 'min-width': '100%' }"
        rowGroupMode="subheader" groupRowsBy="firstLetter"
        [lazy]="true" (onLazyLoad)="onLazyLoadData($event)" [totalRecords]="totalRecords"
        [loading]="isLoading"
        [paginator]="true" [rows]="rows" [rowsPerPageOptions]="[10, 20, 50, 100]" [(first)]="firstRow">
        
        <ng-template #header>
          <tr>
            <th style="width: 50px;"></th>
            <th>Kişi</th>
            <th>Telefon</th>
            <th>E-posta</th>
            <th style="text-align: right; width: 120px;">İşlemler</th>
          </tr>
        </ng-template>

        <ng-template #groupheader let-contact>
          <tr pRowGroupHeader>
            <td colspan="5">
              <span class="group-header-text">{{contact.firstLetter}}</span>
            </td>
          </tr>
        </ng-template>

        <ng-template #body let-contact let-rowIndex="rowIndex">
          <tr class="contact-row" (click)="onViewContact(contact)">
            <!-- Favorite Star -->
            <td style="text-align: center;">
              <button class="fav-btn" [class.fav-active]="contact.isFavorite" (click)="onToggleFavorite(contact.id, $event)" title="Favori">
                <i class="pi" [ngClass]="{'pi-star-fill': contact.isFavorite, 'pi-star': !contact.isFavorite}"></i>
              </button>
            </td>
            <!-- Name + Avatar -->
            <td>
              <div class="contact-cell">
                <div class="contact-avatar" [style.background]="!contact.avatarUrl ? getAvatarGradient(contact.firstName) : 'transparent'">
                  <div *ngIf="isPreset(contact.avatarUrl)" class="contact-avatar-svg" [innerHTML]="getPresetSvg(contact.avatarUrl)"></div>
                  <img *ngIf="contact.avatarUrl && !isPreset(contact.avatarUrl)" [src]="contact.avatarUrl" alt="" class="contact-avatar-img" />
                  <span *ngIf="!contact.avatarUrl">{{ getInitials(contact.firstName, contact.lastName) }}</span>
                </div>
                <div class="contact-name">
                  <strong>{{ formatName(contact) }}</strong>
                </div>
              </div>
            </td>
            <!-- Phone -->
            <td>
              <a class="phone-badge" [href]="'tel:' + contact.phoneNumber" title="Ara">
                <i class="pi pi-phone" style="font-size: 0.7rem;"></i>
                {{ contact.phoneNumber }}
              </a>
            </td>
            <!-- Email -->
            <td>
              <a *ngIf="contact.email" class="email-link" [href]="'mailto:' + contact.email">
                <i class="pi pi-envelope" style="font-size: 0.7rem;"></i>
                {{ contact.email }}
              </a>
              <span *ngIf="!contact.email" class="no-data">—</span>
            </td>
            <!-- Actions -->
            <td class="action-cell">
              <div class="action-buttons">
                <button class="action-btn edit-btn" (click)="onEditContact(contact.id, $event)" title="Düzenle">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn delete-btn" (click)="onDeleteContact(contact, $event)" title="Sil">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td colspan="5" class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-inbox"></i>
              </div>
              <h3>{{ searchQuery ? 'Sonuç bulunamadı' : (activeFilter === 'favorites' ? 'Favori kişi yok' : 'Henüz kişi yok') }}</h3>
              <p>{{ searchQuery ? 'Aramanıza uygun kişi bulunamadı.' : (activeFilter === 'favorites' ? 'Yıldız ikonuna tıklayarak favori ekleyin.' : 'Üstteki "Yeni Kişi Ekle" butonuna tıklayarak başlayın.') }}</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: var(--text-muted);
    }
    .loading-pulse {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-200);
      margin-bottom: 1rem;
      animation: pulse-glow 2s infinite ease-in-out;
    }
    
    .table-wrapper {
      background: var(--surface-card);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      background: var(--surface-section);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1rem;
      border: none;
      border-bottom: 1px solid var(--surface-border);
    }
    ::ng-deep .p-datatable .p-datatable-tbody > tr {
      transition: background-color var(--transition-fast);
      border-bottom: 1px solid var(--surface-border-light);
      cursor: pointer;
    }
    ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background-color: var(--surface-hover);
    }
    ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 1rem;
      border: none;
    }
    ::ng-deep .p-rowgroup-header td {
      background: var(--primary-50) !important;
      border-bottom: 1px solid var(--primary-100) !important;
    }
    .group-header-text {
      font-weight: 700;
      color: var(--primary-700);
      font-size: 0.95rem;
      padding-left: 0.5rem;
    }

    .contact-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .contact-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .contact-avatar-svg {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .contact-avatar-svg ::ng-deep svg {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
    }
    .contact-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      display: block;
    }
    .contact-name strong {
      color: var(--text-primary);
      font-size: 0.95rem;
      font-weight: 600;
    }

    .phone-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface-ground);
      padding: 0.4rem 0.8rem;
      border-radius: var(--radius-full);
      color: var(--primary-700);
      font-weight: 500;
      font-size: 0.85rem;
      text-decoration: none;
      border: 1px solid var(--primary-100);
      transition: all var(--transition-fast);
    }
    .phone-badge:hover {
      background: var(--primary-50);
      border-color: var(--primary-200);
      transform: translateY(-1px);
    }

    .email-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--accent-600);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .email-link:hover {
      text-decoration: underline;
    }

    .fav-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all var(--transition-base);
    }
    .fav-btn:hover {
      background: var(--warning-50);
      color: var(--warning-400);
      transform: scale(1.1);
    }
    .fav-active {
      color: var(--warning-500);
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      background: transparent;
    }
    .edit-btn {
      color: var(--accent-500);
    }
    .edit-btn:hover {
      background: var(--surface-ground);
      color: var(--accent-600);
    }
    .delete-btn {
      color: var(--danger-500);
    }
    .delete-btn:hover {
      background: var(--danger-50);
      color: var(--danger-600);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem !important;
    }
    .empty-icon {
      width: 64px;
      height: 64px;
      background: var(--surface-section);
      color: var(--text-muted);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 1rem;
    }
    .empty-state h3 {
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .empty-state p {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    /* Dark Mode Overrides */
    :host-context(html.dark) .phone-badge {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
    }
    :host-context(html.dark) .phone-badge:hover {
      background: rgba(99, 102, 241, 0.22);
      border-color: rgba(99, 102, 241, 0.45);
      color: #c7d2fe;
    }
    :host-context(html.dark) .group-header-text {
      color: #a5b4fc;
    }
    :host-context(html.dark) ::ng-deep .p-rowgroup-header td {
      background: rgba(99, 102, 241, 0.12) !important;
      border-bottom: 1px solid rgba(99, 102, 241, 0.25) !important;
    }
    :host-context(html.dark) .email-link {
      color: #38bdf8;
    }
  `]
})
export class ContactTableComponent {
  @ViewChild('dt') table!: Table;

  @Input() contacts: (Contact & { firstLetter?: string })[] = [];
  @Input() isLoading: boolean = false;
  @Input() searchQuery: string = '';
  @Input() activeFilter: 'all' | 'favorites' = 'all';
  @Input() totalRecords: number = 0;
  @Input() rows: number = 20;
  @Input() nameFormat: 'first-last' | 'last-first' = 'first-last';
  
  @Output() viewContact = new EventEmitter<Contact>();
  @Output() editContact = new EventEmitter<number>();
  @Output() deleteContact = new EventEmitter<Contact>();
  @Output() toggleFavorite = new EventEmitter<number>();
  @Output() lazyLoad = new EventEmitter<any>();

  firstRow: number = 0;

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

  // Removed isFavorite since we use contact.isFavorite directly in template

  formatName(contact: Contact): string {
    if (this.nameFormat === 'last-first') {
      return contact.lastName ? `${contact.lastName}, ${contact.firstName}` : (contact.firstName || '');
    }
    return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
  }

  onToggleFavorite(id?: number, event?: Event) {
    if (event) event.stopPropagation();
    if (id !== undefined) this.toggleFavorite.emit(id);
  }

  onEditContact(id?: number, event?: Event) {
    if (event) event.stopPropagation();
    if (id !== undefined) this.editContact.emit(id);
  }

  onDeleteContact(contact: Contact, event?: Event) {
    if (event) event.stopPropagation();
    this.deleteContact.emit(contact);
  }

  onViewContact(contact: Contact) {
    this.viewContact.emit(contact);
  }

  onLazyLoadData(event: any) {
    this.lazyLoad.emit(event);
  }

  constructor(private sanitizer: DomSanitizer) {}

  isPreset(url?: string): boolean {
    return isPresetAvatar(url);
  }

  getPresetSvg(url?: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(getPresetSvg(url));
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getAvatarGradient(firstName: string): string {
    let hash = 0;
    for (let i = 0; i < firstName.length; i++) {
      hash = firstName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.avatarGradients.length;
    return this.avatarGradients[index];
  }
}
