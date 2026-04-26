import { Injectable, signal } from '@angular/core';

export interface AlertItem {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  duration: number;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  alerts = signal<AlertItem[]>([]);
  private idCounter = 0;

  showError(msg: string, duration = 3000) {
    this.addAlert(msg, 'error', duration);
  }

  showSuccess(msg: string, duration = 3000) {
    this.addAlert(msg, 'success', duration);
  }

  showInfo(msg: string, duration = 3000) {
    this.addAlert(msg, 'info', duration);
  }

  private addAlert(msg: string, type: 'error' | 'success' | 'info', duration: number) {
    const id = `alert-${++this.idCounter}`;
    const alert: AlertItem = { id, message: msg, type, duration };

    this.alerts.update(alerts => [...alerts, alert]);

    setTimeout(() => {
      this.removeAlert(id);
    }, duration);
  }

  removeAlert(id: string) {
    this.alerts.update(alerts => alerts.filter(a => a.id !== id));
  }

  clear() {
    this.alerts.set([]);
  }
}
