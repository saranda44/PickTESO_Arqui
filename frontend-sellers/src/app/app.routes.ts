import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Orders } from './pages/orders/orders';
import { OrderDetails } from './pages/orders/order-details/order-details';
import { OrdersList } from './pages/orders/orders-list/orders-list';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'home', component: Home },
    {
        path: 'orders',
        component: Orders,
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
