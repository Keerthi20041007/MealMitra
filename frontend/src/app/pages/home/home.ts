import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImpactStats, PublicStatsService } from '../../services/public-stats.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  impactStats: ImpactStats | null = null;
  statsError = '';
  private readonly isBrowser: boolean;

  constructor(
    private publicStatsService: PublicStatsService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.publicStatsService.getImpactStats().subscribe({
      next: (response) => {
        this.impactStats = response.stats;
        this.statsError = '';
      },
      error: (error: unknown) => {
        console.error('Failed to load public impact stats:', error);
        this.statsError = 'Live impact statistics are temporarily unavailable.';
      }
    });
  }
}