import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  product_image?: string | null;
  tags?: any[];
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './store.html',
  styleUrls: ['./store.scss'],
})
export class Store implements OnInit {

  products = signal<Product[]>([]);
  storeId!: number;

  // Nombre de la tienda
  storeName = '';

  // Control de tags 
  showTags = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.storeId = Number(this.route.snapshot.paramMap.get('id'));

    // Obtener info de la tienda
    this.productService.getStoreById(this.storeId).subscribe({
      next: (store) => {
        this.storeName = store.name;
      },
      error: (err) => console.error('STORE ERROR:', err)
    });

    // Obtener productos
    this.productService.getProductsByStore(this.storeId).subscribe({
      next: (data) => {
        console.log('PRODUCTS:', data);
        this.products.set(data);
      },
      error: (err) => console.error('PRODUCTS ERROR:', err)
    });
  }
}