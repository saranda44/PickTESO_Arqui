import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface ITag {
  id: number;
  store_id: number;
  name: string;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  color: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable({
  providedIn: 'root',
})
export class TagsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private sellersApiUrl = `${environment.sellersApiUrl}`;

  createTag(data: Omit<ITag, 'id' | 'created_at' | 'updated_at'>): Observable<ITag> {
    return this.http.post<ITag>(`${this.sellersApiUrl}/tags`, data);
  }

  getTagsByStoreId(storeId: number): Observable<ITag[]> {
    return this.http.get<ITag[]>(`${this.sellersApiUrl}/tags/store/${storeId}`);
  }

  getTagById(id: number): Observable<ITag> {
    return this.http.get<ITag>(`${this.sellersApiUrl}/tags/${id}`);
  }

  updateTag(id: number, data: Partial<Omit<ITag, 'id' | 'created_at' | 'updated_at'>>): Observable<ITag> {
    return this.http.put<ITag>(`${this.sellersApiUrl}/tags/${id}`, data);
  }

  deleteTag(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.sellersApiUrl}/tags/${id}`);
  }

  getTagsByProductId(productId: number): Observable<ITag[]> {
    return this.http.get<ITag[]>(`${this.sellersApiUrl}/products/${productId}/tags`);
  }

  updateProductTags(productId: number, tagIds: number[]): Observable<any> {
    return this.http.put(`${this.sellersApiUrl}/products/${productId}/tags`, { tag_ids: tagIds });
  }
}
