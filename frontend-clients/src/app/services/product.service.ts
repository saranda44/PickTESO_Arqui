import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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
  private readonly apiUrl = environment.apiUrl;
  constructor(private http: HttpClient, private authService: AuthService) { }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getProductsByStore(storeId: number): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.apiUrl}/catalog/stores/${storeId}/products`,
      { headers: this.headers }
    );
  }

  getStoreById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/catalog/stores/${id}`, { headers: this.headers });
  }
}