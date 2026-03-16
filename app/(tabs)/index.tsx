import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useFunSignal } from '@/hooks/useFunSignal';
import { useAuthContext } from '@/contexts/AuthContext';
import { Heatmap } from '@/components/map/Heatmap';
import { FunToggle } from '@/components/map/FunToggle';
import { MapBounds } from '@/types';
import { Colors } from '@/constants/colors';
import { DEFAULT_REGION } from '@/constants/config';

// Light, minimal map style (close to Apple Maps look)
const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8e8' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'loading' | 'granted' | 'denied'>('loading');
  const { clusters } = useHeatmap(bounds);
  const { isOn, isLoading, toggleFun } = useFunSignal();
  const { signOut } = useAuthContext();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  async function requestLocationPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationPermission('denied');
      return;
    }
    setLocationPermission('granted');
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  }

  const handleRegionChange = useCallback((region: Region) => {
    const latDelta = region.latitudeDelta / 2;
    const lngDelta = region.longitudeDelta / 2;
    setBounds({
      minLat: region.latitude - latDelta,
      maxLat: region.latitude + latDelta,
      minLng: region.longitude - lngDelta,
      maxLng: region.longitude + lngDelta,
    });
  }, []);

  async function handleToggle() {
    if (!userLocation) {
      Alert.alert('Location needed', 'Enable location to mark fun at your spot.');
      return;
    }

    // Refresh location before toggling on
    if (!isOn) {
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        await toggleFun(location.coords.latitude, location.coords.longitude);
      } catch {
        await toggleFun(userLocation.latitude, userLocation.longitude);
      }
    } else {
      await toggleFun(userLocation.latitude, userLocation.longitude);
    }
  }

  if (locationPermission === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.funGreen} />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  if (locationPermission === 'denied') {
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedIcon}>📍</Text>
        <Text style={styles.deniedTitle}>Location Access Needed</Text>
        <Text style={styles.deniedText}>
          FunMap needs your location to show where fun is happening near you.
          Please enable it in Settings.
        </Text>
      </View>
    );
  }

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : DEFAULT_REGION;

  const isEmpty = clusters.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={LIGHT_MAP_STYLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChange}
        onMapReady={() => handleRegionChange(initialRegion)}
      >
        <Heatmap clusters={clusters} />
      </MapView>

      {/* Empty state */}
      {isEmpty && (
        <View style={styles.emptyBanner} pointerEvents="none">
          <Text style={styles.emptyText}>🗺️ Be the first to mark fun here!</Text>
        </View>
      )}

      {/* Sign out button (top right) */}
      <SafeAreaView style={styles.topRight} edges={['top']}>
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </SafeAreaView>

      {/* Fun toggle (bottom center) */}
      <SafeAreaView style={styles.toggleContainer} edges={['bottom']}>
        <FunToggle isOn={isOn} isLoading={isLoading} onPress={handleToggle} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  deniedIcon: { fontSize: 48 },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  deniedText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBanner: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  topRight: {
    position: 'absolute',
    top: 0,
    right: 16,
  },
  signOutButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
  },
  signOutText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toggleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 16,
  },
});
