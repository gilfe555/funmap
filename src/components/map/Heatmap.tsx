import { Cluster } from '@/types';
import { HeatBlob } from './HeatBlob';

interface HeatmapProps {
  clusters: Cluster[];
}

export function Heatmap({ clusters }: HeatmapProps) {
  return (
    <>
      {clusters.map((cluster, index) => (
        <HeatBlob
          key={`${cluster.lat}-${cluster.lng}-${index}`}
          cluster={cluster}
        />
      ))}
    </>
  );
}
