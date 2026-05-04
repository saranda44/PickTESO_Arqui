import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface StoreDetails {
  id: number;
  name: string;
  location: string;
  opening_time: string;
  closing_time: string;
  image?: string | null;
  active: boolean;
  admin_id: number;
  created_at: string;
  updated_at: string;
}

export interface StoreUpdatePayload {
  name?: string;
  location?: string;
  opening_time?: string;
  closing_time?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StoreService {

  authService = inject(AuthService);
  http = inject(HttpClient);

  storeId = this.authService.getStoreId();

  private validateName(name: string): string | null {
    if (!name || name.trim().length === 0) return "Nombre no puede estar vacío";
    if (name.length > 100) return "Nombre no puede exceder 100 caracteres";
    return null;
  }

  private validateTime(time: string): string | null {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!regex.test(time)) return "Formato debe ser HH:mm (ej: 09:00)";
    return null;
  }

  validateUpdateData(data: StoreUpdatePayload): string | null {
    if (data.name) {
      const error = this.validateName(data.name);
      if (error) return error;
    }
    if (data.opening_time) {
      const error = this.validateTime(data.opening_time);
      if (error) return `Hora apertura: ${error}`;
    }
    if (data.closing_time) {
      const error = this.validateTime(data.closing_time);
      if (error) return `Hora cierre: ${error}`;
    }
    if (data.opening_time && data.closing_time && data.opening_time >= data.closing_time) {
      return "Hora apertura debe ser menor que hora cierre";
    }
    return null;
  }

  getStoreDetails(): Observable<StoreDetails> {
    return this.http.get<StoreDetails>(`${environment.sellersApiUrl}/stores/${this.storeId}`);
  }

  updateStore(data: StoreUpdatePayload, image?: File | null): Observable<StoreDetails> {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.location) formData.append('location', data.location);
    if (data.opening_time) formData.append('opening_time', data.opening_time);
    if (data.closing_time) formData.append('closing_time', data.closing_time);
    if (image) {
      formData.append('image', image);
    }

    return this.http.put<StoreDetails>(
      `${environment.sellersApiUrl}/stores/${this.storeId}`,
      formData
    );
  }
}
