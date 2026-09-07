import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Contact } from '../core/models/contact.model';

export interface ParsedContact {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  isFavorite?: boolean;
}

export interface ParseExcelResult {
  validContacts: ParsedContact[];
  invalidContacts: { rowNumber: number; data: any; reason: string }[];
  totalRows: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  /**
   * Kişi listesini Excel (.xlsx) dosyası olarak oluşturup indirir
   */
  exportContactsToExcel(contacts: Contact[], filterInfo: string = ''): void {
    if (!contacts || contacts.length === 0) return;

    // Excel satırlarını hazırla
    const rows = contacts.map(c => ({
      'Ad': c.firstName || '',
      'Soyad': c.lastName || '',
      'Telefon Numarası': c.phoneNumber || '',
      'E-posta Adresi': c.email || '',
      'Favori': c.isFavorite ? 'Evet' : 'Hayır'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);

    // Sütun genişliklerini ayarla
    worksheet['!cols'] = [
      { wch: 18 }, // Ad
      { wch: 18 }, // Soyad
      { wch: 22 }, // Telefon
      { wch: 28 }, // E-posta
      { wch: 10 }  // Favori
    ];

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kişi Rehberi');

    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix = filterInfo ? `_${filterInfo}` : '';
    const fileName = `Rehber_Kisiler${suffix}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Kişi listesini CSV (.csv) dosyası olarak oluşturup indirir
   */
  exportContactsToCsv(contacts: Contact[], filterInfo: string = ''): void {
    if (!contacts || contacts.length === 0) return;

    const rows = contacts.map(c => ({
      'Ad': c.firstName || '',
      'Soyad': c.lastName || '',
      'Telefon Numarası': c.phoneNumber || '',
      'E-posta Adresi': c.email || '',
      'Favori': c.isFavorite ? 'Evet' : 'Hayır'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix = filterInfo ? `_${filterInfo}` : '';
    const fileName = `Rehber_Kisiler${suffix}_${dateStr}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Kullanıcının doldurması için örnek Excel şablonu üretip indirir
   */
  downloadSampleTemplate(): void {
    const sampleRows = [
      {
        'Ad': 'Örnek Ad 1',
        'Soyad': 'Örnek Soyad 1',
        'Telefon Numarası': '05000000001',
        'E-posta Adresi': 'ornek1@sirket.com'
      },
      {
        'Ad': 'Örnek Ad 2',
        'Soyad': 'Örnek Soyad 2',
        'Telefon Numarası': '05000000002',
        'E-posta Adresi': 'ornek2@sirket.com'
      },
      {
        'Ad': 'Örnek Ad 3',
        'Soyad': 'Örnek Soyad 3',
        'Telefon Numarası': '05000000003',
        'E-posta Adresi': 'ornek3@sirket.com'
      }
    ];

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 30 }
    ];

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Şablon');

    XLSX.writeFile(workbook, 'Rehber_Toplu_Aktarim_Sablonu.xlsx');
  }

  /**
   * Kullanıcının doldurması için örnek CSV şablonu üretip indirir
   */
  downloadSampleCsvTemplate(): void {
    const sampleRows = [
      {
        'Ad': 'Örnek Ad 1',
        'Soyad': 'Örnek Soyad 1',
        'Telefon Numarası': '05000000001',
        'E-posta Adresi': 'ornek1@sirket.com'
      },
      {
        'Ad': 'Örnek Ad 2',
        'Soyad': 'Örnek Soyad 2',
        'Telefon Numarası': '05000000002',
        'E-posta Adresi': 'ornek2@sirket.com'
      },
      {
        'Ad': 'Örnek Ad 3',
        'Soyad': 'Örnek Soyad 3',
        'Telefon Numarası': '05000000003',
        'E-posta Adresi': 'ornek3@sirket.com'
      }
    ];

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sampleRows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const fileName = 'Rehber_Toplu_Aktarim_Sablonu.csv';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Yüklenen Excel veya CSV dosyasını okuyup geçerli/geçersiz kişileri ayrıştırır
   */
  parseExcelFile(file: File): Promise<ParseExcelResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'array' });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            reject(new Error('Excel dosyasında çalışma sayfası bulunamadı.'));
            return;
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

          const validContacts: ParsedContact[] = [];
          const invalidContacts: { rowNumber: number; data: any; reason: string }[] = [];

          rawRows.forEach((row, index) => {
            const rowNumber = index + 2; // Başlık 1. satır olduğu için veriler 2'den başlar

            // Farklı kolon isimlerini tolere et
            const firstName = this.findFieldValue(row, ['ad', 'adı', 'first name', 'firstname', 'isim']);
            const lastName = this.findFieldValue(row, ['soyad', 'soyadı', 'last name', 'lastname', 'soyisim']);
            const phoneNumber = this.findFieldValue(row, ['telefon', 'telefon numarası', 'phone', 'phonenumber', 'tel', 'gsm']);
            const email = this.findFieldValue(row, ['e-posta', 'eposta', 'e-posta adresi', 'email', 'e-mail', 'mail']);

            // Validasyon: Ad ve Telefon zorunludur
            if (!firstName || !firstName.trim()) {
              invalidContacts.push({
                rowNumber,
                data: row,
                reason: 'Ad alanı boş bırakılamaz.'
              });
              return;
            }

            if (!phoneNumber || !phoneNumber.toString().trim()) {
              invalidContacts.push({
                rowNumber,
                data: row,
                reason: 'Telefon alanı boş bırakılamaz.'
              });
              return;
            }

            validContacts.push({
              firstName: firstName.trim(),
              lastName: (lastName || '').trim(),
              phoneNumber: phoneNumber.toString().trim(),
              email: email ? email.trim() : undefined,
              isFavorite: false
            });
          });

          resolve({
            validContacts,
            invalidContacts,
            totalRows: rawRows.length
          });
        } catch (err) {
          reject(new Error('Excel dosyası ayrıştırılırken bir hata oluştu: ' + (err as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Dosya okunamadı.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private findFieldValue(row: Record<string, any>, possibleKeys: string[]): string {
    const keys = Object.keys(row);
    for (const key of keys) {
      const normalizedKey = key.trim().toLowerCase();
      if (possibleKeys.includes(normalizedKey)) {
        return row[key]?.toString() || '';
      }
    }
    return '';
  }
}
