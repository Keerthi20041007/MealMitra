import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from '../../services/auth.service';

import {
  AdminService
} from '../../services/admin.service';


@Component({
  selector: 'app-admin-dashboard',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './admin-dashboard.html',

  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {

  // =====================================================
  // ADMIN
  // =====================================================

  user: any = null;

  adminName = 'MealMitra Admin';

  adminEmail = 'admin@mealmitra.com';

  adminPhone = '';


  // =====================================================
  // LOADING / ERROR
  // =====================================================

  loading = true;

  errorMessage = '';

  actionSuccessMessage = '';

  actionErrorMessage = '';

  deletingUserId = '';

  deletingDonationId = '';


  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  totalUsers = 0;

  totalDonors = 0;

  totalNGOs = 0;

  // Alias used by existing HTML
  totalNgos = 0;

  totalDonations = 0;


  // =====================================================
  // DONATION STATUS
  // =====================================================

  pendingDonations = 0;

  acceptedDonations = 0;

  pickedUpDonations = 0;

  completedDonations = 0;

  cancelledDonations = 0;


  // =====================================================
  // IMPACT
  // =====================================================

  peopleServed = 0;

  // Alias used by existing HTML
  totalPeopleServed = 0;

  foodKg = 0;

  foodPackets = 0;

  foodLitres = 0;

  foodItems = 0;

  // Alias used by existing HTML
  totalFoodItems = 0;


  // =====================================================
  // DATA ARRAYS
  // =====================================================

  recentDonations: any[] = [];

  recentUsers: any[] = [];

  allUsers: any[] = [];

  allDonations: any[] = [];

  // Aliases used by existing HTML
  users: any[] = [];

  donations: any[] = [];

  statusSummary: any[] = [];

  foodTypeSummary: any[] = [];

  foodPreferenceSummary: any[] = [];


  // =====================================================
  // ACTIVE SECTION
  // =====================================================

  activeSection = 'dashboard';


  private isBrowser = false;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private adminService: AdminService,

    private authService: AuthService,

    private router: Router,

    private cdr: ChangeDetectorRef,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {

    this.isBrowser =
      isPlatformBrowser(this.platformId);

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    if (!this.isBrowser) {
      return;
    }


    this.user =
      this.authService.getCurrentUser();


    console.log(
      '================================='
    );

    console.log(
      'ADMIN DASHBOARD USER'
    );

    console.log(
      this.user
    );

    console.log(
      '================================='
    );


    // -----------------------------------------------------
    // ADMIN CHECK
    // -----------------------------------------------------

    if (
      !this.user ||
      this.user.role !== 'admin'
    ) {

      console.error(
        'Admin user not found.'
      );

      this.router.navigate([
        '/login'
      ]);

      return;
    }


    // -----------------------------------------------------
    // ADMIN DETAILS
    // -----------------------------------------------------

    this.adminName =
      this.user.name ||
      'MealMitra Admin';


    this.adminEmail =
      this.user.email ||
      'admin@mealmitra.com';


    this.adminPhone =
      this.user.phone ||
      '';


    // -----------------------------------------------------
    // LOAD REAL DATA
    // -----------------------------------------------------

    this.loadDashboard();

  }


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  loadDashboard(): void {

    this.loading = true;

    this.errorMessage = '';


    console.log(
      '================================='
    );

    console.log(
      'CALLING ADMIN DASHBOARD API'
    );

    console.log(
      'http://localhost:5000/api/admin/dashboard'
    );

    console.log(
      '================================='
    );


    this.adminService
      .getDashboardStats()
      .subscribe({

        next: (response: any) => {

          console.log(
            '================================='
          );

          console.log(
            'ADMIN DASHBOARD API RESPONSE'
          );

          console.log(
            response
          );

          console.log(
            '================================='
          );


          if (
            !response ||
            response.success !== true
          ) {

            this.errorMessage =
              response?.message ||
              'Failed to load dashboard data.';

            this.loading = false;

            this.cdr.detectChanges();

            return;
          }


          // =================================================
          // USERS
          // =================================================

          this.totalUsers =
            Number(
              response.stats?.users?.total ?? 0
            );


          this.totalDonors =
            Number(
              response.stats?.users?.donors ?? 0
            );


          this.totalNGOs =
            Number(
              response.stats?.users?.ngos ?? 0
            );


          // IMPORTANT:
          // Existing HTML uses totalNgos
          this.totalNgos =
            this.totalNGOs;


          // =================================================
          // DONATIONS
          // =================================================

          this.totalDonations =
            Number(
              response.stats?.donations?.total ?? 0
            );


          this.pendingDonations =
            Number(
              response.stats?.donations?.pending ?? 0
            );


          this.acceptedDonations =
            Number(
              response.stats?.donations?.accepted ?? 0
            );


          this.pickedUpDonations =
            Number(
              response.stats?.donations?.pickedUp ?? 0
            );


          this.completedDonations =
            Number(
              response.stats?.donations?.completed ?? 0
            );


          this.cancelledDonations =
            Number(
              response.stats?.donations?.cancelled ?? 0
            );


          // =================================================
          // IMPACT
          // =================================================

          this.peopleServed =
            Number(
              response.stats?.impact?.peopleServed ?? 0
            );


          // Existing HTML uses totalPeopleServed
          this.totalPeopleServed =
            this.peopleServed;


          this.foodKg =
            Number(
              response.stats?.impact?.food?.kg ?? 0
            );


          this.foodPackets =
            Number(
              response.stats?.impact?.food?.packets ?? 0
            );


          this.foodLitres =
            Number(
              response.stats?.impact?.food?.litres ?? 0
            );


          this.foodItems =
            Number(
              response.stats?.impact?.food?.items ?? 0
            );


          // Existing HTML uses totalFoodItems
          this.totalFoodItems =
            this.foodItems;


          // =================================================
          // RECENT DONATIONS
          // =================================================

          this.recentDonations =
            Array.isArray(
              response.recentDonations
            )
              ? response.recentDonations
              : [];


          // =================================================
          // RECENT USERS
          // =================================================

          this.recentUsers =
            Array.isArray(
              response.recentUsers
            )
              ? response.recentUsers
              : [];


          // Existing HTML
          this.users =
            this.recentUsers;


          // =================================================
          // ANALYTICS
          // =================================================

          this.statusSummary =
            Array.isArray(
              response.statusSummary
            )
              ? response.statusSummary
              : [];


          this.foodTypeSummary =
            Array.isArray(
              response.foodTypeSummary
            )
              ? response.foodTypeSummary
              : [];


          this.foodPreferenceSummary =
            Array.isArray(
              response.foodPreferenceSummary
            )
              ? response.foodPreferenceSummary
              : [];


          // =================================================
          // DEBUG
          // =================================================

          console.log(
            '========== REAL ADMIN VALUES =========='
          );

          console.log(
            'TOTAL USERS:',
            this.totalUsers
          );

          console.log(
            'TOTAL DONORS:',
            this.totalDonors
          );

          console.log(
            'TOTAL NGOS:',
            this.totalNGOs
          );

          console.log(
            'TOTAL DONATIONS:',
            this.totalDonations
          );

          console.log(
            'PENDING:',
            this.pendingDonations
          );

          console.log(
            'ACCEPTED:',
            this.acceptedDonations
          );

          console.log(
            'PICKED UP:',
            this.pickedUpDonations
          );

          console.log(
            'COMPLETED:',
            this.completedDonations
          );

          console.log(
            'CANCELLED:',
            this.cancelledDonations
          );

          console.log(
            'PEOPLE SERVED:',
            this.peopleServed
          );

          console.log(
            'FOOD KG:',
            this.foodKg
          );

          console.log(
            'FOOD PACKETS:',
            this.foodPackets
          );

          console.log(
            'FOOD LITRES:',
            this.foodLitres
          );

          console.log(
            'FOOD ITEMS:',
            this.foodItems
          );

          console.log(
            'RECENT DONATIONS:',
            this.recentDonations
          );

          console.log(
            'RECENT USERS:',
            this.recentUsers
          );

          console.log(
            'STATUS SUMMARY:',
            this.statusSummary
          );


          // =================================================
          // STOP LOADING
          // =================================================

          this.loading = false;


          // =================================================
          // FORCE ANGULAR UI UPDATE
          // =================================================

          this.cdr.detectChanges();


          console.log(
            'ADMIN DASHBOARD UI UPDATED'
          );

        },


        error: (error: any) => {

          console.error(
            '================================='
          );

          console.error(
            'ADMIN DASHBOARD API ERROR'
          );

          console.error(
            error
          );

          console.error(
            '================================='
          );


          this.loading = false;


          if (error?.status === 401) {

            this.errorMessage =
              'Your admin session has expired. Please login again.';

          }

          else if (error?.status === 403) {

            this.errorMessage =
              'You do not have permission to access the admin dashboard.';

          }

          else if (error?.status === 0) {

            this.errorMessage =
              'Unable to connect to the MealMitra backend.';

          }

          else {

            this.errorMessage =
              error?.error?.message ||
              'Failed to load admin dashboard data.';

          }


          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // LOAD ALL USERS
  // =====================================================

  loadUsers(): void {

    this.adminService
      .getAllUsers()
      .subscribe({

        next: (response: any) => {

          console.log(
            'ALL USERS:',
            response
          );


          this.allUsers =
            Array.isArray(response?.users)
              ? response.users
              : [];


          this.users =
            this.allUsers;


          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error(
            'Failed to load users:',
            error
          );

        }

      });

  }

  deleteUser(user: any): void {
    if (!this.isBrowser || !user?._id || this.deletingUserId) {
      return;
    }

    const userName = this.getUserName(user);
    if (!window.confirm(`Delete the account details for ${userName}? Their donation records will be kept.`)) {
      return;
    }

    this.deletingUserId = user._id;
    this.actionErrorMessage = '';
    this.actionSuccessMessage = '';

    this.adminService
      .deleteUser(user._id)
      .subscribe({
        next: (response: any) => {
          this.allUsers = this.allUsers.filter(
            item => item._id !== user._id
          );
          this.users = this.allUsers;
          this.recentUsers = this.recentUsers.filter(
            item => item._id !== user._id
          );
          this.deletingUserId = '';
          this.actionSuccessMessage =
            response?.message || 'User details deleted successfully.';
          this.loadDashboard();
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Delete user error:', error);
          this.deletingUserId = '';
          this.actionErrorMessage =
            error?.error?.message || 'Failed to delete user.';
          this.cdr.detectChanges();
        }
      });
  }


  // =====================================================
  // LOAD ALL DONATIONS
  // =====================================================

  loadDonations(): void {

    this.adminService
      .getAllDonations()
      .subscribe({

        next: (response: any) => {

          console.log(
            'ALL DONATIONS:',
            response
          );


          this.allDonations =
            Array.isArray(response?.donations)
              ? response.donations
              : [];


          this.donations =
            this.allDonations;


          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error(
            'Failed to load donations:',
            error
          );

        }

      });

  }

  deleteDonation(donation: any): void {
    if (!this.isBrowser || !donation?._id || this.deletingDonationId) {
      return;
    }

    const foodName = donation.foodName || 'this donation';
    if (!window.confirm(`Permanently delete ${foodName}? This action cannot be undone.`)) {
      return;
    }

    this.deletingDonationId = donation._id;
    this.actionErrorMessage = '';
    this.actionSuccessMessage = '';

    this.adminService
      .deleteDonation(donation._id)
      .subscribe({
        next: (response: any) => {
          this.allDonations = this.allDonations.filter(
            item => item._id !== donation._id
          );
          this.donations = this.allDonations;
          this.recentDonations = this.recentDonations.filter(
            item => item._id !== donation._id
          );
          this.deletingDonationId = '';
          this.actionSuccessMessage =
            response?.message || 'Donation deleted successfully.';
          this.loadDashboard();
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Delete donation error:', error);
          this.deletingDonationId = '';
          this.actionErrorMessage =
            error?.error?.message || 'Failed to delete donation.';
          this.cdr.detectChanges();
        }
      });
  }


  // =====================================================
  // SECTION NAVIGATION
  // =====================================================

  setSection(
    section: string
  ): void {

    this.activeSection =
      section;

    this.actionErrorMessage = '';
    this.actionSuccessMessage = '';


    if (
      section === 'users' &&
      this.allUsers.length === 0
    ) {

      this.loadUsers();

    }


    if (
      section === 'donations' &&
      this.allDonations.length === 0
    ) {

      this.loadDonations();

    }


    this.cdr.detectChanges();

  }


  // Existing HTML calls showSection()
  showSection(
    section: string
  ): void {

    this.setSection(section);

  }


  // =====================================================
  // REFRESH
  // =====================================================

  refreshDashboard(): void {

    this.loadDashboard();

  }


  // Existing HTML calls refresh()
  refresh(): void {

    this.loadDashboard();

  }


  // =====================================================
  // DONOR NAME
  // =====================================================

  getDonorName(
    donation: any
  ): string {

    return (
      donation?.donorId?.donorName ||
      donation?.donorId?.name ||
      'Unknown Donor'
    );

  }


  // =====================================================
  // NGO NAME
  // =====================================================

  getNGOName(
    donation: any
  ): string {

    return (
      donation?.acceptedBy?.organizationName ||
      'Not accepted'
    );

  }


  // =====================================================
  // USER NAME
  // =====================================================

  getUserName(
    user: any
  ): string {

    if (
      user?.role === 'ngo'
    ) {

      return (
        user.organizationName ||
        'NGO'
      );

    }


    return (
      user?.donorName ||
      'Donor'
    );

  }


  // =====================================================
  // USER EMAIL
  // =====================================================

  getUserEmail(
    user: any
  ): string {

    if (
      user?.role === 'ngo'
    ) {

      return (
        user.organizationEmail ||
        '-'
      );

    }


    return (
      user?.donorEmail ||
      '-'
    );

  }


  // =====================================================
  // INITIALS
  // =====================================================

  getInitials(
    name: string
  ): string {

    if (!name) {
      return 'MA';
    }


    const words =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (words.length === 1) {

      return words[0]
        .substring(0, 2)
        .toUpperCase();

    }


    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();

  }


  // =====================================================
  // STATUS CLASS
  // =====================================================

  getStatusClass(
    status: string
  ): string {

    return (
      status || 'pending'
    ).toLowerCase();

  }


  // =====================================================
  // FORMAT STATUS
  // =====================================================

  formatStatus(
    status: string
  ): string {

    if (!status) {
      return '-';
    }


    return status
      .replace(/_/g, ' ')
      .replace(
        /\b\w/g,
        char =>
          char.toUpperCase()
      );

  }


  // =====================================================
  // FORMAT DATE
  // =====================================================

  formatDate(
    date: any
  ): string {

    if (!date) {
      return '-';
    }


    const parsedDate =
      new Date(date);


    if (
      isNaN(
        parsedDate.getTime()
      )
    ) {

      return '-';

    }


    return parsedDate
      .toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      );

  }


  // =====================================================
  // FOOD SUMMARY
  // =====================================================

  getFoodSummary(): string {

    const parts: string[] = [];


    if (this.foodKg > 0) {

      parts.push(
        `${this.foodKg} kg`
      );

    }


    if (this.foodPackets > 0) {

      parts.push(
        `${this.foodPackets} packets`
      );

    }


    if (this.foodLitres > 0) {

      parts.push(
        `${this.foodLitres} litres`
      );

    }


    if (this.foodItems > 0) {

      parts.push(
        `${this.foodItems} items`
      );

    }


    return parts.length
      ? parts.join(' • ')
      : '0';

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    this.authService.logout();

    this.router.navigate([
      '/login'
    ]);

  }

}