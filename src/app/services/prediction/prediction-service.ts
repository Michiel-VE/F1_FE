import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TeamService } from '../team/team-service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  private http = inject(HttpClient);
  private teamService = inject(TeamService);

  private readonly PREDICTION_URL = `${environment.baseUrl}/predictions/team`;

  getTeamsForPrediction<T>(): Observable<T> {
    const currentYear = new Date().getFullYear().toString();
     const cacheKey = `f1_teams_${currentYear}`;
    return this.teamService.getData<T>(cacheKey, currentYear);
  }

  postTeamPrediction<T>(predictionData: any): Observable<T> {
    return this.http.post<T>(this.PREDICTION_URL, predictionData);
  }
}
