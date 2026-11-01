import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { Router } from '@angular/router';

import { DonationService } from '../../services/donation.service';
import { AuthService } from '../../services/auth.service';
import {
  NgoSupportService,
  SupportMessage
} from '../../services/ngo-support.service';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-ngo-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ngo-dashboard.html',
  styleUrl: './ngo-dashboard.css'
})
export class NgoDashboard implements OnInit, OnDestroy {

  // =========================================================
  // USER / NGO PROFILE
  // =========================================================

  ngoName = '';
  ngoEmail = '';
  ngoPhone = '';
  ngoAbout = '';
  ngoAddress = '';

  numberOfPeople = 0;

  supportedFoodTypes: string[] = [];

  supportedFoodPreferences: string[] = [];

  savingFoodSupport = false;

  foodSupportMessage = '';

  foodSupportError = '';

  readonly foodTypeOptions = [
    'Cooked Food',
    'Packaged Food',
    'Fruits & Vegetables',
    'Bakery',
    'Other'
  ];

  readonly foodPreferenceOptions = [
    'Vegetarian',
    'Non-Vegetarian',
    'Mixed'
  ];

  user: any = null;

  // NGO location
  ngoLatitude: number | null = null;
  ngoLongitude: number | null = null;


  // =========================================================
  // DONATIONS
  // =========================================================

  availableDonations: any[] = [];

  acceptedDonations: any[] = [];


  // Compatibility with existing HTML
  get donations(): any[] {
    return this.availableDonations;
  }


  // =========================================================
  // UI STATE
  // =========================================================

  activeSection = 'dashboard';

  loading = false;

  loadingAccepted = false;

  acceptingId = '';

  actionLoadingId = '';

  errorMessage = '';

  successMessage = '';

  supportAssistantOpen = false;
  supportAssistantSending = false;
  supportAssistantInput = '';
  supportAssistantError = '';
  supportAssistantMessages: SupportMessage[] = [
    {
      role: 'model',
      text: 'Hi! I’m the MealMitra AI assistant. Ask me about finding donations, managing your NGO profile, or using the dashboard.'
    }
  ];

  private isBrowser = false;
  private cancellationCountdownTimer:
    ReturnType<typeof setInterval> | null = null;
  private readonly donorMapUrls = new WeakMap<
    object,
    { url: string; safeUrl: SafeResourceUrl }
  >();


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private donationService: DonationService,
    private authService: AuthService,
    private ngoSupportService: NgoSupportService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {

    this.isBrowser =
      isPlatformBrowser(
        this.platformId
      );
  }


  // =========================================================
  // INITIALIZATION
  // =========================================================

  ngOnInit(): void {

    // -------------------------------------------------------
    // Browser check
    // -------------------------------------------------------

    if (!this.isBrowser) {
      return;
    }


    // -------------------------------------------------------
    // Get logged-in user
    // -------------------------------------------------------

    const currentUser =
      this.authService.getCurrentUser();


    console.log(
      'CURRENT LOGGED-IN USER:',
      currentUser
    );


    // -------------------------------------------------------
    // NGO-only access
    // -------------------------------------------------------

    if (
      !currentUser ||
      currentUser.role !== 'ngo'
    ) {

      this.router.navigate([
        '/login'
      ]);

      return;
    }


    // -------------------------------------------------------
    // Store complete user object
    // -------------------------------------------------------

    this.user =
      currentUser;


    // -------------------------------------------------------
    // Load NGO profile
    // -------------------------------------------------------

    this.loadNgoProfile();


    // -------------------------------------------------------
    // Load dashboard data
    // -------------------------------------------------------

    this.loadAvailableDonations();

    this.loadAcceptedDonations();

    this.cancellationCountdownTimer =
      setInterval(() => {
        this.cdr.detectChanges();
      }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cancellationCountdownTimer) {
      clearInterval(this.cancellationCountdownTimer);
      this.cancellationCountdownTimer = null;
    }
  }


  // =========================================================
  // NGO PROFILE
  // =========================================================

