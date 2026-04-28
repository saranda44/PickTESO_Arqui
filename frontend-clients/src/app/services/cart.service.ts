import { Injectable, signal } from '@angular/core';

interface CartItem {
  id: number;
  name: string;
  price: number;
  product_image?: string | null;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  items = signal<CartItem[]>([]);

  constructor() {
    this.loadCart();
  }

  // Cargar desde localStorage
  private loadCart() {
    const data = localStorage.getItem('cart');
    if (data) {
      this.items.set(JSON.parse(data));
    }
  }

  // Guardar en localStorage
  private saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.items()));
  }

  // AGREGAR PRODUCTO
  addToCart(product: any) {
    const current = this.items();

    const existing = current.find(item => item.id === product.id);

    if (existing) {
      existing.quantity++;
    } else {
      current.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        product_image: product.product_image,
        quantity: 1
      });
    }

    this.items.set([...current]);
    this.saveCart();
  }

  // QUITAR
  removeFromCart(productId: number) {
    const current = this.items();

    const item = current.find(i => i.id === productId);
    if (!item) return;

    item.quantity--;

    if (item.quantity <= 0) {
      this.items.set(current.filter(i => i.id !== productId));
    } else {
      this.items.set([...current]);
    }

    this.saveCart();
  }

  // TOTAL
  getTotal(): number {
    return this.items().reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);
  }

  // CONTADOR
  count = () => {
    return this.items().reduce((acc, item) => acc + item.quantity, 0);
  };
}