// mobile/types/api.d.ts

export interface User {
  username: string;
  email: string;
  device_id: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  ph: number;
  N: number;
  P: number;
  K: number;
  rainfall: number;
  timestamp: string;
}
