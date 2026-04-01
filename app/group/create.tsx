import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useGroups } from '@/hooks/useGroups';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { createGroup } = useGroups();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a group name.');
      return;
    }

    setIsSubmitting(true);
    const { group, error } = await createGroup({
      name: name.trim(),
      description: description.trim(),
      type,
    });
    setIsSubmitting(false);

    if (error || !group) {
      Alert.alert('Error', 'Could not create group. Please try again.');
      return;
    }

    router.replace(`/group/${group.id}`);
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
          <Text style={styles.headerTitle}>New Group</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type toggle */}
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeToggle}>
            <Pressable
              style={[styles.typeOption, type === 'public' && styles.typeOptionActive]}
              onPress={() => setType('public')}
            >
              <Ionicons
                name="globe-outline"
                size={16}
                color={type === 'public' ? '#000' : Colors.textSecondary}
              />
              <Text
                style={[styles.typeOptionText, type === 'public' && styles.typeOptionTextActive]}
              >
                Public
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeOption, type === 'private' && styles.typeOptionActive]}
              onPress={() => setType('private')}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={type === 'private' ? '#000' : Colors.textSecondary}
              />
              <Text
                style={[styles.typeOptionText, type === 'private' && styles.typeOptionTextActive]}
              >
                Private
              </Text>
            </Pressable>
          </View>
          <Text style={styles.typeHint}>
            {type === 'public'
              ? 'Anyone can find and join this group.'
              : 'Only invited members can join this group.'}
          </Text>

          {/* Name */}
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Group name"
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={60}
            returnKeyType="next"
          />

          {/* Description */}
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="What's this group about? (optional)"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            maxLength={300}
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
              <Text style={styles.submitBtnText}>Create Group</Text>
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
    backgroundColor: Colors.surface,
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 20,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  typeOptionActive: {
    backgroundColor: Colors.funGreen,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  typeOptionTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  typeHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
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
