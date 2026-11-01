import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  OnDestroy
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterLink
} from '@angular/router';

import { DonationService } from '../../services/donation.service';


@Component({
  selector: 'app-create-donation',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './create-donation.html',

  styleUrl: './create-donation.css'
})


export class CreateDonation implements OnDestroy {


  // =====================================================
  // MAP HTML ELEMENT
  // =====================================================

  @ViewChild('pickupMap')
  pickupMapElement?: ElementRef<HTMLDivElement>;


  // =====================================================
  // DONATION DATA
  // =====================================================

  donation = {

    foodName: '',

    foodType: '',

    foodPreference: '',

    quantity: 0,

    quantityUnit: 'kg',

    servings: 0,

    description: '',

    pickupAddress: '',

    latitude: 0,

    longitude: 0,

    pickupDeadline: ''

  };


  // =====================================================
  // UI STATE
  // =====================================================

  loading = false;

  locationLoading = false;

  locationCaptured = false;

  locationMessage = '';

  errorMessage = '';

  successMessage = '';


  // =====================================================
  // MAP
  // =====================================================

  private map: any = null;

  private marker: any = null;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private donationService: DonationService,

    private router: Router,

    private cdr: ChangeDetectorRef,

    @Inject(PLATFORM_ID)
    private platformId: object
  ) {}


  // =====================================================
  // CAPTURE CURRENT LOCATION
  // =====================================================

  captureLocation(): void {

    // Only run location code in browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }


    this.locationMessage = '';

    // Keep an already-rendered map mounted while refreshing location.
    // Setting locationCaptured=false here removes the map DOM element,
    // leaving Leaflet's existing map instance attached to a stale container.
    this.locationLoading = true;


    // Check browser geolocation support
    if (!navigator.geolocation) {

      this.locationLoading = false;

      this.locationMessage =
        'Geolocation is not supported by your browser.';

      return;
    }


    navigator.geolocation.getCurrentPosition(

      (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;


        // -----------------------------------------------
        // SAVE LOCATION
        // -----------------------------------------------

        this.donation.latitude =
          latitude;

        this.donation.longitude =
          longitude;


        // -----------------------------------------------
        // UPDATE UI
        // -----------------------------------------------

        this.locationLoading = false;

        this.locationCaptured = true;

        this.locationMessage =
          'Pickup location captured successfully.';


        console.log(
          'Donation Latitude:',
          latitude
        );

        console.log(
          'Donation Longitude:',
          longitude
        );


        // -----------------------------------------------
        // IMPORTANT
        // Let Angular render the @if block first
        // -----------------------------------------------

        this.cdr.detectChanges();


        // -----------------------------------------------
        // LOAD MAP AFTER DOM IS READY
        // -----------------------------------------------

        setTimeout(() => {

          this.showMap(
            latitude,
            longitude
          );

        }, 200);

      },


      (error) => {

        console.error(
          'Location error:',
          error
        );


        this.locationLoading = false;

        // Preserve the previous map if refreshing the location fails.
        switch (error.code) {

          case 1:

            this.locationMessage =
              'Location permission was denied. Please allow location access in your browser.';

            break;


          case 2:

            this.locationMessage =
              'Your location could not be determined. Please try again.';

            break;


          case 3:

            this.locationMessage =
              'Location request timed out. Please try again.';

            break;


          default:

            this.locationMessage =
              'Unable to get your location. Please try again.';
        }

      },


      {
        enableHighAccuracy: true,

        timeout: 15000,

        maximumAge: 0
      }

    );

  }


  // =====================================================
  // SHOW INTERACTIVE MAP
  // =====================================================

  private async showMap(
    latitude: number,
    longitude: number
  ): Promise<void> {


    // Don't execute during Angular SSR
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }


    try {

      // -----------------------------------------------
      // Wait for Angular DOM update
      // -----------------------------------------------

      await new Promise<void>((resolve) => {

        setTimeout(() => {

          resolve();

        }, 100);

      });


      // -----------------------------------------------
      // Get map container using ViewChild
      // -----------------------------------------------

      const container =
        this.pickupMapElement?.nativeElement;


      if (!container) {

        console.error(
          'Map container not found.'
        );

        return;
      }


      console.log(
        'Map container found:',
        container
      );


      // -----------------------------------------------
      // Import Leaflet
      // -----------------------------------------------

      const L =
        await import('leaflet');


      // -----------------------------------------------
      // If map already exists
      // -----------------------------------------------

      if (this.map) {

        this.map.setView(
          [
            latitude,
            longitude
          ],
          16
        );


        if (this.marker) {

          this.marker.setLatLng([
            latitude,
            longitude
          ]);

        }


        setTimeout(() => {

          this.map?.invalidateSize();

        }, 100);


        return;
      }


      // -----------------------------------------------
      // CREATE MAP
      // -----------------------------------------------

      this.map =
        L.map(container).setView(
          [
            latitude,
            longitude
          ],
          16
        );


      // -----------------------------------------------
      // OPEN STREET MAP
      // -----------------------------------------------

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {

          maxZoom: 19,

          attribution:
            '&copy; OpenStreetMap contributors'

        }

      ).addTo(this.map);


      // -----------------------------------------------
      // CREATE MARKER
      // -----------------------------------------------

      this.marker =
        L.marker([
          latitude,
          longitude
        ])

        .addTo(this.map)

        .bindPopup(
          '<b>Pickup Location</b><br>Your current location.'
        )

        .openPopup();


      // -----------------------------------------------
      // FIX MAP SIZE
      // -----------------------------------------------

      setTimeout(() => {

        this.map?.invalidateSize();

      }, 300);


      console.log(
        'Map loaded successfully.'
      );

    }


    catch (error) {

      console.error(
        'Unable to load map:',
        error
      );


      this.locationMessage =
        'Location captured, but the map could not be loaded.';

    }

  }


  // =====================================================
  // SUBMIT DONATION
  // =====================================================

  submitDonation(): void {

    this.errorMessage = '';

    this.successMessage = '';


    // ===================================================
    // FOOD NAME
    // ===================================================

    if (!this.donation.foodName.trim()) {

      this.errorMessage =
        'Please enter the food name.';

      return;
    }


    // ===================================================
    // FOOD TYPE
    // ===================================================

    if (!this.donation.foodType) {

      this.errorMessage =
        'Please select the food type.';

      return;
    }


    // ===================================================
    // FOOD PREFERENCE
    // ===================================================

    if (!this.donation.foodPreference) {

      this.errorMessage =
        'Please select the food preference.';

      return;
    }


    // ===================================================
    // QUANTITY
    // ===================================================

    if (
      !this.donation.quantity ||
      this.donation.quantity <= 0
    ) {

      this.errorMessage =
        'Please enter a valid food quantity.';

      return;
    }


    // ===================================================
    // SERVINGS
    // ===================================================

    if (
      !this.donation.servings ||
      this.donation.servings <= 0
    ) {

      this.errorMessage =
        'Please enter the number of servings.';

      return;
    }


    // ===================================================
    // PICKUP ADDRESS
    // ===================================================

    if (
      !this.donation.pickupAddress.trim()
    ) {

      this.errorMessage =
        'Please enter the pickup address.';

      return;
    }


    // ===================================================
    // PICKUP DEADLINE
    // ===================================================

    if (
      !this.donation.pickupDeadline
    ) {

      this.errorMessage =
        'Please select the pickup deadline.';

      return;
    }


    // ===================================================
    // DEADLINE VALIDATION
    // ===================================================

    const deadline =
      new Date(
        this.donation.pickupDeadline
      );


    if (
      isNaN(deadline.getTime()) ||
      deadline.getTime() <= Date.now()
    ) {

      this.errorMessage =
        'Pickup deadline must be a future date and time.';

      return;
    }


    // ===================================================
    // LOCATION VALIDATION
    // ===================================================

    if (
      this.donation.latitude === 0 ||
      this.donation.longitude === 0
    ) {

      this.errorMessage =
        'Please capture your current pickup location before creating the donation.';

      return;
    }


    // ===================================================
    // PREPARE DONATION DATA
    // ===================================================

    const donationData = {

      foodName:
        this.donation.foodName.trim(),


      foodType:
        this.donation.foodType,


      foodPreference:
        this.donation.foodPreference,


      quantity:
        Number(
          this.donation.quantity
        ),


      quantityUnit:
        this.donation.quantityUnit,


      servings:
        Number(
          this.donation.servings
        ),


      description:
        this.donation.description.trim(),


      pickupAddress:
        this.donation.pickupAddress.trim(),


      latitude:
        Number(
          this.donation.latitude
        ),


      longitude:
        Number(
          this.donation.longitude
        ),


      pickupDeadline:
        deadline.toISOString()

    };


    // ===================================================
    // DEBUG
    // ===================================================

    console.log(
      'Creating donation:',
      donationData
    );


    // ===================================================
    // START LOADING
    // ===================================================

    this.loading = true;


    // ===================================================
    // API REQUEST
    // ===================================================

    this.donationService
      .createDonation(
        donationData
      )

      .subscribe({

        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        next: (response: any) => {

          console.log(
            'Donation created successfully:',
            response
          );


          this.loading = false;


          this.successMessage =
            'Donation created successfully!';


          setTimeout(() => {

            this.router.navigate([
              '/my-donations'
            ]);

          }, 1000);

        },


        // ---------------------------------------------
        // ERROR
        // ---------------------------------------------

        error: (error: any) => {

          console.error(
            'Donation creation error:',
            error
          );


          this.loading = false;


          this.errorMessage =
            error?.error?.message ||
            'Unable to create donation. Please try again.';

        }

      });

  }


  // =====================================================
  // CLEAN UP MAP
  // =====================================================

  ngOnDestroy(): void {

    if (this.map) {

      this.map.remove();

      this.map = null;

      this.marker = null;

    }

  }

}