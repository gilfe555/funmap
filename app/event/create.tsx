import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { SearchBar } from '@/components/map/SearchBar';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultTime() {
  return '20:00';
}

export default function CreateEventScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()
      .then(({ data }) => {
        if (data) setGroupName(data.name);
      });
  }, [groupId]);

  function handlePlaceSelected(lat: number, lng: number, name?: string) {
    setLocationLat(lat);
    setLocationLng(lng);
    if (name) setLocationName(name);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter an event title.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!dateRegex.test(date.trim()) || !timeRegex.test(time.trim())) {
      Alert.alert('Invalid date/time', 'Use YYYY-MM-DD and HH:MM format.');
      return;
    }

    const starts_at = new Date(`${date.trim()}T${time.trim()}:00`);
    if (isNaN(starts_at.getTime())) {
      Alert.alert('Invalid date/time', 'Please check the date and time.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsSubmitting(true);
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        group_id: groupId,
        created_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        latitude: locationLat,
        longitude: locationLng,
        location_name: locationName.trim() || null,
        starts_at: starts_at.toISOString(),
      })
      .select()
      .single();
    setIsSubmitting(false);

    if (error || !event) {
      Alert.alert('Error', 'Could not create event. Please try again.');
      return;
    }

    router.replace(`/group/${groupId}`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Event</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Group context */}
          {groupName ? (
            <View style={styles.groupChip}>
              <Ionicons name="people-outline" size={13} color={Colors.funGreenDark} />
              <Text style={styles.groupChipText}>{groupName}</Text>
            </View>
          ) : null}

          {/* Title */}
          <Text style={styles.fieldLabel}>Event Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Friday night out"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            returnKeyType="next"
          />

          {/* Date + Time */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
            <View style={styles.dateTimeField}>
              <Text style={styles.fieldLabel}>Time</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textSecondary}
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          {/* Location */}
          <Text style={styles.fieldLabel}>Location</Text>
          <View style={styles.locationWrapper}>
            <SearchBar
              onPlaceSelected={handlePlaceSelected}
              wrapperStyle={styles.locationSearchBar}
              placeholder="Search location"
            />
          </View>
          {locationName ? (
            <View style={styles.locationChip}>
              <Ionicons name="location" size={13} color={Colors.funGreenDark} />
              <Text style={styles.locationChipText} numberOfLines={1}>
                {locationName}
              </Text>
              <Pressable
                onPress={() => {
                  setLocationName('');
                  setLocationLat(null);
                  setLocationLng(null);
                }}
              >
                <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}

          {/* Description */}
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="What's happening? (optional)"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            multiline
            textAlignVertical="top"
          />

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>Create Event</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.funGreen + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    marginBottom: 16,
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.funGreenDark,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 20,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeField: {
    flex: 1,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  inputMultiline: {
    height: 100,
    paddingTop: 12,
  },
  locationWrapper: {
    zIndex: 20,
  },
  locationSearchBar: {
    marginHorizontal: 0,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.funGreen + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  locationChipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.funGreenDark,
  },
  submitBtn: {
    backgroundColor: Colors.funGreen,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
