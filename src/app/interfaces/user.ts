export interface User {
  name: string;
  email: string;
  role: string;
  provider?: string;
  providerId?: string;
  picture?: string;
}
