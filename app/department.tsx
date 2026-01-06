import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useState } from 'react';
import { useSelection } from '@/contexts/selection-context';

export default function DepartmentScreen() {
  const { userInfo, setUserInfo } = useSelection();
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  const faculties = [
    'ENGINEERING',
    'BUSINESS',
    'SCIENCE',
    'ARTS',
    'MEDICINE',
    'LAW',
    'EDUCATION',
  ];

  const majors = [
    'Software Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Computer Science',
    'Electrical Engineering',
    'Data Science',
  ];

  const isFormValid = selectedFaculty !== null && selectedMajor !== null;

  const handleContinue = () => {
    if (isFormValid && selectedFaculty && selectedMajor) {
      setUserInfo({
        ...userInfo,
        faculty: selectedFaculty,
        major: selectedMajor,
      });
      router.push('/academic-level');
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
        <ThemedText style={styles.title}>Department</ThemedText>

        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>
          Select your Faculty and Major.
        </ThemedText>

        {/* Faculty Selection */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionLabel}>FACULTY</ThemedText>
          <View style={styles.buttonGrid}>
            {faculties.map((faculty) => {
              const isSelected = selectedFaculty === faculty;
              return (
                <TouchableOpacity
                  key={faculty}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedFaculty(faculty);
                    setSelectedMajor(null); // Reset major when faculty changes
                  }}
                  activeOpacity={0.7}>
                  <ThemedText
                    style={[
                      styles.optionButtonText,
                      isSelected && styles.optionButtonTextSelected,
                    ]}>
                    {faculty}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Major Selection - Only show after faculty is selected */}
        {selectedFaculty && (
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionLabel}>MAJOR</ThemedText>
            <View style={styles.majorContainer}>
              {majors.map((major) => {
                const isSelected = selectedMajor === major;
                return (
                  <TouchableOpacity
                    key={major}
                    style={[
                      styles.optionButton,
                      styles.majorButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    onPress={() => setSelectedMajor(major)}
                    activeOpacity={0.7}>
                    <ThemedText
                      style={[
                        styles.optionButtonText,
                        isSelected && styles.optionButtonTextSelected,
                      ]}
                      numberOfLines={1}>
                      {major}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
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
    width: 160,
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
    marginBottom: 16,
    paddingBottom: 4,
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  majorContainer: {
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
  majorButton: {
    minWidth: '100%',
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