  loadNgoProfile(): void {

    this.authService.getProfile().subscribe({
      next: (response: any) => {
        const currentUser = response?.user;

        if (!currentUser || currentUser.role !== 'ngo') {
          this.errorMessage = 'Unable to load NGO profile data.';
          this.cdr.detectChanges();
          return;
        }

        this.setNgoProfile(currentUser);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('NGO profile error:', error);
        this.errorMessage =
          error?.error?.message ||
          'Failed to load your organization profile.';
        this.cdr.detectChanges();
      }
    });
  }

  private setNgoProfile(currentUser: any): void {
    // -------------------------------------------------------
    // Store complete user object
    // -------------------------------------------------------

    this.user =
      currentUser;

    this.supportedFoodTypes =
      Array.isArray(currentUser.supportedFoodTypes)
        ? [...currentUser.supportedFoodTypes]
        : [...this.foodTypeOptions];
    this.supportedFoodPreferences =
      Array.isArray(currentUser.supportedFoodPreferences)
        ? [...currentUser.supportedFoodPreferences]
        : [...this.foodPreferenceOptions];


    // -------------------------------------------------------
    // ORGANIZATION NAME
    // -------------------------------------------------------

    this.ngoName =
      currentUser.organizationName ||
      currentUser.ngoName ||
      currentUser.organization_name ||
      currentUser.name ||
      currentUser.donorName ||
      'NGO';


    // -------------------------------------------------------
    // EMAIL
    // -------------------------------------------------------

    this.ngoEmail =
      currentUser.organizationEmail ||
      currentUser.ngoEmail ||
      currentUser.organization_email ||
      currentUser.email ||
      '';


    // -------------------------------------------------------
    // PHONE
    // -------------------------------------------------------

    this.ngoPhone =
      currentUser.organizationPhone ||
      currentUser.ngoPhone ||
      currentUser.organization_phone ||
      currentUser.phone ||
      '';


    // -------------------------------------------------------
    // ABOUT
    // -------------------------------------------------------

    this.ngoAbout =
      currentUser.organizationAbout ||
      currentUser.ngoAbout ||
      currentUser.organization_about ||
      currentUser.about ||
      currentUser.description ||
      '';


    // -------------------------------------------------------
    // ADDRESS
    // -------------------------------------------------------

    this.ngoAddress =
      currentUser.address ||
      currentUser.ngoAddress ||
      currentUser.organizationAddress ||
      currentUser.organization_address ||
      '';


    // -------------------------------------------------------
    // NUMBER OF PEOPLE
    // -------------------------------------------------------

    const peopleValue =
      currentUser.numberOfPeople ??
      currentUser.peopleToServe ??
      currentUser.organizationCapacity ??
      currentUser.capacity ??
      0;


    this.numberOfPeople =
      Number(peopleValue);


    if (
      !Number.isFinite(
        this.numberOfPeople
      )
    ) {

      this.numberOfPeople =
        0;
    }

    // -------------------------------------------------------
    // LATITUDE
    // -------------------------------------------------------

    const latitudeValue =
      currentUser.latitude ??
      currentUser.lat ??
      currentUser.location?.latitude ??
      currentUser.location?.coordinates?.[1] ??
      null;


    const latitude =
      Number(latitudeValue);


    if (
      latitudeValue !== null &&
      latitudeValue !== undefined &&
      latitudeValue !== '' &&
      Number.isFinite(latitude)
    ) {

      this.ngoLatitude =
        latitude;

    } else {

      this.ngoLatitude =
        null;
    }


    // -------------------------------------------------------
    // LONGITUDE
    // -------------------------------------------------------

    const longitudeValue =
      currentUser.longitude ??
      currentUser.lng ??
      currentUser.location?.longitude ??
      currentUser.location?.coordinates?.[0] ??
      null;


    const longitude =
      Number(longitudeValue);


    if (
      longitudeValue !== null &&
      longitudeValue !== undefined &&
      longitudeValue !== '' &&
      Number.isFinite(longitude)
    ) {

      this.ngoLongitude =
        longitude;

    } else {

      this.ngoLongitude =
        null;
    }


    // -------------------------------------------------------
    // Normalize user object
    // -------------------------------------------------------

    this.user = {
      ...currentUser,

      organizationName:
        this.ngoName,

      organizationEmail:
        this.ngoEmail,

      organizationPhone:
        this.ngoPhone,

      organizationAbout:
        this.ngoAbout,

      address:
        this.ngoAddress,

      numberOfPeople:
        this.numberOfPeople,

      latitude:
        this.ngoLatitude,

      longitude:
        this.ngoLongitude
    };


    // -------------------------------------------------------
    // Debug information
    // -------------------------------------------------------

    console.log(
      'NORMALIZED NGO PROFILE:',
      {
        organizationName:
          this.ngoName,

        organizationEmail:
          this.ngoEmail,

        organizationPhone:
          this.ngoPhone,

        organizationAbout:
          this.ngoAbout,

        address:
          this.ngoAddress,

        numberOfPeople:
          this.numberOfPeople,

        latitude:
          this.ngoLatitude,

        longitude:
          this.ngoLongitude
      }
    );


    this.cdr.detectChanges();
  }

