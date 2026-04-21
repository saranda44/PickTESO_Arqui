import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-reusable-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './reusable-modal.html',
    styleUrls: ['./reusable-modal.scss'],
})
export class ReusableModalComponent {
    @Input() visible = false;
    @Input() title = '';
    @Output() close = new EventEmitter<void>();
}
