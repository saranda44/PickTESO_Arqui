import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert-container">
      @for (alert of alertService.alerts(); track alert.id) {
        <div [class]="'alert alert--' + alert.type">
          <div class="alert__content">
            <span class="alert__icon">{{ getIcon(alert.type) }}</span>
            <span class="alert__message">{{ alert.message }}</span>
          </div>
          <button (click)="dismiss(alert.id)" class="alert__close" title="Cerrar">×</button>
        </div>
      }
    </div>
  `,
  styleUrl: './alert.scss'
})
export class Alert {
  protected alertService = inject(AlertService);

  dismiss(id: string) {
    this.alertService.removeAlert(id);
  }

  getIcon(type: 'error' | 'success' | 'info'): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };
    return icons[type] || '';
  }
}