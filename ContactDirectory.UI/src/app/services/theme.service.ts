import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app_theme';
  readonly currentTheme = signal<AppTheme>('system');
  readonly isDark = signal<boolean>(false);

  private mediaQueryListener?: (e: MediaQueryListEvent) => void;

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = (localStorage.getItem(this.THEME_KEY) as AppTheme) || 'system';
    this.setTheme(savedTheme, false);

    // Listen for OS color scheme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryListener = (e: MediaQueryListEvent) => {
        if (this.currentTheme() === 'system') {
          this.applyTheme(e.matches);
        }
      };
      mediaQuery.addEventListener('change', this.mediaQueryListener);
    }
  }

  setTheme(theme: AppTheme, save = true): void {
    this.currentTheme.set(theme);
    if (save) {
      localStorage.setItem(this.THEME_KEY, theme);
    }

    if (theme === 'system') {
      const isSystemDark = typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(isSystemDark);
    } else {
      this.applyTheme(theme === 'dark');
    }
  }

  forceLightMode(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }

  restoreTheme(): void {
    this.setTheme(this.currentTheme(), false);
  }

  private applyTheme(isDark: boolean): void {
    this.isDark.set(isDark);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }
}
