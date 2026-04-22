import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    const token = this.route.snapshot.queryParamMap.get('token');
    const id = this.route.snapshot.queryParamMap.get('id');
    const storeId = this.route.snapshot.queryParamMap.get('storeId');
    const role = this.route.snapshot.queryParamMap.get('role');

    // console.log('Login params:', { token, id, storeId, role });

    if (token) {
      this.authService.setToken(token, id, storeId, role);
    }
  }

  loginWithGoogle() {
    window.location.href = `${environment.apiGatewayApiUrl}/auth/google`;
    // this.router.navigate(['/home']);
  }
}