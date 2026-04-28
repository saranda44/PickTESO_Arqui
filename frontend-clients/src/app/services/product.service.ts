import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  store_id: number;
  name: string;
  description?: string | null;
  price: number;
  product_image?: string | null;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = 'http://localhost:3001/stores';

  constructor(private http: HttpClient) {}

  getProductsByStore(storeId: number): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.apiUrl}/${storeId}/products`
    );
  }

  getStoreById(id: number) {
    return this.http.get<any>(`http://localhost:3001/stores/${id}`);
  }
}