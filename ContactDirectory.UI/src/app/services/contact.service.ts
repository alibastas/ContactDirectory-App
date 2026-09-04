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
@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly apiUrl = `${environment.apiUrl}/Contacts`;

  constructor(private http: HttpClient) {}

  /** Kullanıcının filtreli ve sayfalı kişilerini getir */
  getContacts(searchTerm: string = '', isFavoriteOnly: boolean = false, page: number = 1, pageSize: number = 10): Observable<PagedResult<Contact>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('isFavoriteOnly', isFavoriteOnly.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
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

  /** Global kişi istatistiklerini getir */
  getContactStats(): Observable<{ totalContacts: number, favoriteContacts: number }> {
    return this.http.get<{ totalContacts: number, favoriteContacts: number }>(`${this.apiUrl}/stats`);
  }

  /** Filtreye uyan tüm kişileri dışa aktarım için getir (Sayfalamasız) */
  getExportContacts(searchTerm: string = '', isFavoriteOnly: boolean = false): Observable<Contact[]> {
    let params = new HttpParams().set('isFavoriteOnly', isFavoriteOnly.toString());
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    return this.http.get<Contact[]>(`${this.apiUrl}/export-data`, { params });
  }

  /** Excel veya toplu veri ile birden fazla kişiyi tek istekte ekle */
  bulkAddContacts(contacts: Partial<Contact>[]): Observable<{ count: number, message: string }> {
    return this.http.post<{ count: number, message: string }>(`${this.apiUrl}/bulk`, contacts);
  }
}