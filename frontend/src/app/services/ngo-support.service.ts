import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { AuthService } from './auth.service';

export type SupportMessage = {
  role: 'user' | 'model';
  text: string;
};

@Injectable({
  providedIn: 'root',
})
export class NgoSupportService {
  private readonly apiUrl = 'http://localhost:5000/api/support/chat';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  sendMessage(messages: SupportMessage[]): Observable<{
    success: boolean;
    answer: string;
  }> {
    const token = this.authService.getToken();

    return this.http
      .post<{ success: boolean; answer: string }>(
        this.apiUrl,
        { messages },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          }),
        },
      )
      .pipe(timeout({ first: 25000 }));
  }
}
