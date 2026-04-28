import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

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
  imports: [CommonModule, RouterModule],
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

  cartCount!: () => number;
  

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}


  ngOnInit(): void {
    this.storeId = Number(this.route.snapshot.paramMap.get('id'));

    this.cartCount =  this.cartService.count;

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

    // Añadir un producto al carrito
    addToCart(product: Product) {
      this.cartService.addToCart(product);
    }
}