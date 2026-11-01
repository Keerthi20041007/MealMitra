import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-donor-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './donor-dashboard.html',
  styleUrl: './donor-dashboard.css'
})
export class DonorDashboard {

  constructor(
    private router: Router
  ) {}

  createDonation(): void {

    this.router.navigate(['/create-donation']);

  }

  logout(): void {

    localStorage.removeItem('user');

    this.router.navigate(['/login']);

  }

}