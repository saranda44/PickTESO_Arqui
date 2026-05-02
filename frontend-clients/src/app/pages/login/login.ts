import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    const token = this.route.snapshot.queryParamMap.get('token');
    const id = this.route.snapshot.queryParamMap.get('id');
    const role = this.route.snapshot.queryParamMap.get('role');

    if (token && id) {
      const user: AuthUser = {
        id,
        role: role ?? 'customer',
        email: '',
        first_name: '',
        paternal_last_name: '',
        maternal_last_name: '',
        storeId: null,
      };
      this.auth.handleAuthSuccess(token, user);
    }
  }

  loginWithGoogle(): void {
    this.auth.loginWithGoogle();
  }
}