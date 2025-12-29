import { TeamSeason } from "./team-season";

export interface Driver {
  driverId: string;
  firstname: string;
  lastname: string;
  permanentNumber: number;
  birthday: string;
  country: string;
  countryCode: string;
  teamSeasons: TeamSeason[];
}
