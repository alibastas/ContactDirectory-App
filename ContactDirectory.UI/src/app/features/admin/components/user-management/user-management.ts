import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, inject, computed, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PaginatorModule } from 'primeng/paginator';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth';
import { UserSummaryDto } from '../../../../core/models/admin.model';
import { MessageService } from 'primeng/api';
import { isPresetAvatar, getPresetSvg } from '../../../../core/constants/avatars';

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
  private sanitizer = inject(DomSanitizer);
  private elementRef = inject(ElementRef);

  @Input() users: UserSummaryDto[] = [];
  @Input() isLoading: boolean = false;
  @Output() roleChanged = new EventEmitter<void>();

  isUpdatingRoleId = signal<number | null>(null);
  currentUsername = computed(() => this.authService.getUsername());

  isPreset(url?: string): boolean {
    return isPresetAvatar(url);
  }

  getPresetSvg(id?: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(getPresetSvg(id));
  }

  getInitials(username?: string): string {
    if (!username) return 'U';
    const clean = username.trim();
    if (clean.length <= 2) return clean.toUpperCase();
    return clean.charAt(0).toUpperCase();
  }

  getAvatarGradient(username?: string): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #4f46e5)',
      'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'linear-gradient(135deg, #0ea5e9, #0284c7)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ec4899, #be185d)',
      'linear-gradient(135deg, #8b5cf6, #6d28d9)'
    ];
    if (!username) return gradients[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }

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
    this.scrollToTop();
  }

  private scrollToTop(): void {
    setTimeout(() => {
      const el = this.elementRef.nativeElement.querySelector('.table-responsive') || this.elementRef.nativeElement;
      if (el) {
        const topOffset = 100;
        const targetY = el.getBoundingClientRect().top + window.scrollY - topOffset;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }
    }, 20);
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
