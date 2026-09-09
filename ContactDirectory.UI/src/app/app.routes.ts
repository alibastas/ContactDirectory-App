import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { ContactComponent } from './components/contact/contact';
import { ContactFormComponent } from './components/contact/contact-form';
import { AdminDashboardComponent } from './features/admin/admin-dashboard';
import { SettingsComponent } from './features/settings/settings';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'contacts', component: ContactComponent, canActivate: [authGuard] },
  { path: 'contacts/new', component: ContactFormComponent, canActivate: [authGuard] },
  { path: 'contacts/edit/:id', component: ContactFormComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];