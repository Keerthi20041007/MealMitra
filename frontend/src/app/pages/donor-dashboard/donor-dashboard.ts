import { CommonModule, isPlatformBrowser } from '@angular/common';

import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { DonationService } from '../../services/donation.service';

interface NgoRecommendation {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  availableCapacity: number;
  estimatedPickupMinutes: number;
  matchScore: number;
  matchReasons: string[];
}

@Component({
  selector: 'app-donor-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './donor-dashboard.html',

  styleUrl: './donor-dashboard.css'
})
export class DonorDashboard implements OnInit {


  // ==================================================
  // USER
  // ==================================================

  user: any = null;


  // ==================================================
  // DONATIONS
  // ==================================================

  donations: any[] = [];


  // ==================================================
  // LOADING / ERROR
  // ==================================================

  loading = true;

  errorMessage = '';


  // ==================================================
  // DONATION STATISTICS
  // ==================================================

  totalDonations = 0;

  pendingDonations = 0;

  acceptedDonations = 0;

  pickedUpDonations = 0;

  completedDonations = 0;

  cancelledDonations = 0;


  // ==================================================
  // IMPACT STATISTICS
  // ==================================================

  peopleServed = 0;

  completedPeopleServed = 0;

  totalFood = 0;

  ngosHelped = 0;

  expandedRecommendationId = '';

  recommendationLoadingId = '';

  recommendationsByDonation: Record<string, NgoRecommendation[]> = {};

  recommendationErrors: Record<string, string> = {};


  // ==================================================
  // CONSTRUCTOR
  // ==================================================

  constructor(
    private router: Router,

    private authService: AuthService,

    private donationService: DonationService,

    private cdr: ChangeDetectorRef,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {}


  // ==================================================
  // ON INIT
  // ==================================================

  ngOnInit(): void {

    /*
     * Do not access browser/localStorage during SSR.
     */
    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      this.loading = false;

      return;
    }


    // -----------------------------------------------
    // GET CURRENT USER
    // -----------------------------------------------

    this.user =
      this.authService.getCurrentUser();


    console.log(
      'Donor dashboard user:',
      this.user
    );


    // -----------------------------------------------
    // CHECK USER
    // -----------------------------------------------

    if (!this.user) {

      this.errorMessage =
        'Please login to view your donor dashboard.';

      this.loading = false;

      return;
    }


    // -----------------------------------------------
    // CHECK DONOR ROLE
    // -----------------------------------------------

    if (
      String(
        this.user.role || ''
      ).toLowerCase() !== 'donor'
    ) {

      this.errorMessage =
        'This dashboard is available only for donor accounts.';

      this.loading = false;

      return;
    }


    // -----------------------------------------------
    // LOAD DONATIONS
    // -----------------------------------------------

    this.loadDonations();
  }


  // ==================================================
  // LOAD DONATIONS
  // ==================================================

  loadDonations(): void {

    this.loading = true;

    this.errorMessage = '';


    console.log(
      '===================================='
    );

    console.log(
      'Loading donor donations...'
    );

    console.log(
      '===================================='
    );


    this.donationService
      .getMyDonations()
      .subscribe({

        // ============================================
        // SUCCESS
        // ============================================

        next: (response: any) => {

          console.log(
            'My donations response:',
            response
          );


          // ------------------------------------------
          // GET DONATION LIST
          // ------------------------------------------

          const list =
            response?.donations ??
            response?.data?.donations ??
            response?.data ??
            [];


          // ------------------------------------------
          // MAKE SURE IT IS AN ARRAY
          // ------------------------------------------

          this.donations =
            Array.isArray(list)
              ? [...list]
              : [];


          // ------------------------------------------
          // SORT NEWEST FIRST
          // ------------------------------------------

          this.donations.sort(
            (
              a: any,
              b: any
            ) => {

              const dateA =
                new Date(
                  a?.createdAt ||
                  a?.updatedAt ||
                  a?.pickupDeadline ||
                  0
                ).getTime();


              const dateB =
                new Date(
                  b?.createdAt ||
                  b?.updatedAt ||
                  b?.pickupDeadline ||
                  0
                ).getTime();


              return dateB - dateA;

            }
          );


          // ------------------------------------------
          // DEBUG DONATION STATUS
          // ------------------------------------------

          console.log(
            '========== DONATION STATUS =========='
          );


          this.donations.forEach(
            (
              donation: any,
              index: number
            ) => {

              console.log(
                `Donation ${index + 1}:`
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
                'Accepted By:',
                donation?.acceptedBy
              );

              console.log(
                'Accepted At:',
                donation?.acceptedAt
              );

              console.log(
                '--------------------------------'
              );

            }
          );


          // ------------------------------------------
          // CALCULATE STATISTICS
          // ------------------------------------------

          this.calculateStatistics();


          // ------------------------------------------
          // STOP LOADING
          // ------------------------------------------

          this.loading = false;


          // ------------------------------------------
          // UPDATE UI
          // ------------------------------------------

          this.cdr.detectChanges();


          // ------------------------------------------
          // FINAL DEBUG
          // ------------------------------------------

          console.log(
            '========== DASHBOARD STATISTICS =========='
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
            'Picked Up Donations:',
            this.pickedUpDonations
          );

          console.log(
            'Completed Donations:',
            this.completedDonations
          );

          console.log(
            'Cancelled Donations:',
            this.cancelledDonations
          );

          console.log(
            'People to be served:',
            this.peopleServed
          );

          console.log(
            'People actually served:',
            this.completedPeopleServed
          );

          console.log(
            'Food:',
            this.totalFood
          );

          console.log(
            'NGOs helped:',
            this.ngosHelped
          );

          console.log(
            '=========================================='
          );

        },


        // ============================================
        // ERROR
        // ============================================

        error: (error: any) => {

          console.error(
            'Donor dashboard error:',
            error
          );


          this.donations = [];


          this.resetStatistics();


          this.loading = false;


          // ------------------------------------------
          // 401
          // ------------------------------------------

          if (
            error?.status === 401
          ) {

            this.errorMessage =
              'Your session has expired. Please login again.';
          }


          // ------------------------------------------
          // 403
          // ------------------------------------------

          else if (
            error?.status === 403
          ) {

            this.errorMessage =
              'Only donor accounts can view this dashboard.';
          }


          // ------------------------------------------
          // BACKEND NOT AVAILABLE
          // ------------------------------------------

          else if (
            error?.status === 0
          ) {

            this.errorMessage =
              'Cannot connect to MealMitra backend. Make sure the backend server is running.';
          }


          // ------------------------------------------
          // OTHER ERROR
          // ------------------------------------------

          else {

            this.errorMessage =
              error?.error?.message ||
              'Unable to load your donations. Please try again.';
          }


          this.cdr.detectChanges();

        }

      });

  }


