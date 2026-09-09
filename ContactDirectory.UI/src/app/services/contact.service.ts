import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Contact, PagedResult } from '../core/models/contact.model';

/**
 * ContactService — Kişi CRUD işlemlerini yönetir.
 *
 * Tüm API çağrıları burada merkezileştirilmiştir.
 * Auth interceptor token'ı otomatik olarak ekler.
 */
export interface AdvancedSearchParams {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

export interface BulkImportResult {
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  totalProcessed: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly apiUrl = `${environment.apiUrl}/Contacts`;

  constructor(private http: HttpClient) {}

  /** Kullanıcının filtreli ve sayfalı kişilerini getir */
  getContacts(
    searchTerm: string = '', 
    isFavoriteOnly: boolean = false, 
    page: number = 1, 
    pageSize: number = 10,
    advanced?: AdvancedSearchParams
  ): Observable<PagedResult<Contact>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('isFavoriteOnly', isFavoriteOnly.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (advanced?.firstName) {
      params = params.set('firstName', advanced.firstName);
    }
    if (advanced?.lastName) {
      params = params.set('lastName', advanced.lastName);
    }
    if (advanced?.phoneNumber) {
      params = params.set('phoneNumber', advanced.phoneNumber);
    }
    if (advanced?.email) {
      params = params.set('email', advanced.email);
    }

    return this.http.get<PagedResult<Contact>>(this.apiUrl, { params });
  }

  /** Tek bir kişiyi ID ile getir */
  getContactById(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  /** Yeni kişi ekle */
  addContact(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact);
  }

  /** Mevcut kişiyi güncelle */
  updateContact(id: number, contact: Contact): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, contact);
  }

  /** Kişiyi sil */
  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Kullanıcının tüm rehberini sil (Şifre doğrulaması ile) */
  deleteAllContacts(password: string): Observable<{ deletedCount: number; message: string }> {
    return this.http.post<{ deletedCount: number; message: string }>(`${this.apiUrl}/delete-all`, { password });
  }

  /** Global kişi istatistiklerini getir */
  getContactStats(): Observable<{ totalContacts: number, favoriteContacts: number }> {
    return this.http.get<{ totalContacts: number, favoriteContacts: number }>(`${this.apiUrl}/stats`);
  }

  /** Filtreye uyan tüm kişileri dışa aktarım için getir (Sayfalamasız) */
  getExportContacts(
    searchTerm: string = '', 
    isFavoriteOnly: boolean = false,
    advanced?: AdvancedSearchParams
  ): Observable<Contact[]> {
    let params = new HttpParams().set('isFavoriteOnly', isFavoriteOnly.toString());
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (advanced?.firstName) {
      params = params.set('firstName', advanced.firstName);
    }
    if (advanced?.lastName) {
      params = params.set('lastName', advanced.lastName);
    }
    if (advanced?.phoneNumber) {
      params = params.set('phoneNumber', advanced.phoneNumber);
    }
    if (advanced?.email) {
      params = params.set('email', advanced.email);
    }
    return this.http.get<Contact[]>(`${this.apiUrl}/export-data`, { params });
  }

  /** Excel veya CSV toplu veri ile kişileri aktar (Yinelenen kayıt stratejisi ile) */
  bulkAddContacts(
    contacts: Partial<Contact>[], 
    duplicateStrategy: 'skip' | 'update' | 'allow' = 'skip'
  ): Observable<BulkImportResult> {
    const payload = {
      contacts,
      duplicateStrategy
    };
    return this.http.post<BulkImportResult>(`${this.apiUrl}/bulk`, payload);
  }
}