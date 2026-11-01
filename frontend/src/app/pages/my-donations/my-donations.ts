import {
  Component,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  afterNextRender,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { DonationService } from '../../services/donation.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-my-donations',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './my-donations.html',

  styleUrls: ['./my-donations.css']
})
export class MyDonationsComponent implements OnDestroy {

  // =====================================================
  // DONATIONS
  // =====================================================

  donations: any[] = [];


  // =====================================================
  // PAGE STATE
  // =====================================================

  loading = false;

  errorMessage = '';

  cancellingId: string | null = null;

  expandedRecommendationId = '';

  recommendationLoadingId = '';

  recommendationsByDonation: Record<string, any[]> = {};

  recommendationErrors: Record<string, string> = {};


  // =====================================================
  // CANCELLATION TIMER
  // =====================================================

  private cancellationTimer:
    ReturnType<typeof setInterval> | null = null;

  readonly cancellationWindowMs =
    10 * 60 * 1000;

  currentTime = Date.now();


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private donationService: DonationService,

    private authService: AuthService,

    private router: Router,

    private cdr: ChangeDetectorRef,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {

    /*
     * Run browser-only code after Angular renders.
     */
    afterNextRender(() => {

      console.log(
        '================================='
      );

      console.log(
        'My Donations page loaded'
      );

      console.log(
        '================================='
      );

      this.loadDonations();

    });

  }


  // =====================================================
  // LOAD DONATIONS
  // =====================================================

