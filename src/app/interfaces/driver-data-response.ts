import { RaceResult } from "./race-result";

export interface DriverDataResponse {
  firstname: string;
  lastname: string;
  season: string;
  results: RaceResult[];
}
