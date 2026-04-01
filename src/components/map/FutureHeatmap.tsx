import { View, Text, StyleSheet } from 'react-native';
import { Circle, Marker } from 'react-native-maps';
import { EventCluster } from '@/types';
import { Colors } from '@/constants/colors';
import { BLOB_RADIUS_L1, BLOB_RADIUS_L2, BLOB_RADIUS_L3 } from '@/constants/config';

interface FutureHeatmapProps {
  clusters: EventCluster[];
}

const LEVEL_STYLES = {
  L1: { fill: Colors.heatL1, stroke: 'rgba(144, 238, 144, 0.6)', radius: BLOB_RADIUS_L1 },
  L2: { fill: Colors.heatL2, stroke: 'rgba(57, 255, 20, 0.85)', radius: BLOB_RADIUS_L2 },
  L3: { fill: Colors.heatL3, stroke: 'rgba(0, 128, 0, 1)', radius: BLOB_RADIUS_L3 },
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function shortTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function FutureBlob({ cluster }: { cluster: EventCluster }) {
  const { lat, lng, level, rsvp_count, next_event } = cluster;
  const style = LEVEL_STYLES[level];
  const coordinate = { latitude: lat, longitude: lng };

  return (
    <>
      <Circle
        center={coordinate}
        radius={style.radius}
        fillColor={style.fill}
        strokeColor={style.stroke}
        strokeWidth={1.5}
      />
      <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1.6 }} flat>
        <View style={styles.label}>
          <Text style={styles.labelTime}>{shortTime(next_event.starts_at)}</Text>
          {rsvp_count > 0 && (
            <Text style={styles.labelCount}>{rsvp_count} going</Text>
          )}
        </View>
      </Marker>
    </>
  );
}

export function FutureHeatmap({ clusters }: FutureHeatmapProps) {
  return (
    <>
      {clusters.map((cluster, i) => (
        <FutureBlob key={`future-${i}`} cluster={cluster} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  labelTime: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.funGreenDark,
  },
  labelCount: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
