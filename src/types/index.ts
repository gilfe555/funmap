export type HeatLevel = 'L1' | 'L2' | 'L3';

// ─── Groups Phase ─────────────────────────────────────────────

export type GroupType = 'public' | 'private';
export type GroupRole = 'admin' | 'member';

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  type: GroupType;
  member_count: number;
  avg_rating: number | null;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profiles?: { display_name: string | null } | null;
}

export interface Event {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  starts_at: string;
  rsvp_count: number;
  created_at: string;
  groups?: { name: string } | null;
}

export interface EventRsvp {
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface GroupRating {
  group_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

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
