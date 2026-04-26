import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DriverResultService } from '../../../services/driver-result/driver-result-service';
import { MODAL_DATA } from '../../../services/modal/modal';
import { Driver } from '../../../interfaces/driver';
import { ModalShell } from '../../modals/modal-shell';
import { MemoryCacheService } from '../../../services/cache/memory-cache';

@Component({
  selector: 'app-driver-result',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, ModalShell],
  templateUrl: './driver-result.html',
  styleUrl: './driver-result.css',
})
export class DriverResult {
  private data = inject(MODAL_DATA) as { driver: Driver };
  private service = inject(DriverResultService);

  readonly TOTAL_SEASON_RACES = 24;
  readonly CURRENT_YEAR = '2026';

  driver = signal(this.data?.driver);
  years = signal(['2026', '2025', '2024']);
  selectedYear = signal('2026');
  rawResults = signal<any[]>([]);
  historicalAvg = signal<number>(0);

  constructor() {
    effect(() => {
      const year = this.selectedYear();
      const driverId = this.driver().driverId;

      // For current season, fetch with full history to power the forecast
      if (year === this.CURRENT_YEAR) {
        this.service.getRaceResultsWithHistory(driverId, year).subscribe({
          next: (res) => {
            this.rawResults.set(res.current.results ?? []);
            this.historicalAvg.set(res.historicalAvg);
          },
          error: (err) => console.error('API Error:', err),
        });
      } else {
        this.service.getRaceResults(driverId, year).subscribe({
          next: (res) => {
            this.rawResults.set(res.results ?? []);
            this.historicalAvg.set(0);
          },
          error: (err) => console.error('API Error:', err),
        });
      }
    });
  }

  totalPointsSum = computed(() => this.rawResults().reduce((acc, r) => acc + r.points, 0));

  chartData = computed<ChartData<'line'>>(() => {
    const results = this.rawResults();
    if (!results.length) return { labels: [], datasets: [] };

    const racePoints = results.map((r) => r.points);
    const labels = results.map((_, i) => `R${i + 1}`);
    const lastIndex = racePoints.length - 1;
    const lastActualPoint = racePoints[lastIndex];
    const n = racePoints.length;

    const datasets: any[] = [
      {
        label: 'Actual Points',
        data: racePoints,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#3b82f6',
        borderWidth: 3,
      },
    ];

    if (this.selectedYear() === this.CURRENT_YEAR && n < this.TOTAL_SEASON_RACES) {
      const remaining = this.TOTAL_SEASON_RACES - n;
      const seasonAvg = racePoints.reduce((a, b) => a + b, 0) / n;

      // --- LINE 1: Season Average (flat) ---
      const simpleData = [lastActualPoint, ...Array(remaining).fill(seasonAvg)];
      datasets.push({
        label: 'Season Average',
        data: [...Array(lastIndex).fill(null), ...simpleData],
        borderColor: 'rgba(148, 163, 184, 0.35)',
        borderDash: [10, 5],
        pointRadius: 0,
        fill: false,
        tension: 0,
      });

      // --- LINE 2: Weighted Momentum Forecast ---

      // Signal 1: Recent form — weighted avg of last 3 races (most recent = highest weight)
      const recentRaces = racePoints.slice(-3);
      const recentWeights = [1, 2, 3].slice(3 - recentRaces.length);
      const recentWeightSum = recentWeights.reduce((a, b) => a + b, 0);
      const recentForm =
        recentRaces.reduce((acc, pts, i) => acc + pts * recentWeights[i], 0) / recentWeightSum;

      // Signal 2: Season trajectory — linear regression slope, trust grows with more races
      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += racePoints[i];
        sumXY += i * racePoints[i];
        sumX2 += i * i;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
      const slopeTrust = Math.min(n / 8, 1); // full trust after 8 races
      const dampedSlope = slope * slopeTrust;

      // Signal 3: Historical baseline — real avg pts/race from past seasons via API
      // Falls back to current season avg if no history (e.g. rookie)
      const historicalBaseline = this.historicalAvg() > 0 ? this.historicalAvg() : seasonAvg;

      const W_RECENT = 0.5;
      const W_TRAJECTORY = 0.3;
      const W_HISTORICAL = 0.2;

      const forecastData: number[] = [lastActualPoint];
      let rollingBase = lastActualPoint;

      for (let i = 1; i <= remaining; i++) {
        const trajectoryContribution = rollingBase + dampedSlope;

        const predicted =
          W_RECENT * recentForm +
          W_TRAJECTORY * trajectoryContribution +
          W_HISTORICAL * historicalBaseline;

        const clamped = Math.max(0, Math.min(25, predicted));
        forecastData.push(Math.round(clamped * 10) / 10);

        // Roll forward with regression to mean over time
        const decayFactor = Math.min(i / remaining, 0.6);
        rollingBase = clamped * (1 - decayFactor) + seasonAvg * decayFactor;

        labels.push(`P${n + i}`);
      }

      datasets.push({
        label: 'Momentum Forecast',
        data: [...Array(lastIndex).fill(null), ...forecastData],
        borderColor: '#fbbf24',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }

    return { labels, datasets };
  });

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 25,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#94a3b8',
          stepSize: 5,
          font: { family: 'monospace', size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: '#94a3b8', usePointStyle: true, padding: 25 },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#3b82f6',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };
}
