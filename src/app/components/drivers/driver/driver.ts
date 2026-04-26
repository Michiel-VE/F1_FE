import { Component, inject, input } from '@angular/core';
import { Driver as DriverI } from '../../../interfaces/driver';
import { TeamInfo } from '../../../interfaces/team-info';
import { AgePipe } from '../../../pipe/age/age-pipe';
import { DatePipe } from '@angular/common';
import { getPodiumGradient } from '../../common/border-accent/border-accent';
import { ModalService } from '../../../services/modal/modal';
import { DriverResult } from '../driver-result/driver-result';

@Component({
  selector: 'app-driver',
  imports: [AgePipe, DatePipe],
  templateUrl: './driver.html',
  styleUrl: './driver.css',
})
export class Driver {
  driver = input.required<DriverI>();
  position = input<number>(0);

  private modalService = inject(ModalService);

  getTeamInfo(driver: DriverI): TeamInfo {
    const team = driver.teamSeasons?.[0];
    return {
      name: team?.teamName ?? 'Unknown Team',
      shortName: team?.shortName ?? 'N/A',
    };
  }

  getPoints(driver: DriverI): number {
    return driver.teamSeasons?.[0]?.points ?? 0;
  }

  borderAccent(pos: number) {
    return getPodiumGradient(pos);
  }

  openStats(): void {
    this.modalService.open(DriverResult, { driver: this.driver() });
  }
}
