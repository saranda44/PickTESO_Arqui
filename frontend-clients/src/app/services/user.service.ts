import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService, AuthUser } from './auth.service';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getUserInfo(): Promise<AuthUser> {
    return firstValueFrom(
      this.http.get<AuthUser>(
        `${this.apiUrl}/catalog/user`,
        { headers: this.headers }
      )
    );
  }
}
