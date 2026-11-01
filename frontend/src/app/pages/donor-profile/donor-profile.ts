import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-donor-profile',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './donor-profile.html',

  styleUrl: './donor-profile.css'
})
export class DonorProfile implements OnInit {

  // ==================================================
  // USER
  // ==================================================

  user: any = null;


  // ==================================================
  // CONSTRUCTOR
  // ==================================================

  constructor(
    private authService: AuthService,
    private router: Router,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {}


  // ==================================================
  // ON INIT
  // ==================================================

  ngOnInit(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return;
    }


    // Get logged-in user

    this.user =
      this.authService.getCurrentUser();


    console.log(
      'Donor profile user:',
      this.user
    );


    // If user is not logged in

    if (!this.user) {

      this.router.navigate([
        '/login'
      ]);

      return;
    }


    // Make sure donor is viewing donor profile

    if (
      String(
        this.user.role
      ).toLowerCase() !== 'donor'
    ) {

      this.router.navigate([
        '/login'
      ]);

    }

  }


  // ==================================================
  // DONOR NAME
  // ==================================================

  get donorName(): string {

    return (
      this.user?.name ||
      this.user?.donorName ||
      'Food Donor'
    );

  }


  // ==================================================
  // EMAIL
  // ==================================================

  get donorEmail(): string {

    return (
      this.user?.email ||
      this.user?.donorEmail ||
      'Not available'
    );

  }


  // ==================================================
  // PHONE
  // ==================================================

  get donorPhone(): string {

    return (
      this.user?.phone ||
      this.user?.donorPhone ||
      'Not available'
    );

  }


  // ==================================================
  // INITIAL
  // ==================================================

  get donorInitial(): string {

    const name =
      this.donorName
        .trim();


    return (
      name.charAt(0)
        .toUpperCase() ||
      'D'
    );

  }


  // ==================================================
  // ROLE
  // ==================================================

  get donorRole(): string {

    return 'Food Donor';

  }


  // ==================================================
  // GO TO DASHBOARD
  // ==================================================

  goToDashboard(): void {

    this.router.navigate([
      '/donor-dashboard'
    ]);

  }


  // ==================================================
  // LOGOUT
  // ==================================================

  logout(): void {

    this.authService.logout();

    this.router.navigate([
      '/login'
    ]);

  }

}