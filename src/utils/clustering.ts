import { FunSignal, Cluster, HeatLevel, Event, EventCluster } from '@/types';
import {
  CLUSTER_RADIUS_METERS,
  HEAT_L1_MAX,
  HEAT_L2_MAX,
} from '@/constants/config';

/**
 * Calculates the distance in meters between two lat/lng points using the Haversine formula.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getHeatLevel(count: number): HeatLevel {
  if (count <= HEAT_L1_MAX) return 'L1';
  if (count <= HEAT_L2_MAX) return 'L2';
  return 'L3';
}

/**
 * Groups nearby fun signals into clusters.
 * Each signal is assigned to the first cluster it falls within,
 * or a new cluster is created.
 */
export function clusterSignals(
  signals: FunSignal[],
  radiusMeters: number = CLUSTER_RADIUS_METERS
): Cluster[] {
  const clusters: { lats: number[]; lngs: number[] }[] = [];

  for (const signal of signals) {
    let assigned = false;

    for (const cluster of clusters) {
      const centerLat = cluster.lats.reduce((a, b) => a + b, 0) / cluster.lats.length;
      const centerLng = cluster.lngs.reduce((a, b) => a + b, 0) / cluster.lngs.length;

      if (haversineDistance(signal.latitude, signal.longitude, centerLat, centerLng) <= radiusMeters) {
        cluster.lats.push(signal.latitude);
        cluster.lngs.push(signal.longitude);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      clusters.push({ lats: [signal.latitude], lngs: [signal.longitude] });
    }
  }

  return clusters.map((cluster) => {
    const count = cluster.lats.length;
    const lat = cluster.lats.reduce((a, b) => a + b, 0) / count;
    const lng = cluster.lngs.reduce((a, b) => a + b, 0) / count;
    return { lat, lng, count, level: getHeatLevel(count) };
  });
}

/**
 * Groups nearby events into clusters for the Future map mode.
 * Intensity is based on total RSVP count across clustered events.
 */
export function clusterEvents(
  events: Event[],
  radiusMeters: number = CLUSTER_RADIUS_METERS
): EventCluster[] {
  const groups: { lats: number[]; lngs: number[]; events: Event[] }[] = [];

  for (const event of events) {
    if (event.latitude == null || event.longitude == null) continue;
    let assigned = false;

    for (const group of groups) {
      const centerLat = group.lats.reduce((a, b) => a + b, 0) / group.lats.length;
      const centerLng = group.lngs.reduce((a, b) => a + b, 0) / group.lngs.length;

      if (haversineDistance(event.latitude, event.longitude, centerLat, centerLng) <= radiusMeters) {
        group.lats.push(event.latitude);
        group.lngs.push(event.longitude);
        group.events.push(event);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      groups.push({ lats: [event.latitude!], lngs: [event.longitude!], events: [event] });
    }
  }

  return groups.map((group) => {
    const lat = group.lats.reduce((a, b) => a + b, 0) / group.lats.length;
    const lng = group.lngs.reduce((a, b) => a + b, 0) / group.lngs.length;
    const totalRsvps = group.events.reduce((sum, e) => sum + e.rsvp_count, 0);
    const nextEvent = [...group.events].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    )[0];
    return {
      lat,
      lng,
      level: getHeatLevel(totalRsvps),
      rsvp_count: totalRsvps,
      next_event: nextEvent,
    };
  });
}
