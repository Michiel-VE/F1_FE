export interface ErrorState {
  message: string;
  timestamp: Date;
  canRetry: boolean;
}