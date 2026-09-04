import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AdminDashboardDto, AuditLogDto, PagedResult } from '../core/models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) {}

  /** Admin dashboard genel istatistikleri ve kullanıcı özetlerini getirir */
  getStats(): Observable<AdminDashboardDto> {
    return this.http.get<AdminDashboardDto>(`${this.apiUrl}/stats`);
  }

  /** Sistem işlem loglarını (Audit Logs) getirir */
  getLogs(page: number = 1, pageSize: number = 100, actionFilter?: string): Observable<PagedResult<AuditLogDto>> {
    let url = `${this.apiUrl}/logs?page=${page}&pageSize=${pageSize}`;
    if (actionFilter && actionFilter !== 'ALL') {
      url += `&actionFilter=${encodeURIComponent(actionFilter)}`;
    }
    return this.http.get<PagedResult<AuditLogDto>>(url);
  }

  /** Kullanıcı rolünü günceller (Admin <-> User) */
  updateUserRole(userId: number, role: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/${userId}/role`, { role });
  }
}

