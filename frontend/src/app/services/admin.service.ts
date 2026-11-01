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

import {
  AuthService
} from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl =
    'http://localhost:5000/api/admin';

  private isBrowser: boolean;


  constructor(

    private http: HttpClient,

    private authService: AuthService,

    @Inject(PLATFORM_ID)
    private platformId: Object

  ) {

    this.isBrowser =
      isPlatformBrowser(
        this.platformId
      );

  }


  // ======================================================
  // AUTHORIZATION HEADERS
  // ======================================================

  private getHeaders(): HttpHeaders {

    if (!this.isBrowser) {

      return new HttpHeaders({
        'Content-Type':
          'application/json'
      });

    }


    const token =
      this.authService.getToken();


    console.log(
      'ADMIN TOKEN:',
      token
    );


    return new HttpHeaders({

      'Content-Type':
        'application/json',

      'Authorization':
        token
          ? `Bearer ${token}`
          : ''

    });

  }


  // ======================================================
  // DASHBOARD
  // ======================================================

  getDashboardStats(): Observable<any> {

    console.log(
      'Calling:',
      `${this.apiUrl}/dashboard`
    );

    return this.http.get(

      `${this.apiUrl}/dashboard`,

      {
        headers:
          this.getHeaders()
      }

    );

  }


  // ======================================================
  // USERS
  // ======================================================

  getAllUsers(): Observable<any> {

    return this.http.get(

      `${this.apiUrl}/users`,

      {
        headers:
          this.getHeaders()
      }

    );

  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/users/${id}`,
      {
        headers: this.getHeaders()
      }
    );
  }


  // ======================================================
  // DONATIONS
  // ======================================================

  getAllDonations(): Observable<any> {

    return this.http.get(

      `${this.apiUrl}/donations`,

      {
        headers:
          this.getHeaders()
      }

    );

  }

  deleteDonation(id: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/donations/${id}`,
      {
        headers: this.getHeaders()
      }
    );
  }

}