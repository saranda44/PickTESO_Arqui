import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Store {
  id: number;
  name: string;
  location: string;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  private readonly apiUrl = environment.apiUrl;
  constructor(private http: HttpClient, private authService: AuthService) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  } 

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/catalog/stores`, { headers: this.headers });
  }
}