import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div class="topbar-brand">
        <div class="topbar-logo">
          <i class="pi pi-address-book"></i>
        </div>
        <div>
          <h1>{{ title }}</h1>
          <span class="topbar-badge" *ngIf="badgeText">{{ badgeText }}</span>
        </div>
      </div>
      <div class="topbar-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 2rem;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--surface-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .topbar-logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      box-shadow: var(--shadow-md);
    }
    .topbar-brand h1 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      letter-spacing: -0.02em;
    }
    .topbar-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--primary-50);
      color: var(--primary-600);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--primary-100);
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  `]
})
export class TopbarComponent {
  @Input() title: string = 'Kişi Rehberi';
  @Input() badgeText?: string;
}
