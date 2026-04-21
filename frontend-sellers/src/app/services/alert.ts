import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  message = signal<string | null>(null);
  type = signal<'error' | 'success' | 'info'>('error');

  showError(msg: string) {
    this.type.set('error');
    this.message.set(msg);
  }

  showSuccess(msg: string) {
    this.type.set('success');
    this.message.set(msg);
  }

  showInfo(msg: string) {
    this.type.set('info');
    this.message.set(msg);
  }

  clear() {
    this.message.set(null);
  }
}
