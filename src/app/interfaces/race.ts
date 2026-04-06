import { RaceStatus } from "../enum/race-status";

export interface Race {
  id: string,
  name: string,
  country: string,
  startDay: string,
  endDay: string,
  extraInfo?: string,
  status: RaceStatus,
  created_at: string,
  updated_at: string | null
}
