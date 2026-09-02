import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

export interface UserProfileData {
  username: string;
  email: string;
  country: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog header="Kullanıcı Profili" [visible]="visible" (visibleChange)="onVisibleChange($event)" 
      [modal]="true" [style]="{width: '400px'}"
      [draggable]="false" [resizable]="false" styleClass="custom-dialog">
      <div class="profile-content">
        
        <div class="profile-header">
          <div class="profile-avatar-large">
            <i class="pi pi-user"></i>
          </div>
          <h3>{{ profileData.username }}</h3>
        </div>

        <div class="profile-form">
          <div class="form-field">
            <label>Kullanıcı Adı</label>
            <input type="text" pInputText [value]="profileData.username" disabled class="custom-input disabled-input" />
          </div>

          <div class="form-field">
            <label>E-posta</label>
            <input type="email" pInputText [(ngModel)]="profileData.email" placeholder="E-posta adresiniz (İsteğe bağlı)" class="custom-input" />
          </div>

          <div class="form-field">
            <label>Ülke</label>
            <input type="text" pInputText [(ngModel)]="profileData.country" placeholder="Yaşadığınız ülke (İsteğe bağlı)" class="custom-input" />
          </div>

          <button class="btn-primary" (click)="onSave()" style="margin-top: 1rem;">
            <i class="pi pi-save" style="margin-right: 8px;"></i> Kaydet
          </button>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    ::ng-deep .custom-dialog .p-dialog-header {
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      padding: 1.5rem;
    }
    ::ng-deep .custom-dialog .p-dialog-title {
      font-weight: 700;
      color: var(--text-primary);
      font-size: 1.25rem;
    }
    ::ng-deep .custom-dialog .p-dialog-content {
      padding: 2rem;
      background: var(--surface-ground);
    }
    
    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .profile-avatar-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      box-shadow: var(--shadow-md);
      border: 4px solid var(--surface-card);
    }
    .profile-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .form-field label {
      font-weight: 500;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    .custom-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-border);
      transition: all var(--transition-fast);
      background: var(--surface-card);
    }
    .custom-input:enabled:focus {
      border-color: var(--primary-400);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      outline: none;
    }
    .disabled-input {
      background: var(--surface-section) !important;
      color: var(--text-muted) !important;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary-600);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      width: 100%;
    }
    .btn-primary:hover {
      background: var(--primary-700);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  `]
})
export class UserProfileComponent {
  @Input() visible: boolean = false;
  @Input() profileData: UserProfileData = { username: '', email: '', country: '' };
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saveProfile = new EventEmitter<UserProfileData>();

  onVisibleChange(val: boolean) {
    this.visibleChange.emit(val);
  }

  onSave() {
    this.saveProfile.emit(this.profileData);
  }
}
