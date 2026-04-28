import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StoreService, Store } from '../../services/store.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {

  restaurants = signal<Store[]>([]);

  constructor(
    private storeService: StoreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('HOME CARGÓ');

    this.storeService.getStores().subscribe({
      next: (data) => {
        console.log('STORES:', data);
        this.restaurants.set(data);
      },
      error: (err) => console.error('ERROR:', err)
    });
  }

  
  goToStore(id: number): void {
    this.router.navigate(['/store', id]);
  }
}