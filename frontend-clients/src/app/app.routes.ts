import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback').then((m) => m.AuthCallback),
  },
        {
        path: 'payment/result',
        loadComponent: () =>
          import('./pages/payment/payment').then((m) => m.Payment),
      },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./pages/cart/cart').then((m) => m.Cart),
      },
      {
        path: 'store/:id',
        loadComponent: () =>
          import('./pages/store/store').then((m) => m.Store),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/orders').then((m) => m.Orders),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];