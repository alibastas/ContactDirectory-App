import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth';
import { ContactService, ContactRequest } from '../../services/contact.service';
import { ExcelService } from '../../services/excel.service';
import { AdminDashboardDto } from '../../core/models/admin.model';
import { TopbarComponent } from '../../shared/components/topbar/topbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UserManagementComponent } from './components/user-management/user-management';
import { AuditLogsComponent } from './components/audit-logs/audit-logs';

/**
 * AdminDashboardComponent — Ana Yönetim Paneli Çerçevesi
 *
 * Sorumluluklar:
 * - Üst çubuk (Topbar) ve oturum çıkışı
 * - Üst KPI istatistik kartları (Toplam Kullanıcı, Rehber, İşlem)
 * - Sekmeli Gezinme (Tab Navigation): Kullanıcı Yönetimi vs. Audit Logs vs. İletişim Talepleri
 * - İletişim taleplerini listeleme, Excel'e aktarma ve onaylı silme işlemleri
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    TopbarComponent, 
    ToastModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    UserManagementComponent,
    AuditLogsComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private contactService = inject(ContactService);
  private confirmationService = inject(ConfirmationService);
  private excelService = inject(ExcelService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  stats = signal<AdminDashboardDto | null>(null);
  isLoadingStats = signal<boolean>(true);

  /** Aktif Sekme: 'users' | 'logs' | 'requests' */
  activeTab = signal<'users' | 'logs' | 'requests'>('users');

  /** İletişim Talepleri Durumu */
  contactRequests = signal<ContactRequest[]>([]);
  isLoadingRequests = signal<boolean>(false);

  currentUsername = computed(() => this.authService.getUsername());

  ngOnInit(): void {
    this.loadStats();
    this.loadContactRequests();
  }

  loadStats(): void {
    this.isLoadingStats.set(true);
    this.adminService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoadingStats.set(false);
      },
      error: (err) => {
        console.error('İstatistikler yüklenirken hata:', err);
        this.isLoadingStats.set(false);
      }
    });
  }

  loadContactRequests(): void {
    this.isLoadingRequests.set(true);
    this.contactService.getContactRequests().subscribe({
      next: (data) => {
        this.contactRequests.set(data);
        this.isLoadingRequests.set(false);
      },
      error: (err) => {
        console.error('İletişim talepleri alınamadı:', err);
        this.isLoadingRequests.set(false);
      }
    });
  }

  confirmDeleteRequest(req: ContactRequest): void {
    this.confirmationService.confirm({
      message: `<strong>${req.firstName} ${req.lastName ?? ''}</strong> kişisine ait iletişim talebini silmek istediğinize emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, Sil',
      rejectLabel: 'Vazgeç',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        if (req.id) {
          this.contactService.deleteContactRequest(req.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Başarılı',
                detail: 'İletişim talebi başarıyla silindi.'
              });
              this.loadContactRequests();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Hata',
                detail: 'Talep silinirken bir sorun oluştu.'
              });
            }
          });
        }
      }
    });
  }

  exportRequestsToExcel(): void {
    const data = this.contactRequests();
    if (!data || data.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Dışa aktarılacak talep bulunamadı.'
      });
      return;
    }

    this.excelService.exportContactRequestsToExcel(data, 'Musteri_Iletisim_Talepleri');

    this.messageService.add({
      severity: 'success',
      summary: 'İndirildi',
      detail: 'Talepler Excel dosyası olarak indirildi.'
    });
  }
  setActiveTab(tab: 'users' | 'logs' | 'requests'): void {
    this.activeTab.set(tab);
    if (tab === 'requests') {
      this.loadContactRequests();
    }
  }

  goToContacts(): void {
    this.router.navigate(['/contacts']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}