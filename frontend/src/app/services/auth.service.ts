import {
  Injectable,
  Inject,
  PLATFORM_ID
} from '@angular/core';

import {
  isPlatformBrowser
} from '@angular/common';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl =
    'http://localhost:5000/api/auth';

  private tokenKey =
    'mealmitra_token';

  private userKey =
    'mealmitra_user';

  private isBrowser: boolean;


  constructor(
    private http: HttpClient,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {

    this.isBrowser =
      isPlatformBrowser(this.platformId);
  }


  // ==========================================
  // REGISTER
  // ==========================================

  register(user: any): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/register`,
      user
    );
  }


  // ==========================================
  // LOGIN
  // ==========================================

  login(credentials: any): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/login`,
      credentials
    );
  }

  getProfile(): Observable<any> {
    const token = this.getToken();

    return this.http.get(
      'http://localhost:5000/api/users/me',
      {
        headers: new HttpHeaders({
          Authorization: token ? `Bearer ${token}` : ''
        })
      }
    );
  }

  updateFoodSupport(
    supportedFoodTypes: string[],
    supportedFoodPreferences: string[]
  ): Observable<any> {
    const token = this.getToken();

    return this.http.patch(
      'http://localhost:5000/api/users/me/food-support',
      {
        supportedFoodTypes,
        supportedFoodPreferences
      },
      {
        headers: new HttpHeaders({
          Authorization: token ? `Bearer ${token}` : ''
        })
      }
    );
  }


  // ==========================================
  // SAVE SESSION
  // ==========================================

  saveSession(response: any): void {

    if (!this.isBrowser) {
      console.log(
        'AuthService: SSR detected. Session not saved.'
      );

      return;
    }


    console.log(
      '================================='
    );

    console.log(
      'Saving MealMitra session'
    );


    // ------------------------------------------
    // TOKEN
    // ------------------------------------------

    const token =
      response?.token ||
      response?.accessToken ||
      response?.data?.token ||
      response?.data?.accessToken ||
      '';


    // ------------------------------------------
    // USER
    // ------------------------------------------

    const user =
      response?.user ||
      response?.data?.user ||
      null;


    // ------------------------------------------
    // CLEAR OLD SESSION FIRST
    // ------------------------------------------

    localStorage.removeItem(
      this.tokenKey
    );

    localStorage.removeItem(
      this.userKey
    );


    // ------------------------------------------
    // SAVE TOKEN
    // ------------------------------------------

    if (token) {

      localStorage.setItem(
        this.tokenKey,
        token
      );

      console.log(
        'Token saved successfully'
      );

    } else {

      console.error(
        'LOGIN RESPONSE DOES NOT CONTAIN A TOKEN'
      );
    }


    // ------------------------------------------
    // SAVE USER
    // ------------------------------------------

    if (user) {

      localStorage.setItem(
        this.userKey,
        JSON.stringify(user)
      );

      console.log(
        'User information saved successfully'
      );

      console.log(
        'Saved user:',
        user
      );

    } else {

      console.error(
        'LOGIN RESPONSE DOES NOT CONTAIN USER DATA'
      );
    }


    // ------------------------------------------
    // VERIFY
    // ------------------------------------------

    const savedToken =
      localStorage.getItem(
        this.tokenKey
      );

    const savedUser =
      localStorage.getItem(
        this.userKey
      );


    console.log(
      'Session verification:',
      savedToken
        ? 'TOKEN EXISTS'
        : 'NO TOKEN'
    );

    console.log(
      'User verification:',
      savedUser
        ? 'USER EXISTS'
        : 'NO USER'
    );


    console.log(
      '================================='
    );
  }


  // ==========================================
  // GET TOKEN
  // ==========================================

  getToken(): string | null {

    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(
      this.tokenKey
    );
  }


  // ==========================================
  // GET CURRENT USER
  // ==========================================

  getCurrentUser(): any {

    if (!this.isBrowser) {
      return null;
    }


    const user =
      localStorage.getItem(
        this.userKey
      );


    if (!user) {
      return null;
    }


    try {

      return JSON.parse(user);

    } catch (error) {

      console.error(
        'Unable to parse saved user:',
        error
      );

      return null;
    }
  }


  // ==========================================
  // LOGIN STATUS
  // ==========================================

  isLoggedIn(): boolean {

    return !!this.getToken();
  }


  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {

    if (!this.isBrowser) {
      return;
    }


    localStorage.removeItem(
      this.tokenKey
    );

    localStorage.removeItem(
      this.userKey
    );


    console.log(
      'MealMitra session cleared'
    );
  }
}