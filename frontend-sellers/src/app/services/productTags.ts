import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class ProductTagsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private sellersApiUrl = `${environment.sellersApiUrl}`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  replaceTagsForProduct(productId: number, tagIds: number[]): Observable<any> {
    return this.http.put(
      `${this.sellersApiUrl}/products/${productId}/tags`,
      { tag_ids: tagIds },
      { headers: this.getHeaders() }
    );
  }

  getTagsByProductId(productId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.sellersApiUrl}/products/${productId}/tags`,
      { headers: this.getHeaders() }
    );
  }
}