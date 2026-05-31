import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DriverResultService } from '../../../services/driver-result/driver-result-service';
import { MODAL_DATA } from '../../../services/modal/modal';
import { Driver } from '../../../interfaces/driver';
import { ModalShell } from '../../modals/modal-shell';

@Component({
  selector: 'app-driver-result',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, ModalShell],
  templateUrl: './driver-result.html',
  styleUrl: './driver-result.css',
})
export class DriverResult {
  private data = inject(MODAL_DATA) as { driver: Driver; selectedYear: string };
  private service = inject(DriverResultService);

  readonly TOTAL_SEASON_RACES = 24;
  readonly CURRENT_YEAR = new Date().getFullYear().toString();

  years = signal<string[]>(
    Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString()),
  );
  driver = signal(this.data?.driver);
  selectedYear = signal(this.data?.selectedYear ?? new Date().getFullYear().toString());
  rawResults = signal<any[]>([]);
  historicalAvg = signal<number>(0);

  constructor() {
    effect(() => {
      const year = this.selectedYear();
      const driverId = this.driver().driverId;

      if (year === this.CURRENT_YEAR) {
        this.service.getRaceResultsWithHistory(driverId, year).subscribe({
          next: (res) => {
            this.rawResults.set(res.current.results ?? []);
            this.historicalAvg.set(res.historicalAvg);
          },
          error: (err) => {
            console.error('API Error:', err);
            this.rawResults.set([]);
            this.historicalAvg.set(0);
          },
        });
      } else {
        this.service.getRaceResults(driverId, year).subscribe({
          next: (res) => {
            this.rawResults.set(res.results ?? []);
            this.historicalAvg.set(0);
          },
          error: (err) => {
            console.error('API Error:', err);
            this.rawResults.set([]);
            this.historicalAvg.set(0);
          },
        });
      }
    });

    effect(() => {
      // Force chart rendering re-evaluations safely across year modifications
      this.selectedYear();
      this.rawResults();
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    });
  }

  totalPointsSum = computed(() => this.rawResults().reduce((acc, r) => acc + r.points, 0));

  chartData = computed<ChartData<'line'>>(() => {
    const results = this.rawResults();
    
    // Fallback stub dataset to keep canvas structural boundaries intact when empty data is intended
    if (!results.length) {
      return { 
        labels: ['R1'], 
        datasets: [{
          label: 'No Data',
          data: [0],
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0
        }] 
      };
    }

    const racePoints = results.map((r) => r.points);
    const labels = results.map((_, i) => `R${i + 1}`);
    const lastIndex = racePoints.length - 1;
    const lastActualPoint = racePoints[lastIndex];
    const n = racePoints.length;

    const pointColors = racePoints.map((p) => (p === 0 ? '#ef4444' : '#3b82f6'));
    const pointRadii = racePoints.map((p) => (p === 0 ? 6 : 5));

    const datasets: any[] = [
      {
        label: 'Actual Points',
        data: racePoints,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: pointRadii,
        pointHoverRadius: 9,
        pointHitRadius: 16,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        borderWidth: 2.5,
      },
    ];

    if (this.selectedYear() === this.CURRENT_YEAR && n < this.TOTAL_SEASON_RACES) {
      const remaining = this.TOTAL_SEASON_RACES - n;
      const seasonAvg = Math.round(racePoints.reduce((a, b) => a + b, 0) / n);

      const simpleData = [lastActualPoint, ...Array(remaining).fill(seasonAvg)];
      datasets.push({
        label: 'Season Average',
        data: [...Array(lastIndex).fill(null), ...simpleData],
        borderColor: 'rgba(148, 163, 184, 0.35)',
        borderDash: [10, 5],
        pointRadius: 0,
        pointHitRadius: 0,
        fill: false,
        tension: 0,
      });

      const recentRaces = racePoints.slice(-3);
      const recentWeights = [1, 2, 3].slice(3 - recentRaces.length);
      const recentWeightSum = recentWeights.reduce((a, b) => a + b, 0);
      const recentForm =
        recentRaces.reduce((acc, pts, i) => acc + pts * recentWeights[i], 0) / recentWeightSum;

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
      const slopeTrust = Math.min(n / 8, 1);
      const dampedSlope = slope * slopeTrust;

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
        forecastData.push(Math.round((clamped * 10) / 10));

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
        pointHitRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }

    return { labels, datasets };
  });

  chartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        suggestedMax: 28,
        border: { display: false },
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#475569',
          stepSize: 5,
          font: { family: 'monospace', size: 11 },
          callback: (value) => `${value}`,
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#475569',
          font: { family: 'monospace', size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
    },
    plugins: {
      legend: {
        display: this.selectedYear() === this.CURRENT_YEAR && this.rawResults().length > 0,
        position: 'bottom',
        labels: {
          color: '#64748b',
          usePointStyle: true,
          pointStyleWidth: 20,
          padding: 20,
          font: { family: 'monospace', size: 11 },
        },
      },
      tooltip: {
        enabled: this.rawResults().length > 0,
        backgroundColor: '#0f172a',
        titleColor: '#64748b',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(59,130,246,0.25)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
        displayColors: true,
        callbacks: {
          title: (items) => `Race ${items[0].label}`,
          label: (item) => {
            const val = item.raw as number;
            if (item.datasetIndex === 0) {
              if (val === 0) return '   DNF / No points';
              return `   ${val} point${val === 1 ? '' : 's'}`;
            }
            return `   ${item.dataset.label}: ${val} pts`;
          },
        },
      },
    },
    elements: {
      line: { tension: 0.35 },
    },
  }));
}