import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsList } from '../../components/products-list/products-list';
import { AlertService } from '../../services/alert';
import { Alert } from '../../shared/alert/alert';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, ProductsList, Alert],
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class Home implements OnInit {

    alertService = inject(AlertService);
    

    ngOnInit() {
        console.log('Home init');
    }
}