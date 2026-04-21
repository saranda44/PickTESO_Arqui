import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { IProductWithTags } from '../interfaces';
import { AuthService } from './auth';
import { map } from 'rxjs/internal/operators/map';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient, private authService: AuthService) { }

  private sellersApiUrl = `${environment.sellersApiUrl}`;

  // products.service.ts
  getProducts(): Observable<IProductWithTags[]> {
    return this.http.get<any[]>(`${this.sellersApiUrl}/products/store/1`).pipe(
      map(products =>
        products.map(p => ({
          ...p,
          tags: p.tags.map((t: any) => ({
            ...t,
            color: t.color || '#999999'
          }))
        }))
      )
    );
  }

  getProductById(id: number) {
    return this.http.get<IProductWithTags>(
      `${this.sellersApiUrl}/products/${id}`
    );
  }

  updateProduct(id: number, data: any) {
    // If `data` is a FormData (contains an image), send it as-is so the browser
    // sets the correct multipart boundary. If it's a plain object, send JSON.
    return this.http.put(
      `${this.sellersApiUrl}/products/${id}`,
      data
    );
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.sellersApiUrl}/products/${id}`);
  }

  adjustInventory(product_id: number, movement_type: 'in' | 'out', quantity: number) {
    return this.http.post(`${this.sellersApiUrl}/inventory`, {
      product_id,
      movement_type,
      quantity
    });
  }
}