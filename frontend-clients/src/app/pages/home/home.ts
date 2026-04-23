import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Restaurant {
  name: string;
  cafeteria: string;
  image: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {

  restaurants: Restaurant[] = [
    {
      name: 'Mar y Mesa',
      cafeteria: 'Cafetería Central',
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d'
    },
    {
      name: 'Clementine & Rye',
      cafeteria: 'Cafetería Central',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38'
    },
    {
      name: 'Second Street Noddles',
      cafeteria: 'Cafetería Pedro Arrupe',
      image: 'https://images.unsplash.com/photo-1559847844-5315695dadae'
    }
  ];

}
