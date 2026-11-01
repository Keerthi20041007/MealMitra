import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../../services/auth.service';

type RegistrationField =
  | 'donorName'
  | 'donorPhone'
  | 'donorEmail'
  | 'organizationName'
  | 'organizationPhone'
  | 'organizationEmail'
  | 'organizationAbout'
  | 'numberOfPeople'
  | 'password'
  | 'confirmPassword'
  | 'address'
  | 'location';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
  FormsModule,
  RouterLink,
  DecimalPipe
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  user = {

    // Account type
    role: '',

    // Donor details
    donorName: '',
    donorPhone: '',
    donorEmail: '',

    // NGO details
    organizationName: '',
    organizationPhone: '',
    organizationEmail: '',
    organizationAbout: '',
    numberOfPeople: 0,
    supportedFoodTypes: [
      'Cooked Food',
      'Packaged Food',
      'Fruits & Vegetables',
      'Bakery',
      'Other'
    ],
    supportedFoodPreferences: [
      'Vegetarian',
      'Non-Vegetarian',
      'Mixed'
    ],

    // Password
    password: '',
    confirmPassword: '',

    // NGO location
    address: '',
    latitude: 0,
    longitude: 0
  };

  showPassword = false;
  showConfirmPassword = false;

  loading = false;

  errorMessage = '';
  successMessage = '';
  roleError = '';

  fieldErrors: Partial<Record<RegistrationField, string>> = {};

  touchedFields: Record<RegistrationField, boolean> = {
    donorName: false,
    donorPhone: false,
    donorEmail: false,
    organizationName: false,
    organizationPhone: false,
    organizationEmail: false,
    organizationAbout: false,
    numberOfPeople: false,
    password: false,
    confirmPassword: false,
    address: false,
    location: false
  };

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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}


  // =====================================================
  // ROLE CHANGE
  // =====================================================

  roleChanged(): void {

    this.errorMessage = '';
    this.successMessage = '';
    this.roleError = '';

    this.fieldErrors = {};

    for (const field of Object.keys(this.touchedFields) as RegistrationField[]) {
      this.touchedFields[field] = false;
    }

    if (this.user.role === 'donor') {

      this.user.organizationName = '';
      this.user.organizationPhone = '';
      this.user.organizationEmail = '';
      this.user.organizationAbout = '';

      this.user.numberOfPeople = 0;

      this.user.address = '';

      this.user.latitude = 0;
      this.user.longitude = 0;
    }

    if (this.user.role === 'ngo') {

      this.user.donorName = '';
      this.user.donorPhone = '';
      this.user.donorEmail = '';
    }
  }

  toggleSupportedFoodType(foodType: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    this.user.supportedFoodTypes = event.target.checked
      ? [...this.user.supportedFoodTypes, foodType]
      : this.user.supportedFoodTypes.filter((value) => value !== foodType);
  }

  toggleSupportedFoodPreference(preference: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    this.user.supportedFoodPreferences = event.target.checked
      ? [...this.user.supportedFoodPreferences, preference]
      : this.user.supportedFoodPreferences.filter((value) => value !== preference);
  }

  onFieldInput(field: RegistrationField): void {
    this.errorMessage = '';

    if (this.touchedFields[field]) {
      this.validateField(field);
    }

    if (field === 'password' && this.touchedFields.confirmPassword) {
      this.validateField('confirmPassword');
    }
  }

  onFieldBlur(field: RegistrationField): void {
    this.touchedFields[field] = true;
    this.validateField(field);
  }

  shouldShowFieldError(field: RegistrationField): boolean {
    return Boolean(
      this.touchedFields[field] &&
      this.fieldErrors[field]
    );
  }

  private validateField(field: RegistrationField): boolean {
    const value = field === 'location'
      ? undefined
      : this.user[field];
    let message = '';

    switch (field) {
      case 'donorName':
      case 'organizationName':
      case 'organizationAbout':
      case 'address':
        if (typeof value !== 'string' || !value.trim()) {
          message = field === 'donorName'
            ? 'Please enter your full name.'
            : field === 'organizationName'
              ? 'Please enter the organization name.'
              : field === 'organizationAbout'
                ? 'Please describe your organization.'
                : 'Please enter the organization address.';
        }
        break;

      case 'donorPhone':
      case 'organizationPhone':
        if (typeof value !== 'string' || !value.trim()) {
          message = 'Please enter a phone number.';
        } else if (!/^[6-9]\d{9}$/.test(value.trim())) {
          message = 'Enter a valid 10-digit Indian phone number starting with 6–9.';
        }
        break;

      case 'donorEmail':
      case 'organizationEmail':
        if (typeof value !== 'string' || !value.trim()) {
          message = 'Please enter an email address.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
          message = 'Enter a valid email address.';
        }
        break;

      case 'numberOfPeople':
        if (
          !Number.isInteger(Number(value)) ||
          Number(value) <= 0
        ) {
          message = 'Enter a whole number greater than zero.';
        }
        break;

      case 'password':
        if (typeof value !== 'string' || !value.trim()) {
          message = 'Please enter a password.';
        } else if (value.length < 6 || value.length > 128) {
          message = 'Password must be between 6 and 128 characters.';
        }
        break;

      case 'confirmPassword':
        if (typeof value !== 'string' || !value.trim()) {
          message = 'Please confirm your password.';
        } else if (value !== this.user.password) {
          message = 'Passwords do not match.';
        }
        break;

      case 'location':
        if (
          this.user.latitude === 0 ||
          this.user.longitude === 0 ||
          !Number.isFinite(this.user.latitude) ||
          !Number.isFinite(this.user.longitude)
        ) {
          message = 'Capture the organization location to continue.';
        }
        break;
    }

    if (message) {
      this.fieldErrors[field] = message;
      return false;
    }

    delete this.fieldErrors[field];
    return true;
  }

  private validateActiveFields(): boolean {
    const fields: RegistrationField[] = this.user.role === 'donor'
      ? ['donorName', 'donorPhone', 'donorEmail', 'password', 'confirmPassword']
      : [
          'organizationName',
          'organizationPhone',
          'organizationEmail',
          'organizationAbout',
          'numberOfPeople',
          'password',
          'confirmPassword',
          'address',
          'location'
        ];

    return fields
      .map((field) => {
        this.touchedFields[field] = true;
        return this.validateField(field);
      })
      .every(Boolean);
  }


  // =====================================================
  // PASSWORD VISIBILITY
  // =====================================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }


  // =====================================================
  // GET CURRENT LOCATION
  // =====================================================

  getLocation(): void {

    this.errorMessage = '';

    if (!navigator.geolocation) {

      this.errorMessage =
        'Geolocation is not supported by your browser.';

      return;
    }

    this.loading = false;

    navigator.geolocation.getCurrentPosition(

      (position) => {

        this.user.latitude =
          position.coords.latitude;

        this.user.longitude =
          position.coords.longitude;

        this.touchedFields.location = true;
        this.validateField('location');

        this.successMessage =
          'Organization location captured successfully.';

        console.log(
          'Organization Latitude:',
          this.user.latitude
        );

        console.log(
          'Organization Longitude:',
          this.user.longitude
        );
      },

      (error) => {

        console.error(
          'Location error:',
          error
        );

        this.errorMessage =
          'Unable to get your current location. Please allow location permission and try again.';

        this.touchedFields.location = true;
        this.validateField('location');
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }


  // =====================================================
  // REGISTER
  // =====================================================

  register(): void {

    this.errorMessage = '';
    this.successMessage = '';
    this.roleError = '';


    // ===================================================
    // ROLE VALIDATION
    // ===================================================

    if (!this.user.role) {

      this.roleError =
        'Please select whether you are registering as a Food Donor or NGO.';

      return;
    }

    if (!this.validateActiveFields()) {
      return;
    }


    // ===================================================
    // DONOR REGISTRATION
    // ===================================================

    if (this.user.role === 'donor') {

      // Remove NGO information

      this.user.organizationName = '';
      this.user.organizationPhone = '';
      this.user.organizationEmail = '';
      this.user.organizationAbout = '';
      this.user.numberOfPeople = 0;

      this.user.address = '';
      this.user.latitude = 0;
      this.user.longitude = 0;
    }


    // ===================================================
    // NGO REGISTRATION
    // ===================================================

    if (this.user.role === 'ngo') {

      // Remove donor information

      this.user.donorName = '';
      this.user.donorPhone = '';
      this.user.donorEmail = '';
    }


    // ===================================================
    // SEND DATA TO BACKEND
    // ===================================================

    this.loading = true;

    this.authService
      .register(this.user)
      .pipe(
        timeout(30000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'Registration successful:',
            response
          );

          this.successMessage =
            'Registration successful! Redirecting to login...';

          setTimeout(() => {

            this.router.navigate([
              '/login'
            ]);

          }, 1200);
        },


        error: (error: any) => {

          console.error(
            'Registration error:',
            error
          );

          if (error?.name === 'TimeoutError') {
            this.errorMessage =
              'Registration timed out. Check that the backend and MongoDB are running, then try again.';
          } else if (error?.status === 0) {
            this.errorMessage =
              'Cannot reach the backend at http://localhost:5000. Start the backend and try again.';
          } else {
            this.errorMessage =
              error?.error?.message ||
              'Registration failed. Please try again.';
          }
        }

      });
  }
}