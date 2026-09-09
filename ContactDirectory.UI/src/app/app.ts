import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionTimeoutDialogComponent } from './components/session-timeout-dialog/session-timeout-dialog';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SessionTimeoutDialogComponent],
  template: `
    <router-outlet></router-outlet>
    <app-session-timeout-dialog></app-session-timeout-dialog>
  `
})
export class AppComponent {
  title = 'ContactDirectory.UI';
  private themeService = inject(ThemeService);
}