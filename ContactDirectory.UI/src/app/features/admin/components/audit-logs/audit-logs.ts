import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { AdminService } from '../../../../services/admin.service';
import { AuditLogDto, UserSummaryDto } from '../../../../core/models/admin.model';

/**
 * AuditLogsComponent — Sistem denetim ve işlem kayıtları (Audit Logs)
 * 
 * Sorumluluklar:
 * - Gerçekleşen ekleme, güncelleme ve silme loglarını listeler.
 * - Aksiyon türüne (Create, Update, Delete) göre filtreler.
 * - Kullanıcı bazlı ve arama metnine göre dinamik filtreleme yapar.
 * - Sayfalama (Pagination): Rehberdeki gibi standart PrimeNG paging kontrolünü sunar.
 */
@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorModule],
  templateUrl: './audit-logs.html',
  styleUrls: ['./audit-logs.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogsComponent implements OnInit {
  private adminService = inject(AdminService);

  @Input() users: UserSummaryDto[] = [];
  @Output() refreshRequested = new EventEmitter<void>();

  logs = signal<AuditLogDto[]>([]);
  isLoadingLogs = signal<boolean>(true);

  // Filters
  selectedActionFilter = signal<string>('ALL');
  selectedUserFilter = signal<string>('ALL');
  searchQuery = signal<string>('');

  // Sayfalama (Pagination)
  firstRow = signal<number>(0);
  pageSize = signal<number>(10);

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

  // Sayfalama (Pagination) hesaplanan veri
  paginatedLogs = computed(() => {
    const list = this.filteredLogs();
    const start = this.firstRow();
    return list.slice(start, start + this.pageSize());
  });

  onPageChange(event: any): void {
    this.firstRow.set(event.first ?? 0);
    this.pageSize.set(event.rows ?? 10);
  }

  ngOnInit(): void {
    this.loadLogs();
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

  onRefresh(): void {
    this.loadLogs();
    this.refreshRequested.emit();
  }

  setActionFilter(action: string): void {
    this.selectedActionFilter.set(action);
    this.firstRow.set(0);
  }

  onUserFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedUserFilter.set(select.value);
    this.firstRow.set(0);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.firstRow.set(0);
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
}
