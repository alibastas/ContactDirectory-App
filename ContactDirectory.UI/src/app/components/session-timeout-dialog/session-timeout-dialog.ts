import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './session-timeout-dialog.html',
  styleUrls: ['./session-timeout-dialog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionTimeoutDialogComponent {
  sessionService = inject(SessionService);

  onExtend(): void {
    this.sessionService.extendSession();
  }

  onLogout(): void {
    this.sessionService.logoutNow();
  }
}
