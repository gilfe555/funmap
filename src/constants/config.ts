// Heatmap clustering
export const CLUSTER_RADIUS_METERS = 150;

// Intensity thresholds (number of users per cluster)
export const HEAT_L1_MAX = 2;  // 1–2 users: L1 (pale green)
export const HEAT_L2_MAX = 5;  // 3–5 users: L2 (lime green)
// 6+ users: L3 (dark green + fire emoji)

// Heat blob radii in meters
export const BLOB_RADIUS_L1 = 80;
export const BLOB_RADIUS_L2 = 150;
export const BLOB_RADIUS_L3 = 250;

// Auto-off: 8 hours in milliseconds
export const FUN_TIMEOUT_MS = 8 * 60 * 60 * 1000;

// Default map region (Tel Aviv — will center on user location in practice)
export const DEFAULT_REGION = {
  latitude: 32.0853,
  longitude: 34.7818,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
