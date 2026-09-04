import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth';
import { AdminDashboardDto, AuditLogDto, UserSummaryDto } from '../../core/models/admin.model';
import { TopbarComponent } from '../../shared/components/topbar/topbar';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminDashboardDto | null>(null);
  logs = signal<AuditLogDto[]>([]);
  isLoadingStats = signal<boolean>(true);
  isLoadingLogs = signal<boolean>(true);
  isUpdatingRoleId = signal<number | null>(null);

  // Filters
  selectedActionFilter = signal<string>('ALL');
  selectedUserFilter = signal<string>('ALL');
  searchQuery = signal<string>('');

  currentUsername = computed(() => this.authService.getUsername());

  // Filtered Logs
  filteredLogs = computed(() => {
    const list = this.logs() || [];
    const action = this.selectedActionFilter();
    const user = this.selectedUserFilter();
    const q = this.searchQuery().trim().toLowerCase();

    return list.filter(item => {
      // Action filter
      const matchAction = action === 'ALL' || item.action?.toUpperCase() === action;
      if (!matchAction) return false;

      // User filter
      const matchUser = user === 'ALL' || item.username?.toLowerCase() === user.toLowerCase();
      if (!matchUser) return false;

      // Search query
      if (!q) return true;

      const userMatch = item.username?.toLowerCase().includes(q);
      const detailMatch = item.details?.toLowerCase().includes(q);
      const entityMatch = item.entityName?.toLowerCase().includes(q);
      const actionMatch = item.action?.toLowerCase().includes(q);

      return Boolean(userMatch || detailMatch || entityMatch || actionMatch);
    });
  });

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadStats();
    this.loadLogs();
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

  loadLogs(): void {
    this.isLoadingLogs.set(true);
    this.adminService.getLogs(1, 100).subscribe({
      next: (response) => {
        const items = response?.items || [];
        this.logs.set(items);
        this.isLoadingLogs.set(false);
      },
      error: (err) => {
        console.error('Loglar yüklenirken hata:', err);
        this.logs.set([]);
        this.isLoadingLogs.set(false);
      }
    });
  }

  setActionFilter(action: string): void {
    this.selectedActionFilter.set(action);
  }

  onUserFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedUserFilter.set(select.value);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  toggleUserRole(user: UserSummaryDto): void {
    if (user.username.toLowerCase() === this.currentUsername().toLowerCase()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Kendi rolünüzü admin panelinden değiştiremezsiniz.'
      });
      return;
    }

    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    this.isUpdatingRoleId.set(user.userId);

    this.adminService.updateUserRole(user.userId, newRole).subscribe({
      next: () => {
        this.isUpdatingRoleId.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Yetki Güncellendi',
          detail: `'${user.username}' kullanıcısının rolü '${newRole}' olarak değiştirildi.`
        });
        this.loadAll(); // Reload stats and new audit log!
      },
      error: (err) => {
        this.isUpdatingRoleId.set(null);
        console.error('Rol güncellenemedi:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Hata',
          detail: 'Kullanıcı rolü güncellenirken bir sorun oluştu.'
        });
      }
    });
  }

  getRelativeTime(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);

      if (diffSec < 45) return 'Az önce';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} dk önce`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} saat önce`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay === 1) return 'Dün';
      if (diffDay < 30) return `${diffDay} gün önce`;

      return this.formatDate(dateStr);
    } catch {
      return dateStr;
    }
  }

  goToContacts(): void {
    this.router.navigate(['/contacts']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getActionClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'action-create';
      case 'UPDATE':
        return 'action-update';
      case 'DELETE':
        return 'action-delete';
      default:
        return '';
    }
  }

  getActionText(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'Ekleme';
      case 'UPDATE':
        return 'Güncelleme';
      case 'DELETE':
        return 'Silme';
      default:
        return action || 'İşlem';
    }
  }

  getActionIcon(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'pi pi-plus';
      case 'UPDATE':
        return 'pi pi-pencil';
      case 'DELETE':
        return 'pi pi-trash';
      default:
        return 'pi pi-info-circle';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
