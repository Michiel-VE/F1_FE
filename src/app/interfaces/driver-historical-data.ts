import { DriverDataResponse } from "./driver-data-response";

export interface DriverHistoricalData {
  current: DriverDataResponse;
  historical: DriverDataResponse[];
  historicalAvg: number;
}