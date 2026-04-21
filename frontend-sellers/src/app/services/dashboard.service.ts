// import { Injectable, signal, Signal } from '@angular/core';

// export interface Tag {
//     id: number;
//     name: string;
//     color?: string | null;
//     description?: string | null;
// }

// export interface Product {
//     id: number;
//     name: string;
//     price: number;
//     description?: string | null;
//     stock: number;
//     tags: Tag[];
// }

// export interface StoreInfo {
//     id: number;
//     name: string;
//     description?: string | null;
// }

// @Injectable({ providedIn: 'root' })
// export class DashboardService {
//     store: Signal<StoreInfo> = signal({ id: 1, name: 'Mi Tienda', description: 'Tienda de ejemplo' });

//     products: Signal<Product[]> = signal([
//         {
//             id: 1,
//             name: 'Camiseta básica',
//             price: 199.99,
//             description: 'Camiseta de algodón 100%',
//             stock: 12,
//             tags: [{ id: 1, name: 'Ropa' }],
//         },
//         {
//             id: 2,
//             name: 'Taza estampada',
//             price: 49.5,
//             description: 'Taza cerámica 300ml',
//             stock: 30,
//             tags: [{ id: 2, name: 'Hogar' }],
//         },
//     ]);

//     tags: Signal<Tag[]> = signal([{ id: 1, name: 'Ropa' }, { id: 2, name: 'Hogar' }]);

//     updateStore(upd: Partial<StoreInfo>) {
//         this.store.set({ ...this.store(), ...upd });
//     }

//     updateProduct(product: Product) {
//         this.products.set(this.products().map((p) => (p.id === product.id ? { ...product } : p)));
//     }

//     updateStock(productId: number, stock: number) {
//         this.products.set(this.products().map((p) => (p.id === productId ? { ...p, stock } : p)));
//     }

//     addTag(tag: Omit<Tag, 'id'>): Tag {
//         const newTag: Tag = { ...tag, id: Date.now() };
//         this.tags.set([...this.tags(), newTag]);
//         return newTag;
//     }

//     addTagToProduct(productId: number, tag: Tag) {
//         this.products.set(
//             this.products().map((p) => (p.id === productId ? { ...p, tags: [...p.tags, tag] } : p))
//         );
//     }

//     removeTagFromProduct(productId: number, tagId: number) {
//         this.products.set(
//             this.products().map((p) => (p.id === productId ? { ...p, tags: p.tags.filter((t) => t.id !== tagId) } : p))
//         );
//     }

//     updateTag(tag: Tag) {
//         this.tags.set(this.tags().map((t) => (t.id === tag.id ? tag : t)));
//         // reflect tag changes in products
//         this.products.set(this.products().map((p) => ({ ...p, tags: p.tags.map((t) => (t.id === tag.id ? tag : t)) })));
//     }
// }