  toggleSupportedFoodType(foodType: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    this.supportedFoodTypes = event.target.checked
      ? [...this.supportedFoodTypes, foodType]
      : this.supportedFoodTypes.filter((value) => value !== foodType);
  }

  toggleSupportedFoodPreference(preference: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    this.supportedFoodPreferences = event.target.checked
      ? [...this.supportedFoodPreferences, preference]
      : this.supportedFoodPreferences.filter((value) => value !== preference);
  }

  saveFoodSupport(): void {
    this.foodSupportMessage = '';
    this.foodSupportError = '';

    if (
      this.savingFoodSupport ||
      !this.supportedFoodTypes.length ||
      !this.supportedFoodPreferences.length
    ) {
      this.foodSupportError =
        'Select at least one food type and one dietary preference.';
      return;
    }

    this.savingFoodSupport = true;
    this.authService
      .updateFoodSupport(
        this.supportedFoodTypes,
        this.supportedFoodPreferences
      )
      .subscribe({
        next: (response: any) => {
          const user = response?.user;
          if (!response?.success || !user) {
            this.foodSupportError =
              response?.message || 'Failed to update food preferences.';
          } else {
            this.supportedFoodTypes =
              [...(user.supportedFoodTypes || [])];
            this.supportedFoodPreferences =
              [...(user.supportedFoodPreferences || [])];
            this.foodSupportMessage = 'Food matching preferences saved.';
          }

          this.savingFoodSupport = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Save food matching preferences error:', error);
          this.foodSupportError =
            error?.error?.message ||
            'Failed to save food matching preferences.';
          this.savingFoodSupport = false;
          this.cdr.detectChanges();
        }
      });
  }


  // =========================================================
  // NGO LOCATION
  // =========================================================

  /**
   * Returns true when NGO coordinates are available.
   */
  get hasLocation(): boolean {

    return (
      this.ngoLatitude !== null &&
      this.ngoLongitude !== null &&
      Number.isFinite(this.ngoLatitude) &&
      Number.isFinite(this.ngoLongitude)
    );
  }


  /**
   * Google Maps URL using NGO coordinates.
   */
  get mapUrl(): string {

    if (!this.hasLocation) {
      return '#';
    }


    return (
      'https://www.google.com/maps?q=' +
      this.ngoLatitude +
      ',' +
      this.ngoLongitude
    );
  }


  // =========================================================
  // DONOR MAP
  // =========================================================

  /**
   * Returns a safe Google Maps embed URL for
   * the donor's pickup location.
   *
   * IMPORTANT:
   * These coordinates come from the donation,
   * not from the NGO profile.
   */
  getDonorMapUrl(
    donation: any
  ): SafeResourceUrl | null {

    const latitude =
      Number(
        donation?.latitude
      );

    const longitude =
      Number(
        donation?.longitude
      );


    // Check whether coordinates are valid
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude === 0 ||
      longitude === 0
    ) {

      return null;
    }


