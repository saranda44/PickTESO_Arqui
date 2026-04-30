import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.html',
  styleUrl: './payment.scss' 
})
export class Payment implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);

  loading = true;
  success = false;
  errorMessage = '';

async ngOnInit(): Promise<void> {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const orderId = this.route.snapshot.queryParamMap.get('order_id') 
                    ?? localStorage.getItem('pendingOrderId');

    if (!sessionId || !orderId) {
      this.loading = false;
      this.errorMessage = 'Missing payment information';
      return;
    }

    try {
      await this.paymentService.confirmPayment(sessionId, Number(orderId));
      localStorage.removeItem('pendingOrderId');
      this.loading = false;
      this.success = true;
      setTimeout(() => this.router.navigate(['/orders']), 2000);
    } catch (err: any) {
      this.loading = false;
      this.errorMessage = err?.error?.error ?? 'Something went wrong';
    }
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }
}