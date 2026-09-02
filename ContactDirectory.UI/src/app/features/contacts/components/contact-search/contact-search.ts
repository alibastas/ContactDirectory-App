import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-contact-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-container">
      <div class="filter-chips">
        <button class="chip" [class.active]="activeFilter === 'all'" (click)="onFilterChange('all')">Tümü</button>
        <button class="chip" [class.active]="activeFilter === 'favorites'" (click)="onFilterChange('favorites')">
          <i class="pi pi-star-fill" style="font-size: 0.7rem; margin-right: 4px;"></i>Favoriler
        </button>
      </div>

      <div class="search-box">
        <i class="pi pi-search search-icon"></i>
        <input type="text" [ngModel]="searchQuery" (ngModelChange)="onSearchChange($event)"
          placeholder="İsim, telefon veya e-posta ara..." class="search-input" />
        <button class="search-clear" *ngIf="searchQuery" (click)="onSearchChange('')">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .filter-chips {
      display: flex;
      gap: 0.5rem;
    }
    .chip {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-secondary);
      font-size: 0.875rem;
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
      width: 300px;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 0.6rem 2.5rem 0.6rem 2.5rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      font-size: 0.875rem;
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
      right: 1rem;
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
    }
    .search-clear:hover {
      color: var(--text-primary);
    }
  `]
})
export class ContactSearchComponent implements OnInit, OnDestroy {
  @Input() activeFilter: 'all' | 'favorites' = 'all';
  @Input() searchQuery: string = '';

  @Output() filterChange = new EventEmitter<'all' | 'favorites'>();
  @Output() searchChange = new EventEmitter<string>();

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchChange.emit(query);
    });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  onFilterChange(filter: 'all' | 'favorites') {
    this.filterChange.emit(filter);
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }
}
