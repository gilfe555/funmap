import { useRef } from 'react';
import { StyleSheet, Platform, View, ViewStyle } from 'react-native';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
  GooglePlaceDetail,
} from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';

const GOOGLE_MAPS_API_KEY =
  (Constants.expoConfig?.android?.config as any)?.googleMaps?.apiKey ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  '';

interface SearchBarProps {
  onPlaceSelected: (lat: number, lng: number, name?: string) => void;
  wrapperStyle?: ViewStyle;
  placeholder?: string;
}

export function SearchBar({ onPlaceSelected, wrapperStyle, placeholder = 'Search places' }: SearchBarProps) {
  const ref = useRef<GooglePlacesAutocompleteRef>(null);

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder}
        fetchDetails
        onPress={(_data, details: GooglePlaceDetail | null) => {
          if (!details) return;
          const { lat, lng } = details.geometry.location;
          onPlaceSelected(lat, lng, _data.description);
          ref.current?.clear();
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
        }}
        styles={{
          container: styles.container,
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          separator: styles.separator,
        }}
        enablePoweredByContainer={false}
        keepResultsAfterBlur={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  container: {
    flex: 0,
  },
  textInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 4,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  textInput: {
    height: 46,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 8,
    margin: 0,
  },
  listView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  description: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EBEBEB',
    marginHorizontal: 16,
  },
});
