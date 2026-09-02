import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-stat-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-row">
      <div class="stat-card stat-total">
        <div class="stat-icon"><i class="pi pi-users"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ totalContacts }}</span>
          <span class="stat-label">Toplam Kişi</span>
        </div>
      </div>
      <div class="stat-card stat-fav">
        <div class="stat-icon"><i class="pi pi-star-fill"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ favoriteCount }}</span>
          <span class="stat-label">Favori</span>
        </div>
      </div>
      <div class="stat-card stat-search">
        <div class="stat-icon"><i class="pi pi-filter"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ filteredCount }}</span>
          <span class="stat-label">Gösterilen</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--surface-card);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--surface-border-light);
      transition: all var(--transition-base);
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: var(--surface-border);
    }
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .stat-total .stat-icon {
      background: var(--primary-50);
      color: var(--primary-600);
    }
    .stat-fav .stat-icon {
      background: var(--warning-50);
      color: var(--warning-500);
    }
    .stat-search .stat-icon {
      background: var(--success-50);
      color: var(--success-500);
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .stat-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
  `]
})
export class StatCardsComponent {
  @Input() totalContacts: number = 0;
  @Input() favoriteCount: number = 0;
  @Input() filteredCount: number = 0;
}
