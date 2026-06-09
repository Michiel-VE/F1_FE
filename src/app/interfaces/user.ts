export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  provider?: string;
  providerId?: string;
  picture?: string;
}