  // ==================================================
  // NORMALIZE STATUS
  // ==================================================

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


  // ==================================================
  // CALCULATE STATISTICS
  // ==================================================

  calculateStatistics(): void {

    // -----------------------------------------------
    // RESET FIRST
    // -----------------------------------------------

    this.resetStatistics();


    // -----------------------------------------------
    // TOTAL DONATIONS
    // -----------------------------------------------

    /*
     * Total donations created by the donor.
     *
     * Cancelled donations are excluded because they
     * are no longer active/successful donations.
     */

    this.totalDonations =
      this.donations.filter(
        (donation: any) => {

          const status =
            this.normalizeStatus(
              donation?.status
            );

          return status !== 'cancelled';

        }
      ).length;


    // -----------------------------------------------
    // PENDING DONATIONS
    // -----------------------------------------------

    this.pendingDonations =
      this.donations.filter(
        (donation: any) => {

          const status =
            this.normalizeStatus(
              donation?.status
            );

          return status === 'pending';

        }
      ).length;


    // -----------------------------------------------
    // ACCEPTED DONATIONS
    // -----------------------------------------------

    /*
     * IMPORTANT:
     *
     * Once an NGO accepts a donation, it remains an
     * accepted donation throughout the rest of the
     * donation lifecycle.
     *
     * Lifecycle:
     *
     * pending
     *    ↓
     * accepted
     *    ↓
     * picked_up
     *    ↓
     * completed
     *
     * Therefore:
     *
     * accepted       → count
     * picked_up      → count
     * completed      → count
     *
     * This fixes the dashboard showing:
     *
     * Accepted Donations = 0
     *
     * when a donation has already been completed.
     */

    this.acceptedDonations =
      this.donations.filter(
        (donation: any) => {

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


    // -----------------------------------------------
    // PICKED UP DONATIONS
    // -----------------------------------------------

    this.pickedUpDonations =
      this.donations.filter(
        (donation: any) => {

          const status =
            this.normalizeStatus(
              donation?.status
            );

          return status === 'picked_up';

        }
      ).length;


    // -----------------------------------------------
    // COMPLETED DONATIONS
    // -----------------------------------------------

    this.completedDonations =
      this.donations.filter(
        (donation: any) => {

          const status =
            this.normalizeStatus(
              donation?.status
            );

          return status === 'completed';

        }
      ).length;


    // -----------------------------------------------
    // CANCELLED DONATIONS
    // -----------------------------------------------

    this.cancelledDonations =
      this.donations.filter(
        (donation: any) => {

          const status =
            this.normalizeStatus(
              donation?.status
            );

          return status === 'cancelled';

        }
      ).length;


    // -----------------------------------------------
    // PEOPLE TO BE SERVED
    // -----------------------------------------------

    /*
     * All non-cancelled donations contribute to the
     * potential number of people that can be served.
     */

    this.peopleServed =
      this.donations

        .filter(
          (donation: any) => {

            const status =
              this.normalizeStatus(
                donation?.status
              );

            return status !== 'cancelled';

          }
        )

        .reduce(
          (
            total: number,
            donation: any
          ) => {

            return (
              total +
              Number(
                donation?.servings || 0
              )
            );

          },
          0
        );


    // -----------------------------------------------
    // COMPLETED PEOPLE SERVED
    // -----------------------------------------------

    /*
     * Only completed donations count as people
     * actually served.
     */

    this.completedPeopleServed =
      this.donations

        .filter(
          (donation: any) => {

            const status =
              this.normalizeStatus(
                donation?.status
              );

            return status === 'completed';

          }
        )

        .reduce(
          (
            total: number,
            donation: any
          ) => {

            return (
              total +
              Number(
                donation?.servings || 0
              )
            );

          },
          0
        );


    // -----------------------------------------------
    // TOTAL FOOD IN KG
    // -----------------------------------------------

    /*
     * Only donations whose quantityUnit is kg are
     * included.
     *
     * Example:
     *
     * 35 kg + 10 packets
     *
     * should NOT become 45 kg.
     */

    this.totalFood =
      this.donations

        .filter(
          (donation: any) => {

            const status =
              this.normalizeStatus(
                donation?.status
              );


            const unit =
              String(
                donation?.quantityUnit || ''
              )
                .trim()
                .toLowerCase();


            return (
              status !== 'cancelled' &&
              unit === 'kg'
            );

          }
        )

        .reduce(
          (
            total: number,
            donation: any
          ) => {

            return (
              total +
              Number(
                donation?.quantity || 0
              )
            );

          },
          0
        );


    // -----------------------------------------------
    // UNIQUE NGOS HELPED
    // -----------------------------------------------

    const ngoIds =
      new Set<string>();


    this.donations.forEach(
      (donation: any) => {

        const status =
          this.normalizeStatus(
            donation?.status
          );


        // Cancelled donations do not count.
        if (
          status === 'cancelled'
        ) {

          return;

        }


        const acceptedBy =
          donation?.acceptedBy;


        // No NGO accepted the donation yet.
        if (!acceptedBy) {

          return;

        }


        let ngoId: any;


        /*
         * acceptedBy may be:
         *
         * 1. ObjectId/string
         *
         * OR
         *
         * 2. Populated User object
         */

        if (
          typeof acceptedBy ===
          'object'
        ) {

          ngoId =
            acceptedBy?._id ||
            acceptedBy?.id;

        }

        else {

          ngoId =
            acceptedBy;

        }


        if (ngoId) {

          ngoIds.add(
            String(ngoId)
          );

        }

      }
    );


    this.ngosHelped =
      ngoIds.size;

  }


  // ==================================================
  // RESET STATISTICS
  // ==================================================

  resetStatistics(): void {

    this.totalDonations = 0;

    this.pendingDonations = 0;

    this.acceptedDonations = 0;

    this.pickedUpDonations = 0;

    this.completedDonations = 0;

    this.cancelledDonations = 0;

    this.peopleServed = 0;

    this.completedPeopleServed = 0;

    this.totalFood = 0;

    this.ngosHelped = 0;

  }


  // ==================================================
  // RECENT DONATIONS
  // ==================================================

  getRecentDonations(): any[] {

    return this.donations.slice(
      0,
      3
    );

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


  // ==================================================
  // FOOD ICON
  // ==================================================

  getFoodIcon(
    foodType: string
  ): string {

    switch (foodType) {

      case 'Cooked Food':

        return '🍚';


      case 'Packaged Food':

        return '🍱';


      case 'Fruits & Vegetables':

        return '🥗';


      case 'Bakery':

        return '🥐';


      case 'Other':

        return '🍲';


      default:

        return '🍲';

    }

  }


  // ==================================================
  // STATUS LABEL
  // ==================================================

  getStatusLabel(
    status: string
  ): string {

    const normalizedStatus =
      this.normalizeStatus(
        status
      );


    switch (normalizedStatus) {

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

        return 'Unknown';

    }

  }


  // ==================================================
  // STATUS CSS CLASS
  // ==================================================

  getStatusClass(
    status: string
  ): string {

    const normalizedStatus =
      this.normalizeStatus(
        status
      );


    switch (normalizedStatus) {

      case 'accepted':

        return 'accepted';


      case 'picked_up':

        return 'picked-up';


      case 'completed':

        return 'completed';


      case 'cancelled':

        return 'cancelled';


      case 'pending':

      default:

        return 'pending';

    }

  }


  // ==================================================
  // FORMAT DATE
  // ==================================================

  formatDate(
    date: string
  ): string {

    if (!date) {

      return 'Not available';

    }


    const value =
      new Date(date);


    if (
      Number.isNaN(
        value.getTime()
      )
    ) {

      return 'Not available';

    }


    return value.toLocaleString(
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


  // ==================================================
  // REFRESH
  // ==================================================

  refresh(): void {

    this.loadDonations();

  }


  // ==================================================
  // CREATE DONATION
  // ==================================================

  createDonation(): void {

    this.router.navigate([
      '/create-donation'
    ]);

  }


  // ==================================================
  // VIEW DONATIONS
  // ==================================================

  viewDonations(): void {

    this.router.navigate([
      '/my-donations'
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