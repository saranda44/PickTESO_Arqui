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
  private readonly CART_KEY = 'cart';
  private readonly STORE_KEY = 'cart_store_id';

  constructor() {
    this.loadCart();
  }

  // Cargar desde localStorage
  private loadCart() {
    const data = localStorage.getItem(this.CART_KEY);
    if (data) {
      this.items.set(JSON.parse(data));
    }
  }

  // Guardar en localStorage
  private saveCart() {
    localStorage.setItem(this.CART_KEY, JSON.stringify(this.items()));
  }

  setStoreId(storeId: number): void {
    localStorage.setItem(this.STORE_KEY, storeId.toString());
  }

  getStoreId(): number | null {
    const raw = localStorage.getItem(this.STORE_KEY);
    return raw ? Number(raw) : null;
  }

  clearCart(): void {
    this.items.set([]);
    localStorage.removeItem(this.CART_KEY);
    localStorage.removeItem(this.STORE_KEY);
  }

  // AGREGAR PRODUCTO — retorna false si la tienda no coincide
  addToCart(product: any, storeId?: number): boolean {
    const currentStoreId = this.getStoreId();
    if (storeId !== undefined && currentStoreId !== null && currentStoreId !== storeId) {
      return false;
    }

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
    return true;
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