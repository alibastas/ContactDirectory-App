import { Component, OnInit, ChangeDetectionStrategy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService, AdvancedSearchParams } from '../../services/contact.service';
import { Contact } from '../../core/models/contact.model';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
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
import { ExcelImportDialogComponent } from '../../features/contacts/components/excel-import/excel-import-dialog';
import { ExcelService } from '../../services/excel.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, ToastModule, ConfirmDialogModule,
    TopbarComponent, StatCardsComponent, ContactSearchComponent, ContactTableComponent, UserProfileComponent,
    ContactDetailsComponent, ExcelImportDialogComponent
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

          <!-- İçe Aktar Dropdown -->
          <div class="dropdown-wrapper">
            <button class="btn-dropdown btn-import" (click)="toggleImportMenu($event)" title="İçe Aktar">
              <i class="pi pi-download"></i>
              <span>İçe Aktar</span>
              <i class="pi pi-chevron-down dropdown-chevron" [class.open]="showImportMenu()"></i>
            </button>
            <div class="dropdown-menu" *ngIf="showImportMenu()" (click)="$event.stopPropagation()">
              <button class="dropdown-item" (click)="openImportDialog('excel')">
                <i class="pi pi-file-excel item-icon excel-icon"></i>
                <div class="item-text">
                  <span class="item-label">Excel'den Aktar</span>
                  <span class="item-desc">.xlsx, .xls dosyaları</span>
                </div>
              </button>
              <button class="dropdown-item" (click)="openImportDialog('csv')">
                <i class="pi pi-file item-icon csv-icon"></i>
                <div class="item-text">
                  <span class="item-label">CSV'den Aktar</span>
                  <span class="item-desc">.csv dosyaları</span>
                </div>
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" (click)="downloadTemplate()">
                <i class="pi pi-file-export item-icon template-icon"></i>
                <div class="item-text">
                  <span class="item-label">Şablon İndir</span>
                  <span class="item-desc">Toplu aktarım şablonu</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Dışa Aktar Dropdown -->
          <div class="dropdown-wrapper" *ngIf="globalTotalContacts() > 0">
            <button class="btn-dropdown btn-export" (click)="toggleExportMenu($event)" title="Dışa Aktar">
              <i class="pi pi-upload"></i>
              <span>Dışa Aktar</span>
              <i class="pi pi-chevron-down dropdown-chevron" [class.open]="showExportMenu()"></i>
            </button>
            <div class="dropdown-menu" *ngIf="showExportMenu()" (click)="$event.stopPropagation()">
              <!-- Filtre Uyarısı -->
              <div class="filter-notice" *ngIf="hasActiveFilter()">
                <i class="pi pi-filter"></i>
                <span>Aktif Filtre: "{{ activeFilterLabel() }}" ({{ totalRecords() }} kayıt)</span>
              </div>
              <button class="dropdown-item" (click)="exportData('excel')">
                <i class="pi pi-file-excel item-icon excel-icon"></i>
                <div class="item-text">
                  <span class="item-label">Excel'e Aktar</span>
                  <span class="item-desc">.xlsx formatında indir</span>
                </div>
              </button>
              <button class="dropdown-item" (click)="exportData('csv')">
                <i class="pi pi-file item-icon csv-icon"></i>
                <div class="item-text">
                  <span class="item-label">CSV'ye Aktar</span>
                  <span class="item-desc">.csv formatında indir</span>
                </div>
              </button>
            </div>
          </div>

          <button class="btn-primary-add" (click)="addNewContact()">
            <i class="pi pi-plus"></i>
            <span>Yeni Kişi Ekle</span>
          </button>
          <button class="btn-settings" (click)="goToSettings()" title="Ayarlar">
            <i class="pi pi-cog"></i>
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
            <app-contact-search
              [activeFilter]="activeFilter()"
              [searchQuery]="searchQuery()"
              (filterChange)="setFilter($event)"
              (searchChange)="setSearchQuery($event)"
              (advancedChange)="setAdvancedFilters($event)">
              <div title class="card-title-group">
                <div class="card-header-icon list-icon">
                  <i class="pi pi-list"></i>
                </div>
                <h2>Kayıtlı Kişiler</h2>
              </div>
            </app-contact-search>

            <app-contact-table
              [contacts]="contacts()"
              [isLoading]="isLoading()"
              [searchQuery]="searchQuery()"
              [activeFilter]="activeFilter()"
              [totalRecords]="totalRecords()"
              [rows]="pageSize()"
              [nameFormat]="nameSortFormat()"
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

      <app-excel-import-dialog
        [visible]="showImportDialogVisible()"
        [importType]="currentImportType()"
        (visibleChange)="showImportDialogVisible.set($event)"
        (importCompleted)="onImportCompleted($event)">
      </app-excel-import-dialog>
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

    /* ======= Dropdown Sistem ======= */
    .dropdown-wrapper {
      position: relative;
    }

    .btn-dropdown {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.95rem;
      background: white;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-xs);
    }

    .dropdown-chevron {
      font-size: 0.65rem;
      transition: transform 0.2s ease;
      margin-left: 0.15rem;
    }
    .dropdown-chevron.open {
      transform: rotate(180deg);
    }

    .btn-import:hover {
      background: #f0fdf4;
      color: #047857;
      border-color: #86efac;
      transform: translateY(-1px);
    }
    .btn-export:hover {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #93c5fd;
      transform: translateY(-1px);
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 240px;
      background: white;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      z-index: 200;
      padding: 0.35rem;
      animation: dropdownFadeIn 0.15s ease-out;
    }

    :host-context(html.dark) .btn-dropdown {
      background: var(--surface-card);
      border-color: var(--surface-border);
      color: var(--text-primary);
      box-shadow: none;
    }
    :host-context(html.dark) .btn-dropdown:hover {
      background: var(--surface-hover);
      border-color: var(--primary-400);
      color: var(--primary-300);
    }

    :host-context(html.dark) .dropdown-menu {
      background: #131d31;
      border-color: #1e293b;
      box-shadow: 0 16px 40px -6px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: none;
      background: transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }
    .dropdown-item:hover {
      background: var(--surface-hover);
    }

    :host-context(html.dark) .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    .item-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      flex-shrink: 0;
    }
    .excel-icon {
      background: #ecfdf5;
      color: #059669;
    }
    .csv-icon {
      background: #eff6ff;
      color: #2563eb;
    }
    .template-icon {
      background: #fdf4ff;
      color: #a855f7;
    }

    :host-context(html.dark) .excel-icon {
      background: rgba(16, 185, 129, 0.18);
      color: #34d399;
    }
    :host-context(html.dark) .csv-icon {
      background: rgba(59, 130, 246, 0.18);
      color: #60a5fa;
    }
    :host-context(html.dark) .template-icon {
      background: rgba(168, 85, 247, 0.18);
      color: #c084fc;
    }

    .item-text {
      display: flex;
      flex-direction: column;
    }
    .item-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .item-desc {
      font-size: 0.7rem;
      color: var(--text-secondary);
      margin-top: 1px;
    }

    .dropdown-divider {
      height: 1px;
      background: var(--surface-border);
      margin: 0.3rem 0.5rem;
    }

    :host-context(html.dark) .dropdown-divider {
      background: #1e293b;
    }

    .filter-notice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      margin: 0.2rem 0.2rem 0.3rem;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border: 1px solid #fbbf24;
      border-radius: var(--radius-md);
      font-size: 0.7rem;
      font-weight: 600;
      color: #92400e;
    }
    .filter-notice i {
      font-size: 0.75rem;
      color: #d97706;
    }

    :host-context(html.dark) .filter-notice {
      background: rgba(245, 158, 11, 0.12);
      border-color: rgba(245, 158, 11, 0.35);
      color: #fcd34d;
    }
    :host-context(html.dark) .filter-notice i {
      color: #fbbf24;
    }

    .btn-settings {
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
      font-size: 1.05rem;
      transition: all var(--transition-fast);
    }
    .btn-settings:hover {
      color: var(--primary-600);
      border-color: var(--primary-300);
      background: var(--surface-hover);
      transform: rotate(45deg);
    }

    .btn-logout {
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

    .card-title-group {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    
    .card-header-icon {
      width: 44px;
      height: 44px;
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

    .card-title-group h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
  `]
})
export class ContactComponent implements OnInit {
  contacts = signal<(Contact & { firstLetter?: string })[]>([]);
  searchQuery = signal('');
  activeFilter = signal<'all' | 'favorites'>('all');
  isLoading = signal(false);
  showProfileDialog = signal(false);
  showImportDialogVisible = signal(false);
  currentImportType = signal<'excel' | 'csv'>('excel');
  profileData = signal<UserProfileData>({ username: '', email: '', country: '' });
  
  showContactDetails = signal(false);
  selectedContact = signal<Contact | null>(null);

  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  nameSortFormat = signal<'first-last' | 'last-first'>('first-last');

  globalTotalContacts = signal(0);
  globalFavoriteCount = signal(0);

  showImportMenu = signal(false);
  showExportMenu = signal(false);

  advancedSearchParams = signal<AdvancedSearchParams>({});

  isAdmin = computed(() => this.authService.isAdmin());

  hasActiveFilter = computed(() => {
    const adv = this.advancedSearchParams();
    const hasAdv = !!(adv.firstName || adv.lastName || adv.phoneNumber || adv.email);
    return this.searchQuery().length > 0 || this.activeFilter() === 'favorites' || hasAdv;
  });

  activeFilterLabel = computed(() => {
    const parts: string[] = [];
    if (this.searchQuery()) parts.push(this.searchQuery());
    if (this.activeFilter() === 'favorites') parts.push('Favoriler');
    const adv = this.advancedSearchParams();
    if (adv.firstName) parts.push(`Ad: ${adv.firstName}`);
    if (adv.lastName) parts.push(`Soyad: ${adv.lastName}`);
    if (adv.phoneNumber) parts.push(`Tel: ${adv.phoneNumber}`);
    if (adv.email) parts.push(`E-posta: ${adv.email}`);
    return parts.join(' | ');
  });

  constructor(
    private contactService: ContactService,
    private authService: AuthService,
    private excelService: ExcelService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  @HostListener('document:click')
  onDocumentClick() {
    this.showImportMenu.set(false);
    this.showExportMenu.set(false);
  }

  ngOnInit(): void {
    const username = this.authService.getUsername();
    this.profileData.set({
      username: username,
      email: localStorage.getItem(`profile_email_${username}`) || '',
      country: localStorage.getItem(`profile_country_${username}`) || ''
    });

    const savedFormat = localStorage.getItem('contact_name_format') as 'first-last' | 'last-first';
    if (savedFormat) {
      this.nameSortFormat.set(savedFormat);
    }

    const savedPageSize = localStorage.getItem('contact_page_size');
    if (savedPageSize) {
      this.pageSize.set(parseInt(savedPageSize, 10));
    }

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

  toggleImportMenu(event: Event) {
    event.stopPropagation();
    this.showExportMenu.set(false);
    this.showImportMenu.update(v => !v);
  }

  toggleExportMenu(event: Event) {
    event.stopPropagation();
    this.showImportMenu.set(false);
    this.showExportMenu.update(v => !v);
  }

  openImportDialog(type: 'excel' | 'csv') {
    this.showImportMenu.set(false);
    this.currentImportType.set(type);
    this.showImportDialogVisible.set(true);
  }

  downloadTemplate() {
    this.showImportMenu.set(false);
    this.excelService.downloadSampleTemplate();
    this.messageService.add({
      severity: 'info',
      summary: 'Şablon İndirildi',
      detail: 'Örnek şablon bilgisayarınıza kaydedildi.'
    });
  }

  onImportCompleted(count: number) {
    this.loadContacts();
    this.loadStats();
  }

  exportData(format: 'excel' | 'csv') {
    this.showExportMenu.set(false);

    const query = this.searchQuery();
    const isFav = this.activeFilter() === 'favorites';
    const adv = this.advancedSearchParams();

    this.contactService.getExportContacts(query, isFav, adv).subscribe({
      next: (allMatching) => {
        if (!allMatching || allMatching.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Kayıt Bulunamadı',
            detail: 'Filtreye uygun dışa aktarılacak kişi bulunamadı.'
          });
          return;
        }

        let filterDescription = '';
        if (query) filterDescription += `arama_${query}`;
        if (isFav) filterDescription += (filterDescription ? '_' : '') + 'favoriler';
        if (adv.firstName) filterDescription += (filterDescription ? '_' : '') + `ad_${adv.firstName}`;
        if (adv.lastName) filterDescription += (filterDescription ? '_' : '') + `soyad_${adv.lastName}`;
        if (adv.phoneNumber) filterDescription += (filterDescription ? '_' : '') + `tel_${adv.phoneNumber}`;
        if (adv.email) filterDescription += (filterDescription ? '_' : '') + `mail_${adv.email}`;

        if (format === 'excel') {
          this.excelService.exportContactsToExcel(allMatching, filterDescription);
        } else {
          this.excelService.exportContactsToCsv(allMatching, filterDescription);
        }

        const formatLabel = format === 'excel' ? 'Excel (.xlsx)' : 'CSV (.csv)';
        this.messageService.add({
          severity: 'success',
          summary: `${formatLabel} İndirildi`,
          detail: `Filtrenize uyan ${allMatching.length} kişi ${formatLabel} olarak başarıyla indirildi.`
        });
      },
      error: (err) => {
        console.error('Export hatasi:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Hata',
          detail: 'Kişiler dışa aktarılırken bir sorun oluştu.'
        });
      }
    });
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
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

  private togglingFavorites = new Set<number>();

  toggleFavorite(id: number) {
    if (this.togglingFavorites.has(id)) return;

    const contact = this.contacts().find(c => c.id === id);
    if (!contact) return;
    
    this.togglingFavorites.add(id);

    const updatedContact = { ...contact, isFavorite: !contact.isFavorite };
    this.contacts.update(contacts => contacts.map(c => c.id === id ? updatedContact : c));

    this.contactService.updateContact(id, updatedContact)
      .pipe(finalize(() => this.togglingFavorites.delete(id)))
      .subscribe({
        next: () => {
          this.loadStats();
        },
        error: () => {
          this.contacts.update(contacts => contacts.map(c => c.id === id ? contact : c));
          this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Favori durumu güncellenemedi.' });
        }
      });
  }

  setFilter(filter: 'all' | 'favorites') {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.loadContacts();
  }
  
  setSearchQuery(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadContacts();
  }

  setAdvancedFilters(filters: AdvancedSearchParams) {
    this.advancedSearchParams.set(filters);
    this.currentPage.set(1);
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
    const adv = this.advancedSearchParams();

    this.contactService.getContacts(searchTerm, isFavoriteOnly, page, pageSize, adv).subscribe({
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
              this.loadStats();
            },
            error: () => {
              this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Silme işlemi başarısız oldu.' });
            }
          });
        }
      }
    });
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
