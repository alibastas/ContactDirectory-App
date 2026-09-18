import { Component, ChangeDetectionStrategy, signal, inject, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { ContactService, ContactRequest } from '../../../services/contact.service';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-contact-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog 
      header="Müşteri İletişim Formu" 
      [visible]="visible()" 
      (visibleChange)="onVisibleChange($event)"
      [modal]="true" 
      [style]="{ width: '840px', maxWidth: '95vw' }" 
      [draggable]="false" 
      [resizable]="false">

      <div class="form-two-column-layout">
        <!-- Left Column: Form Fields -->
        <div class="form-left-col">
          <!-- User Account Badge -->
          <div class="user-account-badge-notice">
            <div class="account-notice-left">
              <i class="pi pi-verified"></i>
              <div class="account-notice-text">
                <span class="account-notice-label">Talebi Gönderen Hesap</span>
                <span class="account-notice-user">@{{ currentUsername() }}</span>
              </div>
            </div>
            <span class="account-notice-sub">Doğrulanmış Hesap</span>
          </div>

          <!-- Communication Type -->
          <div class="form-field">
            <label>İletişim Türü</label>
            <div class="type-buttons">
              <button 
                type="button" 
                *ngFor="let type of communicationTypes" 
                [class.active]="contactForm.communicationType === type"
                (click)="contactForm.communicationType = type"
                class="type-chip">
                {{ type }}
              </button>
            </div>
          </div>

          <!-- Full Name -->
          <div class="form-row">
            <div class="form-field">
              <label>Ad *</label>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="contactForm.firstName" 
                (keypress)="lettersOnly($event)"
                maxlength="30"
                placeholder="Adınız" 
                class="w-full" />
            </div>
            <div class="form-field">
              <label>Soyad</label>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="contactForm.lastName" 
                (keypress)="lettersOnly($event)"
                maxlength="30"
                placeholder="Soyadınız" 
                class="w-full" />
            </div>
          </div>

          <!-- Phone & Email -->
          <div class="form-row">
            <div class="form-field">
              <label>Telefon *</label>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="contactForm.phoneNumber" 
                (keypress)="numbersOnly($event)"
                maxlength="11" 
                placeholder="0555 000 00 00" 
                class="w-full" />
            </div>
            <div class="form-field">
              <label>E-Posta</label>
              <input 
                type="email" 
                pInputText 
                [(ngModel)]="contactForm.email" 
                maxlength="60"
                placeholder="ornek@mail.com" 
                class="w-full" />
            </div>
          </div>

          <!-- Subject -->
          <div class="form-field">
            <label>Konu</label>
            <input 
              type="text" 
              pInputText 
              [(ngModel)]="contactForm.subject" 
              maxlength="70"
              placeholder="Talebinizin konusu" 
              class="w-full" />
          </div>

          <!-- City & Branch -->
          <div class="form-row">
            <div class="form-field">
              <label>İl</label>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="contactForm.city" 
                (keypress)="lettersOnly($event)"
                maxlength="25"
                placeholder="Örn: Ankara" 
                class="w-full" />
            </div>
            <div class="form-field">
              <label>Şube</label>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="contactForm.branch" 
                maxlength="35"
                placeholder="Örn: Kızılay" 
                class="w-full" />
            </div>
          </div>

          <!-- Message -->
          <div class="form-field">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label>Mesajınız *</label>
              <small style="color: #94a3b8; font-size: 0.75rem;">
                {{ contactForm.message?.length || 0 }} / 1000
              </small>
            </div>
            <textarea 
              pTextarea 
              [(ngModel)]="contactForm.message" 
              rows="3" 
              maxlength="1000"
              placeholder="Mesajınızı detaylı şekilde yazınız..." 
              class="w-full">
            </textarea>
          </div>
        </div>

        <!-- Right Column: File Attachment -->
        <div class="form-right-col">
          <div class="attachment-section-header">
            <div class="section-title-wrap">
              <i class="pi pi-paperclip text-indigo-500"></i>
              <span class="attachment-label">Dosya Ekle (Opsiyonel)</span>
            </div>
            <span class="attachment-hint">Maks. 10 MB</span>
          </div>

          <!-- Dropzone Box -->
          <div 
            class="dropzone-box" 
            [class.drag-over]="isDraggingFile()"
            [class.has-file]="!!selectedFile()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onFileDropped($event)"
            (click)="fileInput.click()">

            <input 
              type="file" 
              #fileInput 
              (change)="onFileSelected($event)" 
              accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx" 
              style="display:none" />

            <!-- Empty Dropzone State -->
            <div *ngIf="!selectedFile()" class="dropzone-empty-state">
              <div class="dropzone-icon-circle">
                <i class="pi pi-cloud-upload"></i>
              </div>
              <p class="dropzone-main-text">
                Dosyayı buraya sürükleyip bırakın
              </p>
              <p class="dropzone-sub-text">
                veya cihazınızdan <span>seçmek için tıklayın</span>
              </p>
            </div>

            <!-- Selected File State -->
            <div *ngIf="selectedFile() as file" class="dropzone-selected-card" (click)="$event.stopPropagation()">
              <div class="selected-card-top">
                <div class="selected-file-icon">
                  <i [class]="getFileIconClass(file.name)"></i>
                </div>
                <div class="selected-file-info">
                  <span class="selected-file-name" [title]="file.name">{{ file.name }}</span>
                  <span class="selected-file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <button type="button" class="btn-remove-file" (click)="removeSelectedFile($event)" title="Dosyayı Kaldır">
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <div class="selected-card-status">
                <i class="pi pi-check-circle"></i>
                <span>Dosya yüklenmeye hazır</span>
              </div>
            </div>
          </div>

          <!-- File Guidance Card -->
          <div class="attachment-guidance-card">
            <div class="guidance-title">
              <i class="pi pi-info-circle"></i>
              <span>Desteklenen Dosya Formatları</span>
            </div>
            <div class="format-chips">
              <span class="format-chip badge-img">Resim (PNG, JPG, WEBP)</span>
              <span class="format-chip badge-pdf">PDF</span>
              <span class="format-chip badge-doc">Word (.doc, .docx)</span>
              <span class="format-chip badge-xls">Excel (.xls, .xlsx)</span>
            </div>
            <p class="guidance-note">
              Eklediğiniz dosya yönetici talebinizi incelerken sohbet alanında güvenli şekilde görüntülenecektir.
            </p>
          </div>
        </div>
      </div>

      <!-- Dialog Actions -->
      <div class="dialog-footer-actions">
        <p-button 
          label="Vazgeç" 
          icon="pi pi-times" 
          severity="secondary" 
          [text]="true" 
          (onClick)="closeDialog()">
        </p-button>
        <p-button 
          label="Talebi İlet" 
          icon="pi pi-send" 
          severity="primary" 
          [loading]="isSubmitting()"
          (onClick)="submitContactForm()">
        </p-button>
      </div>
    </p-dialog>
  `,
  styles: [`
    .user-account-badge-notice {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.85rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.04));
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: var(--radius-md, 8px);
      margin-bottom: 0.75rem;
    }
    .account-notice-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .account-notice-left i {
      color: #6366f1;
      font-size: 1.1rem;
    }
    .account-notice-text {
      display: flex;
      flex-direction: column;
    }
    .account-notice-label {
      font-size: 0.6875rem;
      color: var(--text-secondary, #64748b);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .account-notice-user {
      font-size: 0.875rem;
      font-weight: 700;
      color: #4f46e5;
    }
    :host-context(html.dark) .account-notice-user {
      color: #a5b4fc;
    }
    .account-notice-sub {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .form-two-column-layout {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 1.5rem;
      align-items: start;
      padding-top: 0.5rem;
    }
    @media (max-width: 768px) {
      .form-two-column-layout {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }
    }

    .form-left-col,
    .form-right-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-field {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .form-field label {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }
    :host-context(html.dark) .form-field label {
      color: #cbd5e1;
    }

    .type-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .type-chip {
      padding: 6px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      background-color: #f8fafc;
      color: #334155;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .type-chip.active {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
      font-weight: 600;
    }

    .attachment-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 2px;
    }
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .section-title-wrap i {
      font-size: 1rem;
      color: #6366f1;
    }
    .attachment-label {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }
    :host-context(html.dark) .attachment-label {
      color: #cbd5e1;
    }
    .attachment-hint {
      font-size: 0.725rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .dropzone-box {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      background: #f8fafc;
      padding: 1.5rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      min-height: 175px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host-context(html.dark) .dropzone-box {
      border-color: #334155;
      background: rgba(30, 41, 59, 0.4);
    }
    .dropzone-box:hover {
      border-color: #6366f1;
      background: rgba(99, 102, 241, 0.03);
    }
    .dropzone-box.drag-over {
      border-color: #4f46e5;
      background: rgba(99, 102, 241, 0.08);
      transform: scale(1.01);
    }
    .dropzone-box.has-file {
      border-style: solid;
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.03);
      padding: 1rem;
    }
    :host-context(html.dark) .dropzone-box.has-file {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.05);
    }

    .dropzone-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      pointer-events: none;
    }
    .dropzone-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      margin-bottom: 0.25rem;
      transition: transform 0.2s ease;
    }
    .dropzone-box:hover .dropzone-icon-circle {
      transform: translateY(-2px);
      background: rgba(99, 102, 241, 0.15);
    }
    .dropzone-main-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    :host-context(html.dark) .dropzone-main-text {
      color: #e2e8f0;
    }
    .dropzone-sub-text {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0;
    }
    .dropzone-sub-text span {
      color: #4f46e5;
      font-weight: 600;
      text-decoration: underline;
    }

    .dropzone-selected-card {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      text-align: left;
    }
    .selected-card-top {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 10px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    :host-context(html.dark) .selected-card-top {
      background: #1e293b;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    .selected-file-icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }
    :host-context(html.dark) .selected-file-icon {
      background: #0f172a;
    }
    .selected-file-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .selected-file-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host-context(html.dark) .selected-file-name {
      color: #f1f5f9;
    }
    .selected-file-size {
      font-size: 0.725rem;
      color: #64748b;
      margin-top: 1px;
    }
    .btn-remove-file {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .btn-remove-file:hover {
      background: #ef4444;
      color: #ffffff;
    }
    .selected-card-status {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.775rem;
      font-weight: 600;
      color: #10b981;
      padding: 0.35rem 0.6rem;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 6px;
    }

    .attachment-guidance-card {
      padding: 0.85rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    :host-context(html.dark) .attachment-guidance-card {
      background: rgba(30, 41, 59, 0.5);
      border-color: #334155;
    }
    .guidance-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
    :host-context(html.dark) .guidance-title {
      color: #94a3b8;
    }
    .guidance-title i {
      color: #6366f1;
      font-size: 0.85rem;
    }
    .format-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .format-chip {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .badge-img {
      background: rgba(168, 85, 247, 0.12);
      color: #9333ea;
      border: 1px solid rgba(168, 85, 247, 0.2);
    }
    .badge-pdf {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .badge-doc {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .badge-xls {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .guidance-note {
      margin: 0;
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }

    .pi-file-pdf { color: #ef4444; }
    .pi-file-word { color: #3b82f6; }
    .pi-file-excel { color: #10b981; }
    .pi-image { color: #a855f7; }

    textarea.p-inputtextarea,
    textarea {
      resize: none !important;
      overflow-y: auto !important;
    }

    .dialog-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border, #e2e8f0);
    }
  `]
})
export class ContactRequestDialogComponent {
  private contactService = inject(ContactService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  visible = model<boolean>(false);
  submitted = output<void>();

  currentUsername = signal<string>('');
  selectedFile = signal<File | null>(null);
  isDraggingFile = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  communicationTypes = ['Şikayet', 'Talep', 'Bilgi', 'Teşekkür', 'Öneri'];

  contactForm: ContactRequest = {
    communicationType: 'Talep',
    subject: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    message: '',
    city: '',
    branch: ''
  };

  constructor() {
    this.currentUsername.set(this.authService.getUsername());
  }

  onVisibleChange(val: boolean): void {
    this.visible.set(val);
    if (!val) {
      this.removeSelectedFile();
    }
  }

  closeDialog(): void {
    this.visible.set(false);
    this.removeSelectedFile();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile.set(false);
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile.set(false);
  }

  handleFile(file: File): void {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Geçersiz Dosya Türü',
        detail: 'Lütfen Resim (PNG, JPG, WEBP), PDF, Word (.doc, .docx) veya Excel (.xls, .xlsx) dosyası seçiniz.',
        life: 4000
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'Dosya Çok Büyük',
        detail: 'Dosya boyutu en fazla 10 MB olabilir.',
        life: 4000
      });
      return;
    }

    this.selectedFile.set(file);
  }

  removeSelectedFile(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedFile.set(null);
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIconClass(fileName?: string): string {
    if (!fileName) return 'pi pi-file';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return 'pi pi-file-pdf';
      case 'doc':
      case 'docx': return 'pi pi-file-word';
      case 'xls':
      case 'xlsx': return 'pi pi-file-excel';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp': return 'pi pi-image';
      default: return 'pi pi-file';
    }
  }

  lettersOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode >= 48 && charCode <= 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  numbersOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  submitContactForm(): void {
    if (!this.contactForm.firstName || !this.contactForm.phoneNumber || !this.contactForm.message) {
      this.messageService.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Lütfen zorunlu alanları (Ad, Telefon, Mesaj) doldurunuz.',
        life: 3000
      });
      return;
    }

    if (this.contactForm.email) {
      this.contactForm.email = this.contactForm.email.trim().toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace('xn--gmal-75a', 'gmail.com')
        .replace('xn--gmai-nza', 'gmail.com')
        .replace('gmaıl', 'gmail')
        .replace('hotmaıl', 'hotmail');
    }

    this.isSubmitting.set(true);
    const file = this.selectedFile();
    let payload: FormData | ContactRequest;

    if (file) {
      const formData = new FormData();
      formData.append('communicationType', this.contactForm.communicationType);
      if (this.contactForm.subject) formData.append('subject', this.contactForm.subject);
      formData.append('firstName', this.contactForm.firstName);
      if (this.contactForm.lastName) formData.append('lastName', this.contactForm.lastName);
      formData.append('phoneNumber', this.contactForm.phoneNumber);
      if (this.contactForm.email) formData.append('email', this.contactForm.email);
      formData.append('message', this.contactForm.message);
      if (this.contactForm.city) formData.append('city', this.contactForm.city);
      if (this.contactForm.branch) formData.append('branch', this.contactForm.branch);
      formData.append('file', file);
      payload = formData;
    } else {
      payload = this.contactForm;
    }

    this.contactService.createContactRequest(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Başarılı',
          detail: 'İletişim talebiniz başarıyla iletildi.',
          life: 3000
        });
        this.visible.set(false);
        this.selectedFile.set(null);
        this.contactForm = {
          communicationType: 'Talep',
          subject: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          email: '',
          message: '',
          city: '',
          branch: ''
        };
        this.submitted.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errMsg = err?.error?.message || 'Talep iletilirken bir hata oluştu.';
        this.messageService.add({
          severity: 'error',
          summary: 'Hata',
          detail: errMsg,
          life: 3000
        });
      }
    });
  }
}