  loadDonations(): void {

    console.log(
      '================================='
    );

    console.log(
      'Loading My Donations...'
    );

    console.log(
      '================================='
    );


    this.loading = true;

    this.errorMessage = '';


    this.cdr.detectChanges();


    // ===================================================
    // GET LOGIN TOKEN
    // ===================================================

    const token =
      this.authService.getToken();


    console.log(
      'MyDonations token:',
      token
        ? 'TOKEN FOUND'
        : 'NO TOKEN FOUND'
    );


    // ===================================================
    // TOKEN NOT FOUND
    // ===================================================

    if (!token) {

      this.loading = false;

      this.errorMessage =
        'Your login session is not available. Please login again.';


      this.cdr.detectChanges();

      return;
    }

    // ===================================================
    // API CALL
    // ===================================================

    console.log(
      'Calling:',
      'http://localhost:5000/api/donations/my'
    );


    this.donationService
      .getMyDonations()
      .subscribe({

        // =================================================
        // SUCCESS
        // =================================================

        next: (response: any) => {

          console.log(
            '================================='
          );

          console.log(
            'MY DONATIONS API RESPONSE'
          );

          console.log(
            response
          );

          console.log(
            '================================='
          );


          // -----------------------------------------------
          // GET DONATION ARRAY
          // -----------------------------------------------

          if (
            Array.isArray(
              response?.donations
            )
          ) {

            this.donations =
              response.donations;

          }

          else if (
            Array.isArray(
              response?.data
            )
          ) {

            this.donations =
              response.data;

          }

          else {

            this.donations = [];

          }


          // -----------------------------------------------
          // LOG EVERY DONATION
          // -----------------------------------------------

          console.log(
            'Total donations received:',
            this.donations.length
          );


          this.donations.forEach(
            (
              donation: any,
              index: number
            ) => {

              console.log(
                `Donation ${index + 1}`
              );

              console.log(
                'Food:',
                donation?.foodName
              );

              console.log(
                'ID:',
                donation?._id
              );

              console.log(
                'Status:',
                JSON.stringify(
                  donation?.status
                )
              );

              console.log(
                'Created At:',
                donation?.createdAt
              );

              console.log(
                'Accepted By:',
                donation?.acceptedBy
              );

              console.log(
                'Accepted At:',
                donation?.acceptedAt
              );

              console.log(
                '---------------------------------'
              );

            }
          );


          // -----------------------------------------------
          // FORCE NEW ARRAY REFERENCE
          // -----------------------------------------------

          this.donations = [
            ...this.donations
          ];


          // -----------------------------------------------
          // FINISH LOADING
          // -----------------------------------------------

          this.loading = false;

          this.errorMessage = '';


          // -----------------------------------------------
          // START CANCELLATION TIMER
          // -----------------------------------------------

          this.startCancellationTimer();


          this.cdr.detectChanges();


          // -----------------------------------------------
          // STATISTICS DEBUG
          // -----------------------------------------------

          console.log(
            '========== FINAL STATISTICS =========='
          );

          console.log(
            'Total Donations:',
            this.totalDonations
          );

          console.log(
            'Pending Donations:',
            this.pendingDonations
          );

          console.log(
            'Accepted Donations:',
            this.acceptedDonations
          );

          console.log(
            'Completed Donations:',
            this.completedDonations
          );

          console.log(
            '======================================'
          );

        },


        // =================================================
        // ERROR
        // =================================================

        error: (error: any) => {

          console.error(
            '================================='
          );

          console.error(
            'MY DONATIONS API ERROR'
          );

          console.error(
            error
          );

          console.error(
            '================================='
          );


          this.loading = false;


          // -----------------------------------------------
          // 401
          // -----------------------------------------------

          if (
            error?.status === 401
          ) {

            this.errorMessage =
              'Your login session has expired. Please login again.';

            this.authService.logout();

          }


          // -----------------------------------------------
          // 403
          // -----------------------------------------------

          else if (
            error?.status === 403
          ) {

            this.errorMessage =
              'You do not have permission to view these donations.';

          }


          // -----------------------------------------------
          // SERVER NOT RUNNING
          // -----------------------------------------------

          else if (
            error?.status === 0
          ) {

            this.errorMessage =
              'Unable to connect to the MealMitra server. Please make sure the backend is running.';

          }


          // -----------------------------------------------
          // OTHER ERROR
          // -----------------------------------------------

          else {

            this.errorMessage =
              error?.error?.message ||
              'Failed to load donations. Please try again.';

          }


          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // NORMALIZE STATUS
  // =====================================================

  private normalizeStatus(
    status: any
  ): string {

    return String(
      status ?? ''
    )
      .trim()
      .toLowerCase()
      .replace(/-/g, '_')
      .replace(/\s+/g, '_');

  }

  toggleRecommendations(donation: any): void {
    const donationId = String(donation?._id || '');

    if (!donationId || donation.status !== 'pending') {
      return;
    }

    if (this.expandedRecommendationId === donationId) {
      this.expandedRecommendationId = '';
      return;
    }

    this.expandedRecommendationId = donationId;

    if (this.recommendationsByDonation[donationId]) {
      return;
    }

    this.recommendationLoadingId = donationId;
    delete this.recommendationErrors[donationId];

    this.donationService
      .getDonationRecommendations(donationId)
      .subscribe({
        next: (response: any) => {
          this.recommendationsByDonation[donationId] =
            Array.isArray(response?.recommendations)
              ? response.recommendations
              : [];
          this.recommendationLoadingId = '';
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('NGO recommendations error:', error);
          this.recommendationErrors[donationId] =
            error?.error?.message ||
            'Unable to calculate NGO recommendations. Please try again.';
          this.recommendationLoadingId = '';
          this.cdr.detectChanges();
        }
      });
  }


  // =====================================================
  // CREATE DONATION
  // =====================================================

  createDonation(): void {

    this.router.navigate([
      '/create-donation'
    ]);

  }


  // =====================================================
  // BACK TO DONOR DASHBOARD
  // =====================================================

  goToDashboard(): void {

    this.router.navigate([
      '/donor-dashboard'
    ]);

  }


  // =====================================================
  // CANCEL DONATION
  // =====================================================

  cancelDonation(
    id: string
  ): void {

    if (!id) {
      return;
    }


    // -----------------------------------------------
    // FIND DONATION
    // -----------------------------------------------

    const donation =
      this.donations.find(
        (
          item: any
        ) =>
          item?._id === id
      );


    // -----------------------------------------------
    // FRONTEND 10-MINUTE PROTECTION
    // -----------------------------------------------

    if (
      !this.isCancellationAvailable(
        donation
      )
    ) {

      window.alert(
        'The 10-minute cancellation period has expired. This donation can no longer be cancelled.'
      );

      return;
    }


    // -----------------------------------------------
    // CONFIRM
    // -----------------------------------------------

    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this donation?'
      );


    if (!confirmed) {
      return;
    }


    this.cancellingId = id;


    this.cdr.detectChanges();


    this.donationService
      .cancelDonation(id)
      .subscribe({

        // ===============================================
        // SUCCESS
        // ===============================================

        next: (response: any) => {

          console.log(
            'Donation cancelled:',
            response
          );


          const donation =
            this.donations.find(
              (
                item: any
              ) =>
                item?._id === id
            );


          if (donation) {

            donation.status =
              'cancelled';

          }


          /*
           * Create a new array reference so Angular
           * immediately updates the statistics.
           */
          this.donations = [
            ...this.donations
          ];


          this.cancellingId = null;


          this.cdr.detectChanges();

        },


        // ===============================================
        // ERROR
        // ===============================================

        error: (error: any) => {

          console.error(
            'Cancel donation error:',
            error
          );


          this.cancellingId = null;


          this.cdr.detectChanges();


          window.alert(
            error?.error?.message ||
            'Failed to cancel donation.'
          );

        }

      });

  }


  // =====================================================
  // STATISTICS
  // =====================================================

  // -----------------------------------------------------
  // TOTAL DONATIONS
  // -----------------------------------------------------

  get totalDonations(): number {

    return this.donations.length;

  }


  // -----------------------------------------------------
  // PENDING DONATIONS
  // -----------------------------------------------------

  get pendingDonations(): number {

    return this.donations.filter(
      (
        donation: any
      ) => {

        const status =
          this.normalizeStatus(
            donation?.status
          );


        return status === 'pending';

      }
    ).length;

  }


  // -----------------------------------------------------
  // ACCEPTED DONATIONS
  // -----------------------------------------------------

  get acceptedDonations(): number {

    return this.donations.filter(
      (
        donation: any
      ) => {

        const status =
          this.normalizeStatus(
            donation?.status
          );


        return (
          status === 'accepted' ||
          status === 'picked_up' ||
          status === 'completed'
        );

      }
    ).length;

  }


  // -----------------------------------------------------
  // COMPLETED DONATIONS
  // -----------------------------------------------------

  get completedDonations(): number {

    return this.donations.filter(
      (
        donation: any
      ) => {

        const status =
          this.normalizeStatus(
            donation?.status
          );


        return status === 'completed';

      }
    ).length;

  }


  // =====================================================
  // STATUS TEXT
  // =====================================================

  getStatusText(
    status: string
  ): string {

    const normalizedStatus =
      this.normalizeStatus(status);


    switch (
      normalizedStatus
    ) {

      case 'pending':

        return 'Pending';


      case 'accepted':

        return 'Accepted';


      case 'picked_up':

        return 'Picked Up';


      case 'completed':

        return 'Completed';


      case 'cancelled':

        return 'Cancelled';


      default:

        return status || 'Unknown';

    }

  }


  // =====================================================
  // STATUS CSS CLASS
  // =====================================================

  getStatusClass(
    status: string
  ): string {

    const normalizedStatus =
      this.normalizeStatus(status);


    switch (
      normalizedStatus
    ) {

      case 'pending':

        return 'status-pending';


      case 'accepted':

        return 'status-accepted';


      case 'picked_up':

        return 'status-picked';


      case 'completed':

        return 'status-completed';


      case 'cancelled':

        return 'status-cancelled';


      default:

        return 'status-pending';

    }

  }


  // =====================================================
  // FOOD PREFERENCE CLASS
  // =====================================================

  getFoodPreferenceClass(
    preference: string
  ): string {

    if (!preference) {

      return 'preference-default';

    }


    switch (
      preference
        .trim()
        .toLowerCase()
    ) {

      case 'vegetarian':

        return 'preference-vegetarian';


      case 'non-vegetarian':

        return 'preference-non-vegetarian';


      case 'mixed':

        return 'preference-mixed';


      default:

        return 'preference-default';

    }

  }


  // =====================================================
  // FORMAT DATE
  // =====================================================

  formatDate(
    date: string
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


    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  // =====================================================
  // FORMAT DATE + TIME
  // =====================================================

  formatDateTime(
    date: string
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


    return parsedDate.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );

  }


  // =====================================================
  // DEADLINE CHECK
  // =====================================================

  isDeadlinePassed(
    deadline: string
  ): boolean {

    if (!deadline) {

      return false;

    }


    const deadlineTime =
      new Date(
        deadline
      ).getTime();


    const currentTime =
      new Date().getTime();


    return (
      deadlineTime <
      currentTime
    );

  }


  // =====================================================
  // START CANCELLATION TIMER
  // =====================================================

  private startCancellationTimer(): void {

    this.stopCancellationTimer();


    this.currentTime =
      Date.now();


    this.cancellationTimer =
      setInterval(() => {

        this.currentTime =
          Date.now();


        this.cdr.detectChanges();


        const hasCancellableDonation =
          this.donations.some(
            (
              donation: any
            ) =>
              this.isCancellationAvailable(
                donation
              )
          );


        if (!hasCancellableDonation) {

          this.stopCancellationTimer();

        }

      }, 1000);

  }


  // =====================================================
  // STOP CANCELLATION TIMER
  // =====================================================

  private stopCancellationTimer(): void {

    if (
      this.cancellationTimer !== null
    ) {

      clearInterval(
        this.cancellationTimer
      );


      this.cancellationTimer =
        null;

    }

  }


  // =====================================================
  // CHECK CANCELLATION AVAILABILITY
  // =====================================================

  isCancellationAvailable(
    donation: any
  ): boolean {

    if (!donation) {

      return false;

    }


    const status =
      this.normalizeStatus(
        donation.status
      );


    // Only pending donations
    // can be cancelled.

    if (
      status !== 'pending'
    ) {

      return false;

    }


    if (
      !donation.createdAt
    ) {

      return false;

    }


    const createdTime =
      new Date(
        donation.createdAt
      ).getTime();


    if (
      isNaN(createdTime)
    ) {

      return false;

    }


    const expiryTime =
      createdTime +
      this.cancellationWindowMs;


    return (
      this.currentTime <
      expiryTime
    );

  }


  // =====================================================
  // GET REMAINING CANCELLATION TIME
  // =====================================================

  getCancellationRemaining(
    donation: any
  ): string {

    if (
      !donation?.createdAt
    ) {

      return '';

    }


    const createdTime =
      new Date(
        donation.createdAt
      ).getTime();


    if (
      isNaN(createdTime)
    ) {

      return '';

    }


    const expiryTime =
      createdTime +
      this.cancellationWindowMs;


    const remaining =
      Math.max(
        0,
        expiryTime -
        this.currentTime
      );


    const totalSeconds =
      Math.ceil(
        remaining / 1000
      );


    const minutes =
      Math.floor(
        totalSeconds / 60
      );


    const seconds =
      totalSeconds % 60;


    return (
      `${minutes}:` +
      `${seconds
        .toString()
        .padStart(2, '0')}`
    );

  }


  // =====================================================
  // COMPONENT CLEANUP
  // =====================================================

  ngOnDestroy(): void {

    this.stopCancellationTimer();

  }

}


// =========================================================
// ROUTER EXPORT
// =========================================================

export const MyDonations =
  MyDonationsComponent;