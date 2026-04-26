import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsList } from '../../components/products-list/products-list';
import { AlertService } from '../../services/alert';
import { Alert } from '../../shared/alert/alert';
import { Stores } from '../stores/stores';
import { ProductCreation } from '../../components/product-creation/product-creation';
import { Tags } from '../../components/tags/tags';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, ProductsList, Alert, Stores, ProductCreation, Tags],
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class Home implements OnInit {
    @ViewChild(ProductsList) productsList!: ProductsList;

    private alertService = inject(AlertService);


    ngOnInit() {
        // console.log('Home init');
    }


    refreshProducts() {
        if (this.productsList) {
            this.productsList.loadProducts();
        }
    }

}