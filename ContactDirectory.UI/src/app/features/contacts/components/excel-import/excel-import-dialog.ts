import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ExcelService, ParseExcelResult, ParsedContact } from '../../../../services/excel.service';
import { ContactService } from '../../../../services/contact.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-excel-import-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './excel-import-dialog.html',
  styleUrls: ['./excel-import-dialog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExcelImportDialogComponent {
  @Input() visible: boolean = false;
  @Input() importType: 'excel' | 'csv' = 'excel';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() importCompleted = new EventEmitter<number>();

  selectedFile = signal<File | null>(null);
  isParsing = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  parseResult = signal<ParseExcelResult | null>(null);
  errorMessage = signal<string>('');
  isDragOver = signal<boolean>(false);
  duplicateStrategy = signal<'skip' | 'update' | 'allow'>('skip');
  fileDuplicateCount = signal<number>(0);

  constructor(
    private excelService: ExcelService,
    private contactService: ContactService,
    private messageService: MessageService
  ) {}

  get dialogTitle(): string {
    return this.importType === 'csv' ? 'CSV ile Toplu Kişi Ekle' : 'Excel ile Toplu Kişi Ekle';
  }

  get introTitle(): string {
    return this.importType === 'csv' ? 'CSV Veri Aktarımı' : 'Excel Veri Aktarımı';
  }

  get introDescription(): string {
    return this.importType === 'csv'
      ? 'CSV dosyanızdaki kişileri tek seferde rehberinize aktarın.'
      : 'Excel dosyanızdaki kişileri tek seferde rehberinize aktarın.';
  }

  get headerIcon(): string {
    return this.importType === 'csv' ? 'pi pi-file' : 'pi pi-file-excel';
  }

  get templateBtnLabel(): string {
    return this.importType === 'csv' ? 'Örnek CSV Şablonu' : 'Örnek Şablonu İndir';
  }

  get dropzoneTitle(): string {
    return this.importType === 'csv'
      ? 'CSV dosyanızı buraya sürükleyin ya da tıklayıp seçin'
      : 'Excel dosyanızı buraya sürükleyin ya da tıklayıp seçin';
  }

  get dropzoneHint(): string {
    return this.importType === 'csv'
      ? 'Desteklenen format: .csv (Maksimum 5MB)'
      : 'Desteklenen formatlar: .xlsx, .xls (Maksimum 5MB)';
  }

  get acceptedExtensions(): string {
    return this.importType === 'csv' ? '.csv' : '.xlsx, .xls';
  }

  get parsingText(): string {
    return this.importType === 'csv'
      ? 'CSV dosyası ayrıştırılıyor ve doğrulanıyor...'
      : 'Excel dosyası ayrıştırılıyor ve doğrulanıyor...';
  }

  onVisibleChange(val: boolean): void {
    if (!val) {
      this.reset();
    }
    this.visible = val;
    this.visibleChange.emit(val);
  }

  downloadTemplate(): void {
    if (this.importType === 'csv') {
      this.excelService.downloadSampleCsvTemplate();
      this.messageService.add({
        severity: 'info',
        summary: 'Şablon İndirildi',
        detail: 'Örnek CSV şablonu bilgisayarınıza kaydedildi.'
      });
    } else {
      this.excelService.downloadSampleTemplate();
      this.messageService.add({
        severity: 'info',
        summary: 'Şablon İndirildi',
        detail: 'Örnek Excel şablonu bilgisayarınıza kaydedildi.'
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  async handleFile(file: File): Promise<void> {
    const isCsvMode = this.importType === 'csv';
    const validExtensions = isCsvMode ? ['.csv'] : ['.xlsx', '.xls'];
    const lowerName = file.name.toLowerCase();
    const isSupported = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isSupported) {
      if (isCsvMode) {
        this.errorMessage.set('Lütfen sadece .csv formatında bir dosya yükleyin.');
      } else {
        this.errorMessage.set('Lütfen sadece .xlsx veya .xls formatında bir Excel dosyası yükleyin.');
      }
      return;
    }

    this.errorMessage.set('');
    this.selectedFile.set(file);
    this.isParsing.set(true);

    try {
      const result = await this.excelService.parseExcelFile(file);
      this.parseResult.set(result);
      
      // Dosya içi mükerrer kontrolü
      const phoneSet = new Set<string>();
      let dupCount = 0;
      for (const c of result.validContacts) {
        const norm = (c.phoneNumber || '').replace(/\D/g, '');
        if (norm) {
          if (phoneSet.has(norm)) {
            dupCount++;
          } else {
            phoneSet.add(norm);
          }
        }
      }
      this.fileDuplicateCount.set(dupCount);
      this.isParsing.set(false);
    } catch (err) {
      this.isParsing.set(false);
      this.errorMessage.set((err as Error).message || 'Dosya okunurken bir hata oluştu.');
      this.parseResult.set(null);
    }
  }

  removeFile(): void {
    this.reset();
  }

  reset(): void {
    this.selectedFile.set(null);
    this.parseResult.set(null);
    this.errorMessage.set('');
    this.isParsing.set(false);
    this.isUploading.set(false);
    this.isDragOver.set(false);
    this.duplicateStrategy.set('skip');
    this.fileDuplicateCount.set(0);
  }

  setStrategy(strategy: 'skip' | 'update' | 'allow'): void {
    this.duplicateStrategy.set(strategy);
  }

  confirmImport(): void {
    const result = this.parseResult();
    if (!result || result.validContacts.length === 0) return;

    this.isUploading.set(true);
    const contactsToSave = result.validContacts.map(c => ({
      firstName: c.firstName,
      lastName: c.lastName,
      phoneNumber: c.phoneNumber,
      email: c.email || undefined,
      isFavorite: false
    }));

    this.contactService.bulkAddContacts(contactsToSave, this.duplicateStrategy()).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Aktarım Başarılı',
          detail: res.message || `${res.addedCount} kişi başarıyla rehbere aktarıldı!`
        });
        this.importCompleted.emit(res.addedCount + res.updatedCount);
        this.onVisibleChange(false);
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Toplu aktarım hatası:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Hata',
          detail: 'Kişiler rehbere eklenirken bir sorun oluştu.'
        });
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
