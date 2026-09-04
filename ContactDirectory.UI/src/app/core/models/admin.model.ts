export interface UserSummaryDto {
  userId: number;
  username: string;
  role: string;
  contactCount: number;
}

export interface AdminDashboardDto {
  totalUsers: number;
  totalContacts: number;
  totalLogs: number;
  userSummaries: UserSummaryDto[];
}

export interface AuditLogDto {
  id: number;
  userId: number;
  username: string;
  action: string;
  entityName: string;
  entityId?: number;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
