import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DriverResultService } from '../../../services/driver-result/driver-result-service';
import { MODAL_DATA } from '../../../services/modal/modal';
import { Driver } from '../../../interfaces/driver';
import { ErrorState } from '../../../interfaces/error-state';
import { Error as ErrorBanner } from '../../common/error/error';
import { ModalShell } from '../../modals/modal-shell';

@Component({
  selector: 'app-driver-result',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, ModalShell, ErrorBanner],
  templateUrl: './driver-result.html',
  styleUrl: './driver-result.css',
})
export class DriverResult {
  private data = inject(MODAL_DATA) as {
    driver: Driver;
    selectedYear: string;
    availableYears?: string[];
  };
  private service = inject(DriverResultService);

  readonly CURRENT_YEAR = new Date().getFullYear().toString();
  private readonly initialYear = this.data?.selectedYear ?? this.CURRENT_YEAR;

  availableYears = signal<string[]>(
    this.data?.availableYears?.length ? this.data.availableYears : [this.initialYear],
  );

  driver = signal(this.data?.driver);
  selectedYear = signal(this.initialYear);
  rawResults = signal<any[]>([]);
  historicalAvg = signal<number>(0);
  isLoading = signal<boolean>(true);
  error = signal<ErrorState | null>(null);

  constructor() {
    effect(() => {
      const year = this.selectedYear();
      const driverId = this.driver().driverId;

      this.isLoading.set(true);
      this.error.set(null);

      if (year === this.CURRENT_YEAR) {
        this.service.getRaceResultsWithHistory(driverId, year).subscribe({
          next: (res) => {
            const results = res.current.results ?? [];
            this.rawResults.set(results);
            this.historicalAvg.set(res.historicalAvg);
            this.error.set(
              results.length
                ? null
                : {
                    message: `${this.driver().firstname} ${this.driver().lastname} did not participate during the ${year} season.`,
                    canRetry: false,
                    timestamp: new Date(),
                  },
            );
            this.isLoading.set(false);
          },
          error: () => {
            this.rawResults.set([]);
            this.historicalAvg.set(0);
            this.error.set({
              message: `Failed to load ${year} race results.`,
              canRetry: true,
              timestamp: new Date(),
            });
            this.isLoading.set(false);
          },
        });
      } else {
        this.service.getRaceResults(driverId, year).subscribe({
          next: (res) => {
            const results = res.results ?? [];
            this.rawResults.set(results);
            this.historicalAvg.set(0);
            this.error.set(
              results.length
                ? null
                : {
                    message: `${this.driver().firstname} ${this.driver().lastname} did not participate during the ${year} season.`,
                    canRetry: false,
                    timestamp: new Date(),
                  },
            );
            this.isLoading.set(false);
          },
          error: () => {
            this.rawResults.set([]);
            this.historicalAvg.set(0);
            this.error.set({
              message: `Failed to load ${year} race results.`,
              canRetry: true,
              timestamp: new Date(),
            });
            this.isLoading.set(false);
          },
        });
      }
    });

    effect(() => {
      this.selectedYear();
      this.rawResults();
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    });
  }

  retry(): void {
    const year = this.selectedYear();
    this.selectedYear.set('');
    queueMicrotask(() => this.selectedYear.set(year));
  }

  // Computes the total sum of both regular points and sprint points across all rounds
  totalPointsSum = computed(() =>
    this.rawResults().reduce((acc, r) => acc + (r.points ?? 0) + (r.sprintPoints ?? 0), 0),
  );

  chartData = computed<ChartData<'line'>>(() => {
    const results = this.rawResults();

    if (!results.length) {
      return {
        labels: ['R1'],
        datasets: [
          {
            label: 'No Data',
            data: [0],
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            fill: false,
            pointRadius: 0,
          },
        ],
      };
    }

    const racePoints = results.map((r) => r.points ?? 0);
    // Only assign sprint points if r.isSprint is true; otherwise, return null so non-sprint weekends are omitted from the line
    const sprintPoints = results.map((r) => (r.isSprint ? (r.sprintPoints ?? 0) : null));

    const labels = results.map((_, i) => `R${i + 1}`);

    const datasets: any[] = [
      {
        label: 'Race Points',
        data: racePoints,
        borderColor: '#3b82f6',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.0)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
          return gradient;
        },
        fill: true,
        tension: 0.25,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#3b82f6',
        borderWidth: 2.5,
      },
      {
        label: 'Sprint Points',
        data: sprintPoints,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        fill: false,
        spanGaps: true,
        tension: 0.25,
        pointRadius: sprintPoints.map((p) => (p !== null && p > 0 ? 5 : 0)),
        pointHoverRadius: 7,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#10b981',
        borderWidth: 2,
        borderDash: [4, 4],
      },
    ];

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
          color: '#64748b',
          stepSize: 5,
          font: { family: 'monospace', size: 11 },
          callback: (value) => `${value} pts`,
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#64748b',
          font: { family: 'monospace', size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 25,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8',
          boxWidth: 12,
          font: { family: 'monospace', size: 11 },
        },
      },
      tooltip: {
        enabled: this.rawResults().length > 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          title: (items) => {
            const index = items[0].dataIndex;
            const race = this.rawResults()[index];
            return race ? race.raceName : `Round ${items[0].label.replace('R', '')}`;
          },
          label: (item) => {
            const val = item.raw as number;
            const index = item.dataIndex;
            const race = this.rawResults()[index];
            const labelName = item.dataset.label ?? '';

            if (labelName === 'Race Points') {
              const statusStr = race && race.status === 'DNF' ? ' (DNF)' : '';
              return `   Race: ${val} pt${val === 1 ? '' : 's'}${statusStr}`;
            } else {
              // Only display sprint tooltip info if it was actually a sprint weekend
              if (race && !race.isSprint) return '';
              return `   Sprint: ${val} pt${val === 1 ? '' : 's'}`;
            }
          },
        },
      },
    },
    elements: {
      line: { tension: 0.25 },
    },
  }));
}