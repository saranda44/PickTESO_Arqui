import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.scss' 
})
export class Payment implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);

  loading = true;
  success = false;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    const paymentIntentId = this.route.snapshot.queryParamMap.get('payment_intent');
    const redirectStatus = this.route.snapshot.queryParamMap.get('redirect_status');
    const orderId = localStorage.getItem('pendingOrderId');

    if (!paymentIntentId || !orderId) {
      this.loading = false;
      this.errorMessage = 'Missing payment information';
      return;
    }

    if (redirectStatus !== 'succeeded') {
      this.loading = false;
      this.errorMessage = 'Payment was not completed';
      return;
    }

    try {
      await this.paymentService.confirmPayment(paymentIntentId, Number(orderId));
      localStorage.removeItem('pendingOrderId');
      this.loading = false;
      this.success = true;
      setTimeout(() => this.router.navigate(['/orders']), 2000);
    } catch (err: any) {
      this.loading = false;
      this.errorMessage = err?.error?.error ?? 'Something went wrong';
    }
  }
}