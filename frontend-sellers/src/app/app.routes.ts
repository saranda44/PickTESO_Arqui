import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Orders } from './pages/orders/orders';
import { OrderDetails } from './pages/orders/order-details/order-details';
import { OrdersList } from './pages/orders/orders-list/orders-list';
import { authGuard, publicGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'login', component: Login, canActivate: [publicGuard] },
    { path: 'home', component: Home, canActivate: [authGuard] },
    {
        path: 'orders',
        component: Orders,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                component: OrdersList,
            },
            {
                path: ':id',
                component: OrderDetails,
            },
        ],
    },
];
