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
export class DonationService {

  private apiUrl =
    'http://localhost:5000/api/donations';

  private isBrowser: boolean;


  constructor(
    private http: HttpClient,

    private authService: AuthService,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {

    this.isBrowser =
      isPlatformBrowser(this.platformId);

  }


  // ==========================================
  // HEADERS
  // ==========================================

  private getHeaders(): HttpHeaders {

    if (!this.isBrowser) {

      return new HttpHeaders({
        'Content-Type':
          'application/json'
      });

    }


    const token =
      this.authService.getToken();


    return new HttpHeaders({

      'Content-Type':
        'application/json',

      'Authorization':
        token
          ? `Bearer ${token}`
          : ''

    });

  }



  // ==========================================
  // CREATE DONATION
  // ==========================================

  createDonation(
    donation: any
  ): Observable<any> {

    return this.http.post(

      this.apiUrl,

      donation,

      {
        headers:
          this.getHeaders()
      }

    );

  }



  // ==========================================
  // MY DONATIONS
  // ==========================================

  getMyDonations(): Observable<any> {

    return this.http.get(

      `${this.apiUrl}/my`,

      {
        headers:
          this.getHeaders()
      }

    );

  }

  getDonationRecommendations(id: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/${id}/recommendations`,
      {
        headers: this.getHeaders()
      }
    );
  }



  // ==========================================
  // GET SINGLE DONATION
  // ==========================================

  getDonationById(
    id: string
  ): Observable<any> {

    return this.http.get(

      `${this.apiUrl}/${id}`,

      {
        headers:
          this.getHeaders()
      }

    );

  }



  // ==========================================
  // CANCEL DONATION
  // ==========================================

  cancelDonation(
    id: string
  ): Observable<any> {

    return this.http.patch(

      `${this.apiUrl}/${id}/cancel`,

      {},

      {
        headers:
          this.getHeaders()
      }

    );

  }



  // ==========================================
  // CANCEL ACCEPTED DONATION
  // NGO ONLY
  // accepted -> pending
  // ==========================================

  cancelAcceptedDonation(
    id: string
  ): Observable<any> {

    return this.http.patch(

      `${this.apiUrl}/${id}/cancel-acceptance`,

      {},

      {
        headers:
          this.getHeaders()
      }

    );

  }



  // ==========================================
  // AVAILABLE DONATIONS
  // ==========================================

  getAvailableDonations(): Observable<any> {

    return this.http.get(

      `${this.apiUrl}/available`,

      {
        headers:
          this.getHeaders()
      }

    );

  }



  // ==========================================
  // ACCEPT DONATION
  // ==========================================

  acceptDonation(
    id: string
  ): Observable<any> {

    return this.http.patch(

      `${this.apiUrl}/${id}/accept`,

      {},

      {
        headers:
          this.getHeaders()
      }

    );

  }



  // ==========================================
  // ACCEPTED DONATIONS
  // ==========================================

  getAcceptedDonations(): Observable<any> {

    return this.http.get(

      `${this.apiUrl}/accepted`,

      {
        headers:
          this.getHeaders()
      }

    );

  }



  // ==========================================
  // CONFIRM PICKUP
  // accepted → picked_up
  // ==========================================

  markDonationPickedUp(
    id: string
  ): Observable<any> {

    return this.http.patch(

      `${this.apiUrl}/${id}/pickup`,

      {},

      {
        headers:
          this.getHeaders()
      }

    );

  }



  // ==========================================
  // MARK COMPLETED
  // picked_up → completed
  // ==========================================

  markDonationCompleted(
    id: string
  ): Observable<any> {

    return this.http.patch(

      `${this.apiUrl}/${id}/complete`,

      {},

      {
        headers:
          this.getHeaders()
      }

    );

  }

}