    // Google Maps embed URL
    const url =
      'https://www.google.com/maps?q=' +
      latitude +
      ',' +
      longitude +
      '&output=embed';

    if (typeof donation === 'object' && donation !== null) {
      const cachedMap = this.donorMapUrls.get(donation);

      if (cachedMap?.url === url) {
        return cachedMap.safeUrl;
      }

      const safeUrl = this.sanitizer
        .bypassSecurityTrustResourceUrl(url);

      this.donorMapUrls.set(donation, { url, safeUrl });
      return safeUrl;
    }

    return this.sanitizer
      .bypassSecurityTrustResourceUrl(
        url
      );
  }


  /**
   * Returns normal Google Maps URL for
   * opening the donor location in a new tab.
   */
  getDonorGoogleMapsUrl(
    donation: any
  ): string {

    const latitude =
      Number(
        donation?.latitude
      );

    const longitude =
      Number(
        donation?.longitude
      );


    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      return '#';
    }


    return (
      'https://www.google.com/maps?q=' +
      latitude +
      ',' +
      longitude
    );
  }


  /**
   * Checks whether donor coordinates are available.
   */
  hasDonorLocation(
    donation: any
  ): boolean {

    const latitude =
      Number(
        donation?.latitude
      );

    const longitude =
      Number(
        donation?.longitude
      );


    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude !== 0 &&
      longitude !== 0
    );
  }


  // =========================================================
  // LOAD AVAILABLE DONATIONS
  // =========================================================

  loadAvailableDonations(): void {

    this.loading =
      true;

    this.errorMessage =
      '';


    this.donationService
      .getAvailableDonations()
      .subscribe({

        next: (response: any) => {

          console.log(
            'AVAILABLE DONATIONS:',
            response
          );


          this.availableDonations =
            Array.isArray(
              response?.donations
            )
              ? response.donations
              : [];


          this.loading =
            false;


          this.cdr.detectChanges();
        },


        error: (error: any) => {

          console.error(
            'Available donations error:',
            error
          );


          this.availableDonations =
            [];

          this.loading =
            false;


          this.errorMessage =
            error?.error?.message ||
            'Failed to load available donations.';


          this.cdr.detectChanges();
        }

      });
  }


  // =========================================================
  // TEMPLATE COMPATIBILITY
  // =========================================================

  loadDonations(): void {

    this.loadAvailableDonations();
  }


  // =========================================================
  // LOAD ACCEPTED DONATIONS
  // =========================================================

  loadAcceptedDonations(): void {

    this.loadingAccepted =
      true;


    this.donationService
      .getAcceptedDonations()
      .subscribe({

        next: (response: any) => {

          console.log(
            'ACCEPTED DONATIONS:',
            response
          );


          this.acceptedDonations =
            Array.isArray(
              response?.donations
            )
              ? response.donations
              : [];


          this.loadingAccepted =
            false;


          this.cdr.detectChanges();
        },


        error: (error: any) => {

          console.error(
            'Accepted donations error:',
            error
          );


          this.acceptedDonations =
            [];

          this.loadingAccepted =
            false;


          this.errorMessage =
            error?.error?.message ||
            'Failed to load your collections.';


          this.cdr.detectChanges();
        }

      });
  }


  // =========================================================
  // ACCEPT DONATION
  // =========================================================

  acceptDonation(
    donationId: string
  ): void {

    if (
      !donationId ||
      this.acceptingId
    ) {

      return;
    }


    this.acceptingId =
      donationId;

    this.errorMessage =
      '';

    this.successMessage =
      '';


    this.donationService
      .acceptDonation(
        donationId
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'ACCEPT RESPONSE:',
            response
          );


          this.acceptingId =
            '';


          this.successMessage =
            'Donation accepted successfully.';


          this.loadAvailableDonations();

          this.loadAcceptedDonations();


          this.cdr.detectChanges();
        },


        error: (error: any) => {

          console.error(
            'Accept donation error:',
            error
          );


          this.acceptingId =
            '';


          this.errorMessage =
            error?.error?.message ||
            'This donation is no longer available.';


          this.loadAvailableDonations();


          this.cdr.detectChanges();
        }

      });
  }


  // =========================================================
  // CANCEL NGO ACCEPTANCE
  // within 2 minutes of acceptance
  // =========================================================

  cancelAcceptedDonation(
    donation: any
  ): void {

    if (
      !donation?._id ||
      !this.isBrowser
    ) {

      return;
    }


    const confirmed =
      window.confirm(
        'Cancel this accepted donation? It will become available for other NGOs again.'
      );


    if (!confirmed) {
      return;
    }


    this.actionLoadingId =
      donation._id;

    this.errorMessage =
      '';

    this.successMessage =
      '';


    this.donationService
      .cancelAcceptedDonation(
        donation._id
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'CANCEL ACCEPTANCE RESPONSE:',
            response
          );


          this.actionLoadingId =
            '';

          this.successMessage =
            'Accepted donation cancelled successfully.';

          this.loadAvailableDonations();
          this.loadAcceptedDonations();

          this.cdr.detectChanges();
        },

        error: (error: any) => {

          console.error(
            'Cancel accepted donation error:',
            error
          );

          this.actionLoadingId =
            '';

          this.errorMessage =
            error?.error?.message ||
            'Failed to cancel this accepted donation.';

          this.cdr.detectChanges();
        }

      });
  }


  // =========================================================
  // PICKUP
  // =========================================================

  markDonationPickedUp(
    donation: any
  ): void {

    if (
      !donation?._id ||
      !this.isBrowser
    ) {

      return;
    }


    const confirmed =
      window.confirm(
        'Have you physically collected this food donation from the donor?'
      );


    if (!confirmed) {
      return;
    }


    this.actionLoadingId =
      donation._id;

    this.errorMessage =
      '';

    this.successMessage =
      '';


    this.donationService
      .markDonationPickedUp(
        donation._id
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'PICKUP RESPONSE:',
            response
          );


          this.actionLoadingId =
            '';


          this.successMessage =
            'Pickup confirmed successfully.';


          this.loadAcceptedDonations();


          this.cdr.detectChanges();
        },


        error: (error: any) => {

          console.error(
            'Pickup error:',
            error
          );


          this.actionLoadingId =
            '';


          this.errorMessage =
            error?.error?.message ||
            'Failed to confirm pickup.';


          this.cdr.detectChanges();
        }

      });
  }


  // =========================================================
  // COMPLETE DONATION
  // =========================================================

  markDonationCompleted(
    donation: any
  ): void {

    if (
      !donation?._id ||
      !this.isBrowser
    ) {

      return;
    }


    const confirmed =
      window.confirm(
        'Confirm that this food donation has been successfully delivered to the beneficiaries?'
      );


    if (!confirmed) {
      return;
    }


    this.actionLoadingId =
      donation._id;

    this.errorMessage =
      '';

    this.successMessage =
      '';


    this.donationService
      .markDonationCompleted(
        donation._id
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'COMPLETE RESPONSE:',
            response
          );


          this.actionLoadingId =
            '';


          this.successMessage =
            'Donation completed successfully.';


          this.loadAcceptedDonations();


          this.cdr.detectChanges();
        },


        error: (error: any) => {

          console.error(
            'Complete donation error:',
            error
          );


          this.actionLoadingId =
            '';


          this.errorMessage =
            error?.error?.message ||
            'Failed to complete donation.';


          this.cdr.detectChanges();
        }

      });
  }


  // =========================================================
  // COMPATIBILITY METHODS
  // =========================================================

  markPickedUp(
    donation: any
  ): void {

    this.markDonationPickedUp(
      donation
    );
  }


  markCompleted(
    donation: any
  ): void {

    this.markDonationCompleted(
      donation
    );
  }


  // =========================================================
  // STATISTICS
  // =========================================================

  get availableDonationCount(): number {

    return this.availableDonations.length;
  }


  get urgentDonations(): number {

    return this.availableDonations.filter(
      donation =>
        this.isUrgent(
          donation
        )
    ).length;
  }


  get peopleToServe(): number {

    return this.numberOfPeople;
  }


  get totalAvailableQuantity(): number {

    return this.availableDonations.reduce(
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
  }


  get activeCollections(): number {

    return this.acceptedDonations.filter(
      donation =>
        donation?.status === 'accepted' ||
        donation?.status === 'picked_up'
    ).length;
  }


  get completedCollections(): number {

    return this.acceptedDonations.filter(
      donation =>
        donation?.status === 'completed'
    ).length;
  }


  // =========================================================
  // URGENT DONATION
  // =========================================================

  isUrgent(
    donation: any
  ): boolean {

    if (
      !donation?.pickupDeadline
    ) {

      return false;
    }


    const deadline =
      new Date(
        donation.pickupDeadline
      ).getTime();


    if (
      !Number.isFinite(
        deadline
      )
    ) {

      return false;
    }


    const remaining =
      deadline -
      Date.now();


    const twoHours =
      2 *
      60 *
      60 *
      1000;


    return (
      remaining > 0 &&
      remaining <= twoHours
    );
  }


  // =========================================================
  // TIME REMAINING
  // =========================================================

  getTimeRemaining(
    donation: any
  ): string {

    if (
      !donation?.pickupDeadline
    ) {

      return 'No deadline';
    }


    const deadline =
      new Date(
        donation.pickupDeadline
      ).getTime();


    if (
      !Number.isFinite(
        deadline
      )
    ) {

      return 'Invalid deadline';
    }


    const difference =
      deadline -
      Date.now();


    if (
      difference <= 0
    ) {

      return 'Expired';
    }


    const totalMinutes =
      Math.floor(
        difference /
        60000
      );


    const days =
      Math.floor(
        totalMinutes /
        1440
      );


    const hours =
      Math.floor(
        (totalMinutes % 1440) /
        60
      );


    const minutes =
      totalMinutes %
      60;


    if (
      days > 0
    ) {

      return `${days}d ${hours}h left`;
    }


    if (
      hours > 0
    ) {

      return `${hours}h ${minutes}m left`;
    }


    return `${minutes}m left`;
  }


  // =========================================================
  // STATUS
  // =========================================================

  isAccepted(
    donation: any
  ): boolean {

    return (
      donation?.status ===
      'accepted'
    );
  }


  isPickedUp(
    donation: any
  ): boolean {

    return (
      donation?.status ===
      'picked_up'
    );
  }


  isCompleted(
    donation: any
  ): boolean {

    return (
      donation?.status ===
      'completed'
    );
  }


  canCancelAcceptedDonation(
    donation: any
  ): boolean {

    if (
      donation?.status !== 'accepted'
    ) {

      return false;
    }


    const acceptedAt =
      donation?.acceptedAt
        ? new Date(
            donation.acceptedAt
          )
        : null;


    if (
      !acceptedAt ||
      Number.isNaN(
        acceptedAt.getTime()
      )
    ) {

      return false;
    }


    const cutoffMs =
      2 * 60 * 1000;

    return (
      Date.now() - acceptedAt.getTime() >= 0 &&
      Date.now() - acceptedAt.getTime() <= cutoffMs
    );
  }

  getCancellationCountdown(donation: any): string {
    const acceptedAt = donation?.acceptedAt
      ? new Date(donation.acceptedAt)
      : null;

    if (!acceptedAt || Number.isNaN(acceptedAt.getTime())) {
      return '00:00';
    }

    const remainingSeconds = Math.max(
      0,
      Math.ceil(
        (acceptedAt.getTime() + 2 * 60 * 1000 - Date.now()) / 1000
      )
    );
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }


  getStatusText(
    donation: any
  ): string {

    switch (
      donation?.status
    ) {

      case 'accepted':
        return 'Accepted';

      case 'picked_up':
        return 'Picked Up';

      case 'completed':
        return 'Completed';

      case 'cancelled':
        return 'Cancelled';

      default:
        return 'Pending';
    }
  }


  getStatusClass(
    donation: any
  ): string {

    return (
      donation?.status ||
      'pending'
    );
  }


  // =========================================================
  // FOOD PREFERENCE
  // =========================================================

  getFoodPreferenceClass(
    preference: string
  ): string {

    if (!preference) {
      return '';
    }


    switch (
      preference
        .toLowerCase()
        .trim()
    ) {

      case 'vegetarian':
        return 'veg';

      case 'non-vegetarian':
        return 'non-veg';

      case 'mixed':
        return 'mixed';

      default:
        return '';
    }
  }


  // =========================================================
  // DONOR
  // =========================================================

  getDonorName(
    donation: any
  ): string {

    return (
      donation?.donorId?.donorName ||
      donation?.donorId?.name ||
      donation?.donorName ||
      'Donor'
    );
  }


  getDonorPhone(
    donation: any
  ): string {

    return (
      donation?.donorId?.donorPhone ||
      donation?.donorId?.phone ||
      donation?.donorPhone ||
      ''
    );
  }


  // =========================================================
  // DATE
  // =========================================================

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


    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }


  // =========================================================
  // DATE + TIME
  // =========================================================

  formatDateTime(
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


  // =========================================================
  // NAVIGATION
  // =========================================================

  showSection(
    section: string
  ): void {

    this.activeSection =
      section;


    this.errorMessage =
      '';

    this.successMessage =
      '';


    // -------------------------------------------------------
    // Available donations
    // -------------------------------------------------------

    if (
      section ===
      'available'
    ) {

      this.loadAvailableDonations();
    }


    // -------------------------------------------------------
    // Accepted donations
    // -------------------------------------------------------

    if (
      section ===
      'accepted'
    ) {

      this.loadAcceptedDonations();
    }


    // -------------------------------------------------------
    // Profile
    // -------------------------------------------------------

    if (
      section ===
      'profile'
    ) {

      this.loadNgoProfile();
    }
  }


  setSection(
    section: string
  ): void {

    this.showSection(
      section
    );
  }


  // =========================================================
  // REFRESH
  // =========================================================

  refreshDashboard(): void {

    this.errorMessage =
      '';

    this.successMessage =
      '';


    this.loadNgoProfile();

    this.loadAvailableDonations();

    this.loadAcceptedDonations();
  }


  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {

    this.authService.logout();


    this.router.navigate([
      '/login'
    ]);
  }

  toggleSupportAssistant(): void {
    this.supportAssistantOpen = !this.supportAssistantOpen;
    this.supportAssistantError = '';
  }

  handleSupportInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendSupportMessage();
    }
  }

  sendSupportMessage(): void {
    const text = this.supportAssistantInput.trim();
    if (!text || this.supportAssistantSending) {
      return;
    }

    if (text.length > 2000) {
      this.supportAssistantError =
        'Please keep your message under 2,000 characters.';
      return;
    }

    this.supportAssistantMessages.push({ role: 'user', text });
    this.supportAssistantInput = '';
    this.supportAssistantError = '';
    this.supportAssistantSending = true;

    const conversation = this.supportAssistantMessages
      .slice(1)
      .slice(-12);
    if (conversation[0]?.role === 'model') {
      conversation.shift();
    }

    this.ngoSupportService
      .sendMessage(conversation)
      .pipe(finalize(() => {
        this.supportAssistantSending = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response) => {
          if (!response?.answer?.trim()) {
            this.supportAssistantError =
              'The assistant returned an empty reply. Please try again.';
          } else {
            this.supportAssistantMessages.push({
              role: 'model',
              text: response.answer.trim()
            });
          }

          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.supportAssistantMessages.pop();
          this.supportAssistantInput = text;
          this.supportAssistantError = error?.name === 'TimeoutError'
            ? 'The assistant is taking too long to respond. Please try again.'
            : error?.status === 0
              ? 'Cannot reach the MealMitra server. Check that the backend is running, then try again.'
              : error?.error?.message ||
                'The assistant could not respond. Please try again.';
          this.cdr.detectChanges();
        }
      });
  }

}