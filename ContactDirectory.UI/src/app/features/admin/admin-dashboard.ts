import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth';
import { AdminDashboardDto } from '../../core/models/admin.model';
import { TopbarComponent } from '../../shared/components/topbar/topbar';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UserManagementComponent } from './components/user-management/user-management';
import { AuditLogsComponent } from './components/audit-logs/audit-logs';

/**
 * AdminDashboardComponent — Ana Yönetim Paneli Çerçevesi
 *
 * Sorumluluklar:
 * - Üst çubuk (Topbar) ve oturum çıkışı
 * - Üst KPI istatistik kartları (Toplam Kullanıcı, Rehber, İşlem)
 * - Sekmeli Gezinme (Tab Navigation): Kullanıcı Yönetimi vs. Audit Logs
 * - Alt bileşenleri (UserManagement, AuditLogs) koordine eder.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    TopbarComponent, 
    ToastModule,
    UserManagementComponent,
    AuditLogsComponent
  ],
  providers: [MessageService],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);

  stats = signal<AdminDashboardDto | null>(null);
  isLoadingStats = signal<boolean>(true);

  /** Aktif Sekme: 'users' veya 'logs' */
  activeTab = signal<'users' | 'logs'>('users');

  currentUsername = computed(() => this.authService.getUsername());

  ngOnInit(): void {
    this.loadStats();
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

  setActiveTab(tab: 'users' | 'logs'): void {
    this.activeTab.set(tab);
  }

  goToContacts(): void {
    this.router.navigate(['/contacts']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
