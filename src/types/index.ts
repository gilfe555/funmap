export type HeatLevel = 'L1' | 'L2' | 'L3';

export interface FunSignal {
  user_id: string;
  latitude: number;
  longitude: number;
  status: boolean;
  updated_at: string;
  expires_at: string | null;
}

export interface Cluster {
  lat: number;
  lng: number;
  count: number;
  level: HeatLevel;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
