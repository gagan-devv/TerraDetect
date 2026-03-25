import { create } from "zustand";

export interface SensorData {
  temperature: number;
  ph: number;
  humidity: number;
  ec: number;
  N: number;
  P: number;
  K: number;
  moisture: number;
}

export interface SensorReading extends SensorData {
  timestamp: string;
}

interface SensorState {
  latest: SensorData | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;

  setLatest: (data: SensorData, timestamp: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useSensorStore = create<SensorState>((set) => ({
  latest: null,
  lastUpdated: null,
  isLoading: false,
  error: null,

  setLatest: (data, timestamp) =>
    set({ latest: data, lastUpdated: timestamp, error: null }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  clear: () => set({ latest: null, lastUpdated: null, error: null }),
}));
