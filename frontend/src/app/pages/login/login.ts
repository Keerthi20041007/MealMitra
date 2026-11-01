import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  // ==================================================
  // FORM VALUES
  // ==================================================

  email = '';
  password = '';

  // ==================================================
  // FIELD VALIDATION
  // ==================================================

  emailError = '';
  passwordError = '';
  private emailTouched = false;
  private passwordTouched = false;

  // ==================================================
  // GENERAL ERROR
  // ==================================================

  errorMessage = '';

  // ==================================================
  // UI STATE
  // ==================================================

  showPassword = false;
  loading = false;

  // ==================================================
  // CONSTRUCTOR
  // ==================================================

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ==================================================
  // PASSWORD VISIBILITY
  // ==================================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // ==================================================
  // EMAIL VALIDATION
  // ==================================================

  validateEmail(): boolean {

    this.emailError = '';

    const email =
      this.email.trim();

    // Empty
    if (!email) {

      this.emailError =
        'Please enter your email address.';

      return false;
    }

    // Email format
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailPattern.test(email)) {

      this.emailError =
        'Please enter a valid email address.';

      return false;
    }

    return true;
  }

  // ==================================================
  // PASSWORD VALIDATION
  // ==================================================

  validatePassword(): boolean {

    this.passwordError = '';

    // Empty
    if (!this.password.trim()) {

      this.passwordError =
        'Please enter your password.';

      return false;
    }

    return true;
  }

  // ==================================================
  // EMAIL BLUR
  // ==================================================

  onEmailBlur(): void {
    this.emailTouched = true;
    this.validateEmail();
  }

  // ==================================================
  // PASSWORD BLUR
  // ==================================================

  onPasswordBlur(): void {
    this.passwordTouched = true;
    this.validatePassword();
  }

  // ==================================================
  // CLEAR EMAIL ERROR WHEN TYPING
  // ==================================================

  onEmailInput(): void {
    this.emailError = '';
    this.errorMessage = '';

    if (this.emailTouched) {
      this.validateEmail();
    }
  }

  // ==================================================
  // CLEAR PASSWORD ERROR WHEN TYPING
  // ==================================================

  onPasswordInput(): void {
    this.passwordError = '';
    this.errorMessage = '';

    if (this.passwordTouched) {
      this.validatePassword();
    }
  }

  // ==================================================
  // LOGIN
  // ==================================================

  login(): void {

    // ----------------------------------------------
    // Clear previous general error
    // ----------------------------------------------

    this.errorMessage = '';

    // ----------------------------------------------
    // Prevent multiple requests
    // ----------------------------------------------

    if (this.loading) {
      return;
    }

    // ----------------------------------------------
    // Validate email
    // ----------------------------------------------

    this.emailTouched = true;
    this.passwordTouched = true;

    const validEmail =
      this.validateEmail();

    // ----------------------------------------------
    // Validate password
    // ----------------------------------------------

    const validPassword =
      this.validatePassword();

    // ----------------------------------------------
    // Stop if validation failed
    // ----------------------------------------------

    if (!validEmail || !validPassword) {
      return;
    }

    // ----------------------------------------------
    // Start loading
    // ----------------------------------------------

    this.loading = true;

    const credentials = {
      email:
        this.email
          .trim()
          .toLowerCase(),

      password:
        this.password
    };

    console.log(
      '================================='
    );

    console.log(
      'MealMitra login started'
    );

    console.log(
      'Email:',
      credentials.email
    );

    // ==================================================
    // CALL BACKEND
    // ==================================================

    this.authService
      .login(credentials)
      .pipe(
        timeout(30000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        // ============================================
        // SUCCESS
        // ============================================

        next: (response: any) => {

          console.log(
            'Login API response:',
            response
          );

          // ------------------------------------------
          // STOP LOADING
          // ------------------------------------------

          this.loading = false;

          // ------------------------------------------
          // Check response
          // ------------------------------------------

          if (
            !response ||
            response.success !== true
          ) {

            this.errorMessage =
              response?.message ||
              'Login failed. Please try again.';

            return;
          }

          // ------------------------------------------
          // Check token
          // ------------------------------------------

          if (!response.token) {

            this.errorMessage =
              'Login failed. Authentication token was not received.';

            return;
          }

          // ------------------------------------------
          // Get user
          // ------------------------------------------

          const user =
            response?.user;

          if (!user) {

            this.errorMessage =
              'Login successful, but user information was not received.';

            return;
          }

          // ------------------------------------------
          // Save session
          // ------------------------------------------

          this.authService.saveSession(
            response
          );

          console.log(
            'Logged-in user:',
            user
          );

          console.log(
            'Logged-in role:',
            user.role
          );

          // ==================================================
          // REDIRECT
          // ==================================================

          switch (
            String(user.role).toLowerCase()
          ) {

            case 'donor':

              console.log(
                'Redirecting to Donor Dashboard...'
              );

              this.router.navigate([
                '/donor-dashboard'
              ]);

              break;

            case 'ngo':

              console.log(
                'Redirecting to NGO Dashboard...'
              );

              this.router.navigate([
                '/ngo-dashboard'
              ]);

              break;

            case 'volunteer':

              console.log(
                'Redirecting to Volunteer Dashboard...'
              );

              this.router.navigate([
                '/volunteer-dashboard'
              ]);

              break;

            case 'admin':

              console.log(
                'Redirecting to Admin Dashboard...'
              );

              this.router.navigate([
                '/admin-dashboard'
              ]);

              break;

            default:

              console.error(
                'Unknown role:',
                user.role
              );

              this.errorMessage =
                'Your account role is not recognized.';

              break;
          }

          console.log(
            '================================='
          );
        },

        // ============================================
        // ERROR
        // ============================================

        error: (error: any) => {

          console.error(
            '================================='
          );

          console.error(
            'LOGIN API ERROR'
          );

          console.error(
            'Status:',
            error?.status
          );

          console.error(
            'Backend response:',
            error?.error
          );

          console.error(
            'Full error:',
            error
          );

          console.error(
            '================================='
          );

          // ------------------------------------------
          // VERY IMPORTANT:
          // STOP "SIGNING IN..." STATE
          // ------------------------------------------

          this.loading = false;

          // ------------------------------------------
          // 400
          // ------------------------------------------

          if (error?.status === 400) {

            this.errorMessage =
              error?.error?.message ||
              'Email and password are required.';

            return;
          }

          // ------------------------------------------
          // 401
          // ------------------------------------------

          if (error?.status === 401) {

            this.errorMessage =
              'Invalid email or password.';

            return;
          }

          // ------------------------------------------
          // 403
          // ------------------------------------------

          if (error?.status === 403) {

            this.errorMessage =
              error?.error?.message ||
              'You are not authorized to login.';

            return;
          }

          // ------------------------------------------
          // 404
          // ------------------------------------------

          if (error?.status === 404) {

            this.errorMessage =
              'Login service was not found. Please check the backend.';

            return;
          }

          // ------------------------------------------
          // CONNECTION ERROR
          // ------------------------------------------

          if (error?.status === 0) {

            this.errorMessage =
              'Unable to connect to the server. Please make sure the MealMitra backend is running.';

            return;
          }

          if (error?.name === 'TimeoutError') {

            this.errorMessage =
              'Sign in timed out. Check that the backend and MongoDB are running, then try again.';

            return;
          }

          // ------------------------------------------
          // SERVER ERROR
          // ------------------------------------------

          if (error?.status === 500) {

            this.errorMessage =
              error?.error?.message ||
              'Server error. Please try again later.';

            return;
          }

          // ------------------------------------------
          // OTHER ERROR
          // ------------------------------------------

          this.errorMessage =
            error?.error?.message ||
            'Invalid email or password. Please try again.';
        }
      });
  }
}