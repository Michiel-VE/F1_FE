import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TeamService } from '../team/team-service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private http = inject(HttpClient);
  private teamService = inject(TeamService);
  
  private apiPredictionsUrl = `${environment.baseUrl}/predictions`;

  getPredictionStatus(): Observable<{ hasPools: boolean; hasPersonalPrediction: boolean }> {
    return this.http.get<{ hasPools: boolean; hasPersonalPrediction: boolean }>(`${this.apiPredictionsUrl}/status`);
  }

  getTeamsForPrediction<T>(): Observable<T> {
    const currentSeason = new Date().getFullYear().toString();
    return this.teamService.getData<T>('f1_teams_cache', currentSeason);
  }

  getUserPools(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPredictionsUrl}/pools`);
  }

  getSavedPrediction(poolId: string | null): Observable<any> {
    if (!poolId) {
      return this.http.get<any>(`${this.apiPredictionsUrl}/team/personal`);
    }
    return this.http.get<any>(`${this.apiPredictionsUrl}/team/pool/${poolId}`);
  }

  getPoolDetails(poolId: string): Observable<any> {
    return this.http.get<any>(`${this.apiPredictionsUrl}/pools/${poolId}`);
  }

  createPool(name: string): Observable<any> {
    return this.http.post(`${this.apiPredictionsUrl}/pools`, { name });
  }

  joinPool(inviteCode: string): Observable<any> {
    return this.http.post(`${this.apiPredictionsUrl}/pools/join`, { inviteCode });
  }

  leavePool(poolId: string): Observable<any> {
    return this.http.delete(`${this.apiPredictionsUrl}/pools/${poolId}/leave`);
  }

  kickMember(poolId: string, memberId: string): Observable<any> {
    return this.http.delete(`${this.apiPredictionsUrl}/pools/${poolId}/members/${memberId}`);
  }

  postTeamPrediction(payload: { poolId: string | null; predictedTeams: string[] }): Observable<any> {
    return this.http.post(`${this.apiPredictionsUrl}/team`, payload);
  }
}