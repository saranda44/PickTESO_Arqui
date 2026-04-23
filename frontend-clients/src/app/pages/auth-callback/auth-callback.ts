import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
})
export class AuthCallback implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const userRaw = params['user'];

      if (!token || !userRaw) {
        this.status = 'error';
        this.errorMessage = 'No se recibieron credenciales válidas.';
        return;
      }

      try {
        const user: AuthUser = JSON.parse(decodeURIComponent(userRaw));
        this.auth.handleAuthSuccess(token, user);
        this.status = 'success';
        setTimeout(() => this.router.navigate(['/']), 1200);
      } catch {
        this.status = 'error';
        this.errorMessage = 'Error al procesar las credenciales.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}