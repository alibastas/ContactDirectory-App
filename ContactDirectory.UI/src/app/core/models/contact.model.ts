/**
 * Contact model — uygulamanın temel kişi veri yapısı.
frontend kişi modeli - 26.08.2026 check okay 
*/
export interface Contact {
  id?: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  isFavorite?: boolean;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}
