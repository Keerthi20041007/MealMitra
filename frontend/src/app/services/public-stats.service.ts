import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImpactStats {
  totalDonations: number;
  peopleServed: number;
  ngoPartners: number;
  completedDonations: number;
  foodRescuedKg: number;
}

@Injectable({
  providedIn: 'root'
})
export class PublicStatsService {
  private readonly apiUrl = 'http://localhost:5000/api/public/stats';

  constructor(private http: HttpClient) {}

  getImpactStats(): Observable<{ success: boolean; stats: ImpactStats }> {
    return this.http.get<{ success: boolean; stats: ImpactStats }>(
      this.apiUrl
    );
  }
}
