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

export interface ContactRequest {
  id?: number;
  communicationType: string;
  subject: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  message: string;
  city: string;
  branch: string;
  userId?: number;
  username?: string;
  createdAt?: string;
  status?: string;
  isViewedByAdmin?: boolean;
  isViewedByUser?: boolean;
  messages?: ContactRequestMessage[];
}
export interface ContactRequestMessage {
  id?: number;
  contactRequestId: number;
  senderUserId: number;
  senderName: string;
  senderRole: 'Admin' | 'User';
  message: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly apiUrl = `${environment.apiUrl}/Contacts`;

  constructor(private http: HttpClient) { }

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

  // --- Contact Requests & Support Chat APIs ---
  createContactRequest(request: ContactRequest): Observable<ContactRequest> {
    return this.http.post<ContactRequest>('http://localhost:5099/api/ContactRequests', request);
  }

  /** Admin: fetch all contact requests, optionally filtered by status */
  getContactRequests(status?: string): Observable<ContactRequest[]> {
    const url = status
      ? `http://localhost:5099/api/ContactRequests?status=${status}`
      : 'http://localhost:5099/api/ContactRequests';
    return this.http.get<ContactRequest[]>(url);
  }

  /** User: fetch requests belonging to current user */
  getMyContactRequests(status?: string): Observable<ContactRequest[]> {
    const url = status
      ? `http://localhost:5099/api/ContactRequests/my?status=${status}`
      : 'http://localhost:5099/api/ContactRequests/my';
    return this.http.get<ContactRequest[]>(url);
  }

  /** Fetch request details and associated chat message history */
  getContactRequestById(id: number): Observable<ContactRequest> {
    return this.http.get<ContactRequest>(`http://localhost:5099/api/ContactRequests/${id}`);
  }

  /** Send a new message to a request thread */
  sendRequestMessage(id: number, message: string): Observable<ContactRequestMessage> {
    return this.http.post<ContactRequestMessage>(`http://localhost:5099/api/ContactRequests/${id}/messages`, { message });
  }

  /** Admin: update request status ('Pending' | 'Completed') */
  updateRequestStatus(id: number, status: string): Observable<void> {
    return this.http.put<void>(`http://localhost:5099/api/ContactRequests/${id}/status`, { status });
  }

  /** Fetch unviewed requests for notification popup dialog */
  getUnviewedRequests(): Observable<ContactRequest[]> {
    return this.http.get<ContactRequest[]>('http://localhost:5099/api/ContactRequests/unviewed');
  }

  /** Mark request as viewed by current user role */
  markRequestAsViewed(id: number): Observable<void> {
    return this.http.put<void>(`http://localhost:5099/api/ContactRequests/${id}/mark-viewed`, {});
  }

  /** Soft-delete contact request for the current user's side */
  deleteContactRequest(id: number): Observable<any> {
    return this.http.delete(`http://localhost:5099/api/ContactRequests/${id}`);
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
