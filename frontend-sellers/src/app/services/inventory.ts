// services/inventory.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IInventory } from '../interfaces';
import { HttpErrorHandler } from './http-error';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private sellersApiUrl = `${environment.sellersApiUrl}/inventory`;

  constructor(private http: HttpClient, private errorHandler: HttpErrorHandler) { }

  createEntry(data: any): Observable<IInventory> {
    return this.http.post<IInventory>(
      `${this.sellersApiUrl}`,
      data
    ).pipe(
      catchError(err => this.errorHandler.handle(err, 'Inventario'))
    );
  }

  deleteEntry(id: number): Observable<boolean> {
    return this.http.delete<boolean>(
      `${this.sellersApiUrl}/${id}`
    );
  }

  getEntriesByProductId(productId: number): Observable<IInventory[]> {
    return this.http.get<IInventory[]>(
      `${this.sellersApiUrl}/product/${productId}`
    );
  }

  getStockByProductId(productId: number): Observable<{ product_id: number; stock: number }> {
    return this.http.get<{ product_id: number; stock: number }>(
      `${this.sellersApiUrl}/product/${productId}/stock`
    );
  }
}