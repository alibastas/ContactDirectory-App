import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth';
import { UserSummaryDto } from '../../../../core/models/admin.model';
import { MessageService } from 'primeng/api';

/**
 * UserManagementComponent — Kullanıcı listesi, rolleri ve yetki yönetimi
 * 
 * Sorumluluklar:
 * - Kullanıcı dağılımı ve kişi sayılarını listeler.
 * - Admin/User yetki değişimini gerçekleştirir.
 * - Sayfalama (Pagination): Rehberdeki standart PrimeNG paging kontrolünü sunar.
 */
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, PaginatorModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  @Input() users: UserSummaryDto[] = [];
  @Input() isLoading: boolean = false;
  @Output() roleChanged = new EventEmitter<void>();

  isUpdatingRoleId = signal<number | null>(null);
  currentUsername = computed(() => this.authService.getUsername());

  // Sayfalama (Pagination)
  firstRow = signal<number>(0);
  pageSize = signal<number>(10);

  paginatedUsers = computed(() => {
    const list = this.users || [];
    const start = this.firstRow();
    return list.slice(start, start + this.pageSize());
  });

  onPageChange(event: any): void {
    this.firstRow.set(event.first ?? 0);
    this.pageSize.set(event.rows ?? 10);
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
        this.roleChanged.emit();
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
}
