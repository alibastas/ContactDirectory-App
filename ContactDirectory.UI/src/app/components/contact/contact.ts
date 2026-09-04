import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';
import { Contact } from '../../core/models/contact.model';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { TopbarComponent } from '../../shared/components/topbar/topbar';
import { StatCardsComponent } from '../../features/contacts/components/stat-cards/stat-cards';
import { ContactSearchComponent } from '../../features/contacts/components/contact-search/contact-search';
import { ContactTableComponent } from '../../features/contacts/components/contact-table/contact-table';
import { UserProfileComponent, UserProfileData } from '../../features/contacts/components/user-profile/user-profile';
import { ContactDetailsComponent } from '../../features/contacts/components/contact-details/contact-details';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, ToastModule, ConfirmDialogModule,
    TopbarComponent, StatCardsComponent, ContactSearchComponent, ContactTableComponent, UserProfileComponent,
    ContactDetailsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <p-toast position="top-right" />
      <p-confirmdialog />

      <app-topbar [badgeText]="globalTotalContacts() + ' kişi kayıtlı'">
        <ng-container actions>
          <button *ngIf="isAdmin()" class="btn-admin-panel" (click)="goToAdmin()" title="Yönetici Paneli">
            <i class="pi pi-shield"></i>
            <span>Yönetici Paneli</span>
          </button>
          <button class="btn-primary-add" (click)="addNewContact()">
            <i class="pi pi-plus"></i>
            <span>Yeni Kişi Ekle</span>
          </button>
          <button class="btn-export" (click)="exportCSV()" title="CSV Dışa Aktar" *ngIf="contacts().length > 0">
            <i class="pi pi-download"></i>
          </button>
          <div class="user-avatar" title="Kullanıcı" (click)="openProfile()" style="cursor: pointer;">
            <i class="pi pi-user"></i>
          </div>
          <button class="btn-logout" (click)="logout()" title="Çıkış Yap">
            <i class="pi pi-power-off"></i>
          </button>
        </ng-container>
      </app-topbar>

      <main class="main-content">
        <app-stat-cards 
          [totalContacts]="globalTotalContacts()"
          [favoriteCount]="globalFavoriteCount()"
          [filteredCount]="totalRecords()">
        </app-stat-cards>

        <div class="content-grid-full">
          <div class="card list-card">
            <div class="card-header">
              <div class="card-header-icon list-icon">
                <i class="pi pi-list"></i>
              </div>
              <h2>Kayıtlı Kişiler</h2>

              <app-contact-search
                [activeFilter]="activeFilter()"
                [searchQuery]="searchQuery()"
                (filterChange)="setFilter($event)"
                (searchChange)="setSearchQuery($event)">
              </app-contact-search>
            </div>

            <app-contact-table
              [contacts]="contacts()"
              [isLoading]="isLoading()"
              [searchQuery]="searchQuery()"
              [activeFilter]="activeFilter()"
              [totalRecords]="totalRecords()"
              (viewContact)="viewContact($event)"
              (editContact)="editContact($event)"
              (deleteContact)="confirmDeleteContact($event)"
              (toggleFavorite)="toggleFavorite($event)"
              (lazyLoad)="onLazyLoad($event)">
            </app-contact-table>
          </div>
        </div>
      </main>

      <app-contact-details
        [contact]="selectedContact()"
        [visible]="showContactDetails()"
        (visibleChange)="showContactDetails.set($event)"
        (edit)="editContact($event)">
      </app-contact-details>

      <app-user-profile
        [visible]="showProfileDialog()"
        [profileData]="profileData()"
        (visibleChange)="showProfileDialog.set($event)"
        (saveProfile)="saveProfileDetails($event)">
      </app-user-profile>
    </div>
  `,
  styles: [`
    .dashboard {
      background: var(--surface-ground);
      min-height: 100vh;
    }
    
    .btn-primary-add {
      background: var(--primary-600);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }
    .btn-primary-add:hover {
      background: var(--primary-700);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .btn-admin-panel {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }
    .btn-admin-panel:hover {
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .btn-export, .btn-logout {
      background: var(--surface-card);
      color: var(--text-secondary);
      border: 1px solid var(--surface-border);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-export:hover {
      color: var(--primary-600);
      border-color: var(--primary-200);
      background: var(--primary-50);
    }
    .btn-logout:hover {
      color: var(--danger-600);
      border-color: var(--danger-200);
      background: var(--danger-50);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 600;
      border: 2px solid white;
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition-fast);
    }
    .user-avatar:hover {
      transform: scale(1.05);
    }

    .main-content {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }

    .content-grid-full {
      width: 100%;
    }

    .card {
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--surface-border-light);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .list-card {
      min-height: 500px;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .card-header-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .list-icon {
      background: var(--info-50);
      color: var(--info-600);
    }

    .card-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      flex-grow: 1;
    }
  `]
})
export class ContactComponent implements OnInit {
  contacts = signal<(Contact & { firstLetter?: string })[]>([]);
  searchQuery = signal('');
  activeFilter = signal<'all' | 'favorites'>('all');
  isLoading = signal(false);
  showProfileDialog = signal(false);
  profileData = signal<UserProfileData>({ username: '', email: '', country: '' });
  
  showContactDetails = signal(false);
  selectedContact = signal<Contact | null>(null);

  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);

  globalTotalContacts = signal(0);
  globalFavoriteCount = signal(0);

  isAdmin = computed(() => this.authService.isAdmin());

  constructor(
    private contactService: ContactService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const username = this.authService.getUsername();
    this.profileData.set({
      username: username,
      email: localStorage.getItem(`profile_email_${username}`) || '',
      country: localStorage.getItem(`profile_country_${username}`) || ''
    });

    this.loadContacts();
    this.loadStats();
  }

  loadStats() {
    this.contactService.getContactStats().subscribe({
      next: (stats) => {
        this.globalTotalContacts.set(stats.totalContacts);
        this.globalFavoriteCount.set(stats.favoriteContacts);
      },
      error: (err) => console.error('İstatistikler alınamadı', err)
    });
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  addNewContact() {
    this.router.navigate(['/contacts/new']);
  }

  editContact(id: number) {
    this.router.navigate(['/contacts/edit', id]);
  }

  viewContact(contact: Contact) {
    this.selectedContact.set(contact);
    this.showContactDetails.set(true);
  }

  toggleFavorite(id: number) {
    const contact = this.contacts().find(c => c.id === id);
    if (!contact) return;
    
    const updatedContact = { ...contact, isFavorite: !contact.isFavorite };
    this.contacts.update(contacts => contacts.map(c => c.id === id ? updatedContact : c));

    this.contactService.updateContact(id, updatedContact).subscribe({
      next: () => {
        this.loadStats(); // Update global favorite count
      },
      error: () => {
        this.contacts.update(contacts => contacts.map(c => c.id === id ? contact : c));
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Favori durumu güncellenemedi.' });
      }
    });
  }

  setFilter(filter: 'all' | 'favorites') {
    this.activeFilter.set(filter);
    this.currentPage.set(1); // Reset to first page
    this.loadContacts();
  }
  
  setSearchQuery(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page
    this.loadContacts();
  }

  onLazyLoad(event: any) {
    const page = event.first / event.rows + 1;
    this.currentPage.set(page);
    this.pageSize.set(event.rows);
    this.loadContacts();
  }

  loadContacts() {
    this.isLoading.set(true);
    const searchTerm = this.searchQuery();
    const isFavoriteOnly = this.activeFilter() === 'favorites';
    const page = this.currentPage();
    const pageSize = this.pageSize();

    this.contactService.getContacts(searchTerm, isFavoriteOnly, page, pageSize).subscribe({
      next: (response) => {
        let loadedContacts = Array.isArray(response.items) ? response.items : [];
        this.contacts.set(loadedContacts.map((c: any) => ({
          ...c,
          firstLetter: c.firstName ? c.firstName.charAt(0).toUpperCase() : '#'
        })));
        this.totalRecords.set(response.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Kişiler yüklenirken hata oluştu:', err);
        this.isLoading.set(false);
        if (err.status === 401) {
          this.messageService.add({ severity: 'error', summary: 'Oturum Süresi Doldu', detail: 'Lütfen tekrar giriş yapın.' });
          setTimeout(() => this.logout(), 2000);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Kişiler yüklenirken bir hata oluştu.' });
        }
      }
    });
  }

  confirmDeleteContact(contact: Contact) {
    this.confirmationService.confirm({
      message: `<strong>${contact.firstName} ${contact.lastName}</strong> adlı kişiyi silmek istediğinize emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, Sil',
      rejectLabel: 'İptal',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (contact.id) {
          this.contactService.deleteContact(contact.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Silindi', detail: 'Kişi başarıyla silindi.' });
              this.loadContacts();
              this.loadStats(); // Update global stats
            },
            error: () => {
              this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Silme işlemi başarısız oldu.' });
            }
          });
        }
      }
    });
  }

  exportCSV() {
    const currentContacts = this.contacts();
    if (currentContacts.length === 0) return;

    const headers = ['Ad', 'Soyad', 'Telefon', 'E-posta'];
    const rows = currentContacts.map(c =>
      [c.firstName, c.lastName, c.phoneNumber, c.email || ''].map(field =>
        `"${(field || '').replace(/"/g, '""')}"`
      ).join(',')
    );

    const bom = '\uFEFF';
    const csv = bom + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kisiler_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.messageService.add({ severity: 'info', summary: 'Dışa Aktarıldı', detail: `${currentContacts.length} kişi CSV olarak indirildi.` });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openProfile() {
    this.showProfileDialog.set(true);
  }

  saveProfileDetails(data: UserProfileData) {
    this.profileData.set(data);
    localStorage.setItem(`profile_email_${data.username}`, data.email);
    localStorage.setItem(`profile_country_${data.username}`, data.country);
    this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Profil bilgileri güncellendi.' });
    this.showProfileDialog.set(false);
  }
}