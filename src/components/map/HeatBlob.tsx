import { Circle, Marker } from 'react-native-maps';
import { Text } from 'react-native';
import { Cluster } from '@/types';
import { Colors } from '@/constants/colors';
import { BLOB_RADIUS_L1, BLOB_RADIUS_L2, BLOB_RADIUS_L3 } from '@/constants/config';

interface HeatBlobProps {
  cluster: Cluster;
}

const LEVEL_STYLES = {
  L1: { fill: Colors.heatL1, stroke: 'rgba(144, 238, 144, 0.6)', radius: BLOB_RADIUS_L1 },
  L2: { fill: Colors.heatL2, stroke: 'rgba(57, 255, 20, 0.85)', radius: BLOB_RADIUS_L2 },
  L3: { fill: Colors.heatL3, stroke: 'rgba(0, 128, 0, 1)', radius: BLOB_RADIUS_L3 },
};

export function HeatBlob({ cluster }: HeatBlobProps) {
  const { lat, lng, level } = cluster;
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
      {level === 'L3' && (
        <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1.8 }} flat>
          <Text style={{ fontSize: 24 }}>🔥</Text>
        </Marker>
      )}
    </>
  );
}
