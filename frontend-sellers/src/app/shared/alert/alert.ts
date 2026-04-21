// components/alert/alert.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message && message !== null) {
      <div [class]="'alert alert--' + type">
        {{ message }}
        <button (click)="close.emit()" class="alert__close">×</button>
      </div>
    }
  `,
  styleUrl: './alert.scss'
})
export class Alert {
  @Input() message: string | null = null;
  @Input() type: 'error' | 'success' | 'info' = 'error';
  @Output() close = new EventEmitter<void>();
}