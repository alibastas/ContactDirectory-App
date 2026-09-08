import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

export interface UserProfileData {
  username: string;
  email: string;
  country: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, InputTextModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent {
  @Input() visible: boolean = false;
  @Input() profileData: UserProfileData = { username: '', email: '', country: '' };
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saveProfile = new EventEmitter<UserProfileData>();

  onVisibleChange(val: boolean) {
    this.visibleChange.emit(val);
  }

  getInitials(username?: string): string {
    if (!username) return 'U';
    const clean = username.trim();
    if (clean.length <= 2) return clean.toUpperCase();
    return clean.substring(0, 2).toUpperCase();
  }

  close() {
    this.visibleChange.emit(false);
  }

  onSave() {
    this.saveProfile.emit(this.profileData);
    this.close();
  }
}
