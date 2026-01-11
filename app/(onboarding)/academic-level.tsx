import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useState } from 'react';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';

export default function AcademicLevelScreen() {
  const { userInfo, setUserInfo } = useSelection();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const academicLevels = [
    'FRESHMAN',
    'SOPHOMORE',
    'JUNIOR',
    'SENIOR',
    'MASTER',
    'PHD',
  ];

  const isFormValid = selectedLevel !== null;

  const handleContinue = () => {
    if (isFormValid && selectedLevel) {
      setUserInfo({
        ...userInfo,
        academicLevel: selectedLevel,
      });
      router.push(ROUTES.ONBOARDING.SETUP_COMPLETE);
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarActive} />
          <View style={styles.progressBarInactive} />
        </View>

        {/* Title */}
        <ThemedText style={styles.title}>Academic Level</ThemedText>

        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>What&apos;s your current year?</ThemedText>

        {/* Academic Level Selection */}
        <View style={styles.sectionContainer}>
          <View style={styles.buttonGrid}>
            {academicLevels.map((level) => {
              const isSelected = selectedLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedLevel(level)}
                  activeOpacity={0.7}>
                  <ThemedText
                    style={[
                      styles.optionButtonText,
                      isSelected && styles.optionButtonTextSelected,
                    ]}>
                    {level}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.backButtonBottom}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ThemedText style={styles.backButtonText}>BACK</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.continueButtonBottom,
            !isFormValid && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={isFormValid ? 0.8 : 1}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    marginBottom: 32,
    height: 4,
    alignSelf: 'center',
  },
  progressBarActive: {
    width: 240,
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
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: '#9B9B9B',
    marginBottom: 32,
    textAlign: 'center',
    width: '100%',
  },
  sectionContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 32,
    alignSelf: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    width: '47%',
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  optionButtonSelected: {
    backgroundColor: '#E8E6F7',
    borderWidth: 2,
    borderColor: '#5B4C9D',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B9B9B',
    textAlign: 'center',
    flexShrink: 1,
  },
  optionButtonTextSelected: {
    color: '#5B4C9D',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backButtonBottom: {
    flex: 1,
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#1A1A1A',
  },
  continueButtonBottom: {
    flex: 1,
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: '#9B9B9B',
  },
});

