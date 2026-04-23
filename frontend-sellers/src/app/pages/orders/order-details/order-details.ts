import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../../services/orders';
import { AuthService } from '../../../services/auth';
import { AlertService } from '../../../services/alert';
import {
  IOrderWithProducts,
  OrderStatus,
  ORDER_STATUS_LABELS,
} from '../../../interfaces/order.interface';
import { ReusableModalComponent } from '../../../components/reusable-modal/reusable-modal';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReusableModalComponent],
  templateUrl: './order-details.html',
  styleUrl: './order-details.scss',
})
export class OrderDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertService);

  readonly order = signal<IOrderWithProducts | null>(null);
  readonly loading = signal(false);
  readonly updating = signal(false);

  readonly otpOpen    = signal(false);
  readonly otp        = signal('');
  readonly cancelOpen = signal(false);

  private storeId = 0;
  private orderId = 0;

  readonly customerFullName = computed(() => {
    const c = this.order()?.customer;
    if (!c) return '';
    return `${c.first_name} ${c.paternal_last_name} ${c.maternal_last_name}`.trim();
  });

  readonly statusLabel = computed(() => {
    const s = this.order()?.status;
    return s ? ORDER_STATUS_LABELS[s] : '';
  });

  readonly canPrepare  = computed(() => this.order()?.status === 'paid');
  readonly canReady    = computed(() => this.order()?.status === 'preparing');
  readonly canComplete = computed(() => this.order()?.status === 'ready');
  readonly canCancel   = computed(() => {
    const s = this.order()?.status;
    return s === 'paid';
  });

  ngOnInit(): void {
    const raw = this.auth.getStoreId();
    this.storeId = raw ? Number(raw) : 0;
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder();
  }

  private loadOrder(): void {
    this.loading.set(true);
    this.ordersService.getOrderById(this.storeId, this.orderId).subscribe({
      next: (res) => {
        this.order.set(res.order);
        this.loading.set(false);
      },
      error: () => {
        this.alert.showError('Error al cargar el pedido');
        this.loading.set(false);
      },
    });
  }

  changeStatus(status: OrderStatus): void {
    if (this.updating()) return;
    this.updating.set(true);

    this.ordersService.updateStatus(this.storeId, this.orderId, status).subscribe({
      next: (res) => {
        this.mergeOrder(res.order);
        this.alert.showSuccess(`Estado actualizado a "${ORDER_STATUS_LABELS[status]}"`);
        this.updating.set(false);
      },
      error: () => {
        this.alert.showError('No se pudo actualizar el estado');
        this.updating.set(false);
      },
    });
  }

  openCancelModal(): void {
    if (!this.canCancel() || this.updating()) return;
    this.cancelOpen.set(true);
  }

  closeCancelModal(): void {
    this.cancelOpen.set(false);
  }

  confirmCancel(): void {
    this.cancelOpen.set(false);
    this.updating.set(true);
    this.ordersService.cancelOrder(this.storeId, this.orderId).subscribe({
      next: (res) => {
        this.mergeOrder(res.order);
        this.alert.showSuccess(
          res.alreadyCancelled ? 'El pedido ya estaba cancelado' : 'Pedido cancelado'
        );
        this.updating.set(false);
      },
      error: () => {
        this.alert.showError('No se pudo cancelar el pedido');
        this.updating.set(false);
      },
    });
  }

  openOtpModal(): void {
    if (!this.canComplete()) return;
    this.otp.set('');
    this.otpOpen.set(true);
  }

  closeOtpModal(): void {
    this.otpOpen.set(false);
  }

  submitOtp(): void {
    const code = this.otp().trim();
    if (!/^\d{6}$/.test(code)) {
      this.alert.showError('El código OTP debe tener 6 dígitos');
      return;
    }

    this.updating.set(true);
    this.ordersService.completeOrder(this.storeId, this.orderId, code).subscribe({
      next: (res) => {
        this.mergeOrder(res.data);
        this.alert.showSuccess('Pedido completado');
        this.otpOpen.set(false);
        this.updating.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Código OTP inválido';
        this.alert.showError(msg);
        this.updating.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  private mergeOrder(updated: { status: OrderStatus; updated_at: string }): void {
    const current = this.order();
    if (!current) return;
    this.order.set({ ...current, ...updated });
  }
}