import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PRESET_AVATARS, AvatarPreset, isPresetAvatar, getPresetSvg } from '../../../core/constants/avatars';

@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, ScrollPanelModule],
  templateUrl: './avatar-picker.html',
  styleUrls: ['./avatar-picker.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarPickerComponent {
  @Input() avatarUrl?: string;
  @Input() initials: string = 'K';
  @Input() size: number = 88;
  @Input() editable: boolean = true;
  @Input() fallbackGradient: string = 'linear-gradient(135deg, #6366f1, #4f46e5)';

  @Output() avatarChange = new EventEmitter<string | undefined>();
  @Output() avatarUrlChange = new EventEmitter<string | undefined>();

  showModal = signal<boolean>(false);
  maleAvatars = PRESET_AVATARS.filter(a => a.gender === 'male');
  femaleAvatars = PRESET_AVATARS.filter(a => a.gender === 'female');

  constructor(private sanitizer: DomSanitizer) {}

  isPreset(url?: string): boolean {
    return isPresetAvatar(url);
  }

  getSafeSvg(svgString: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }

  getCurrentSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(getPresetSvg(this.avatarUrl));
  }

  openModal(): void {
    if (this.editable) {
      this.showModal.set(true);
    }
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  selectPreset(preset: AvatarPreset): void {
    this.avatarUrl = preset.id;
    this.avatarChange.emit(preset.id);
    this.avatarUrlChange.emit(preset.id);
    this.closeModal();
  }

  removeAvatar(): void {
    this.avatarUrl = undefined;
    this.avatarChange.emit(undefined);
    this.avatarUrlChange.emit(undefined);
    this.closeModal();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const compressedBase64 = this.cropAndCompressImage(img, 160, 0.85);
        this.avatarUrl = compressedBase64;
        this.avatarChange.emit(compressedBase64);
        this.avatarUrlChange.emit(compressedBase64);
        this.closeModal();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if needed
    input.value = '';
  }

  private cropAndCompressImage(img: HTMLImageElement, targetSize: number, quality: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;

    const minSide = Math.min(img.width, img.height);
    const startX = (img.width - minSide) / 2;
    const startY = (img.height - minSide) / 2;

    ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetSize, targetSize);
    return canvas.toDataURL('image/jpeg', quality);
  }
}
