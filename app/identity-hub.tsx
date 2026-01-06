import { StyleSheet, TouchableOpacity, View, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useSelection } from '@/contexts/selection-context';

export default function IdentityHubScreen() {
  const { userType } = useLocalSearchParams<{ userType?: string }>();
  const isAdmin = userType === 'admin';
  const { userInfo, setUserInfo } = useSelection();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');

  const isFormValid = fullName.trim().length > 0 && age.trim().length > 0;

  const handleContinue = () => {
    if (isFormValid) {
      if (isAdmin) {
        // Admin: save info and go directly to setup-complete
        setUserInfo({ ...userInfo, fullName, age, faculty: '', major: '', academicLevel: '' });
        router.push('/setup-complete');
      } else {
        // Student: save info and go to department
        setUserInfo({ ...userInfo, fullName, age });
        router.push('/department');
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}>
        <MaterialIcons name="chevron-left" size={28} color="#9B9B9B" />
      </TouchableOpacity>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarActive, { width: isAdmin ? 213 : 160 }]} />
          <View style={styles.progressBarInactive} />
        </View>

        {/* Title */}
        <ThemedText style={styles.title}>Identity Hub</ThemedText>

        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>Who is setting up this workspace?</ThemedText>

        {/* Full Name Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>FULL NAME</ThemedText>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Alex Thompson"
            placeholderTextColor="#9B9B9B"
            autoCapitalize="words"
          />
        </View>

        {/* Age Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>AGE</ThemedText>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="20"
            placeholderTextColor="#9B9B9B"
            keyboardType="numeric"
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isFormValid && styles.continueButtonDisabled,
          ]}
          activeOpacity={isFormValid ? 0.8 : 1}
          onPress={handleContinue}
          disabled={!isFormValid}>
          <ThemedText
            style={[
              styles.continueButtonText,
              !isFormValid && styles.continueButtonTextDisabled,
            ]}>
            CONTINUE
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    marginBottom: 32,
    height: 4,
  },
  progressBarActive: {
    width: 80,
    height: 4,
    backgroundColor: '#5B4C9D',
    borderRadius: 2,
    marginRight: 4,
  },
  progressBarInactive: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    paddingBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: '#9B9B9B',
    marginBottom: 48,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  continueButton: {
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonTextDisabled: {
    color: '#9B9B9B',
  },
});

