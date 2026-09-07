import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdvancedSearchParams } from '../../../../services/contact.service';

@Component({
  selector: 'app-contact-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-wrapper">
      <!-- Ana Arama Çubuğu ve Butonlar -->
      <div class="search-container">
        <div class="filter-chips">
          <button class="chip" [class.active]="activeFilter === 'all'" (click)="onFilterChange('all')">Tümü</button>
          <button class="chip" [class.active]="activeFilter === 'favorites'" (click)="onFilterChange('favorites')">
            <i class="pi pi-star-fill" style="font-size: 0.7rem; margin-right: 4px;"></i>Favoriler
          </button>
        </div>

        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input 
            type="text" 
            [ngModel]="searchQuery" 
            (ngModelChange)="onSearchChange($event)"
            placeholder="Hızlı ara (isim, tel, e-posta)..." 
            class="search-input" />
          <button class="search-clear" *ngIf="searchQuery" (click)="onSearchChange('')" title="Temizle">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Detaylı Arama Aç/Kapat Butonu -->
        <button 
          type="button" 
          class="btn-toggle-advanced" 
          [class.active]="isAdvancedOpen() || hasAdvancedFilters"
          (click)="toggleAdvanced()" 
          title="Gelişmiş Arama Seçenekleri">
          <i class="pi pi-sliders-h"></i>
          <span>Detaylı Arama</span>
          <span class="active-badge-dot" *ngIf="hasAdvancedFilters"></span>
        </button>
      </div>

      <!-- Detaylı Arama Paneli (Açılır/Kapanır) -->
      <div class="advanced-panel" *ngIf="isAdvancedOpen()">
        <div class="advanced-header">
          <div class="advanced-title">
            <i class="pi pi-filter"></i>
            <span>Detaylı Arama Kriterleri</span>
          </div>
          <button 
            type="button" 
            class="btn-clear-advanced" 
            *ngIf="hasAdvancedFilters" 
            (click)="clearAdvancedFilters()">
            <i class="pi pi-filter-slash"></i>
            <span>Kriterleri Temizle</span>
          </button>
        </div>

        <div class="advanced-grid">
          <div class="advanced-field">
            <label><i class="pi pi-user"></i> Ad <span class="field-restriction">(Sadece harf)</span></label>
            <input 
              type="text" 
              [ngModel]="firstName" 
              (keydown)="onlyLetters($event)"
              (input)="onNameInput($event, 'firstName')" 
              placeholder="Ada göre filtrele..." 
              class="field-input" />
          </div>

          <div class="advanced-field">
            <label><i class="pi pi-id-card"></i> Soyad <span class="field-restriction">(Sadece harf)</span></label>
            <input 
              type="text" 
              [ngModel]="lastName" 
              (keydown)="onlyLetters($event)"
              (input)="onNameInput($event, 'lastName')" 
              placeholder="Soyada göre filtrele..." 
              class="field-input" />
          </div>

          <div class="advanced-field">
            <label><i class="pi pi-phone"></i> Telefon Numarası <span class="field-restriction">(Sadece rakam)</span></label>
            <input 
              type="text" 
              [ngModel]="phoneNumber" 
              (keydown)="onlyNumbers($event)"
              (input)="onPhoneInput($event)" 
              placeholder="05... veya numara..." 
              class="field-input" />
          </div>

          <div class="advanced-field">
            <label><i class="pi pi-envelope"></i> E-posta Adresi</label>
            <input 
              type="text" 
              [ngModel]="email" 
              (ngModelChange)="onFieldChange('email', $event)" 
              placeholder="ornek@alanadi.com..." 
              class="field-input" />
          </div>
        </div>

        <div class="advanced-hint">
          <i class="pi pi-info-circle"></i>
          <span>Detaylı arama kriterleri liste görünümüne ve <strong>Dışa Aktar</strong> işlemlerine anında yansır.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }
    .search-container {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .filter-chips {
      display: flex;
      gap: 0.4rem;
    }
    .chip {
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
    }
    .chip:hover {
      background: var(--surface-hover);
      color: var(--primary-600);
      border-color: var(--primary-200);
    }
    .chip.active {
      background: var(--primary-50);
      color: var(--primary-700);
      border-color: var(--primary-200);
    }
    .search-box {
      position: relative;
      width: 280px;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
      font-size: 0.875rem;
    }
    .search-input {
      width: 100%;
      padding: 0.55rem 2.25rem 0.55rem 2.25rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      transition: all var(--transition-fast);
      background: var(--surface-card);
      color: var(--text-primary);
    }
    .search-input:focus {
      outline: none;
      border-color: var(--primary-400);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .search-clear {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }
    .search-clear:hover {
      color: var(--text-primary);
    }

    .btn-toggle-advanced {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      position: relative;
    }
    .btn-toggle-advanced:hover {
      background: var(--surface-hover);
      color: var(--primary-600);
      border-color: var(--primary-300);
    }
    .btn-toggle-advanced.active {
      background: var(--primary-50);
      color: var(--primary-700);
      border-color: var(--primary-400);
    }
    .active-badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-600);
      display: inline-block;
    }

    /* Detaylı Arama Kartı */
    .advanced-panel {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .advanced-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .advanced-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .advanced-title i {
      color: var(--primary-600);
    }

    .btn-clear-advanced {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: none;
      color: var(--danger-600);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      transition: background var(--transition-fast);
    }

    .btn-clear-advanced:hover {
      background: var(--danger-50);
    }

    .advanced-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .advanced-field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .advanced-field label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .field-restriction {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--text-muted);
      opacity: 0.85;
    }

    .advanced-field label i {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .field-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      background: var(--surface-card);
      color: var(--text-primary);
      transition: all var(--transition-fast);
    }

    .field-input:focus {
      outline: none;
      border-color: var(--primary-400);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .advanced-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding-top: 0.25rem;
      border-top: 1px solid var(--surface-border-light);
    }

    .advanced-hint i {
      color: var(--primary-500);
    }
  `]
})
export class ContactSearchComponent implements OnInit, OnDestroy {
  @Input() activeFilter: 'all' | 'favorites' = 'all';
  @Input() searchQuery: string = '';

  @Output() filterChange = new EventEmitter<'all' | 'favorites'>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() advancedChange = new EventEmitter<AdvancedSearchParams>();

  isAdvancedOpen = signal<boolean>(false);

  firstName: string = '';
  lastName: string = '';
  phoneNumber: string = '';
  email: string = '';

  private searchSubject = new Subject<string>();
  private advancedSubject = new Subject<AdvancedSearchParams>();

  get hasAdvancedFilters(): boolean {
    return !!(this.firstName?.trim() || this.lastName?.trim() || this.phoneNumber?.trim() || this.email?.trim());
  }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchChange.emit(query);
    });

    this.advancedSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(filters => {
      this.advancedChange.emit(filters);
    });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
    this.advancedSubject.complete();
  }

  toggleAdvanced() {
    this.isAdvancedOpen.update(v => !v);
  }

  onFilterChange(filter: 'all' | 'favorites') {
    this.filterChange.emit(filter);
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  /** Ad ve Soyad alanlarında rakam yazılmasını engeller */
  onlyLetters(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Delete', 'Home', 'End'
    ];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    if (/\d/.test(event.key)) {
      event.preventDefault();
    }
  }

  /** Telefon alanında harf yazılmasını engeller (sadece rakam, +, -, boşluk ve parantez) */
  onlyNumbers(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Delete', 'Home', 'End'
    ];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    if (!/[\d\s+()-]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onNameInput(event: Event, field: 'firstName' | 'lastName') {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\d+/g, '');
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
    this.onFieldChange(field, sanitized);
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^\d\s+()-]/g, '');
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
    this.onFieldChange('phoneNumber', sanitized);
  }

  onFieldChange(field: 'firstName' | 'lastName' | 'phoneNumber' | 'email', value: string) {
    if (field === 'firstName') this.firstName = value;
    if (field === 'lastName') this.lastName = value;
    if (field === 'phoneNumber') this.phoneNumber = value;
    if (field === 'email') this.email = value;

    this.emitCurrentAdvanced();
  }

  clearAdvancedFilters() {
    this.firstName = '';
    this.lastName = '';
    this.phoneNumber = '';
    this.email = '';
    this.emitCurrentAdvanced();
  }

  private emitCurrentAdvanced() {
    this.advancedSubject.next({
      firstName: this.firstName.trim() || undefined,
      lastName: this.lastName.trim() || undefined,
      phoneNumber: this.phoneNumber.trim() || undefined,
      email: this.email.trim() || undefined
    });
  }
}

