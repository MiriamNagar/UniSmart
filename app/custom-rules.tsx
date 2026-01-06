import { StyleSheet, TouchableOpacity, View, ScrollView, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useSelection } from '@/contexts/selection-context';

export default function CustomRulesScreen() {
  const {
    selectedDays,
    setSelectedDays,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    setLastPlannerRoute,
    alerts,
  } = useSelection();

  useFocusEffect(
    useCallback(() => {
      // Remember this route when screen is focused
      setLastPlannerRoute('/custom-rules');
    }, [setLastPlannerRoute])
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Generate hour options from 8 AM to 9 PM
  const hourOptions = [
    'Any',
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
    '9:00 PM',
  ];

  const getAvailableEndHours = () => {
    if (startHour === 'Any') {
      return hourOptions;
    }
    const startIndex = hourOptions.indexOf(startHour);
    if (startIndex === -1) return hourOptions;
    // End hour should be after start hour, or "Any"
    return ['Any', ...hourOptions.slice(startIndex + 1)];
  };

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const toggleDay = (day: string) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(day)) {
      newSelected.delete(day);
    } else {
      newSelected.add(day);
    }
    setSelectedDays(newSelected);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>INTELLIGENCE PLANNER</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <ThemedText style={styles.title}>Custom Rules</ThemedText>

        {/* Time Slots Card */}
        <View style={styles.card}>
          <ThemedText style={styles.cardLabel}>TIME SLOTS</ThemedText>
          <ThemedText style={styles.avoidText}>Avoid these days</ThemedText>

          {/* Day Buttons */}
          <View style={styles.daysContainer}>
            {days.map((day) => {
              const isSelected = selectedDays.has(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}>
                  <ThemedText
                    style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextSelected,
                    ]}>
                    {day}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hour Dropdowns */}
          <View style={styles.hourContainer}>
            <View style={styles.hourDropdown}>
              <ThemedText style={styles.hourLabel}>Start Hour</ThemedText>
              <TouchableOpacity
                style={styles.dropdown}
                activeOpacity={0.7}
                onPress={() => setShowStartPicker(true)}>
                <ThemedText style={styles.dropdownText}>{startHour}</ThemedText>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <View style={styles.hourDropdown}>
              <ThemedText style={styles.hourLabel}>End Hour</ThemedText>
              <TouchableOpacity
                style={styles.dropdown}
                activeOpacity={0.7}
                onPress={() => setShowEndPicker(true)}>
                <ThemedText style={styles.dropdownText}>{endHour}</ThemedText>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Hour Picker Modal */}
      <Modal
        visible={showStartPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Start Hour</ThemedText>
              <TouchableOpacity
                onPress={() => setShowStartPicker(false)}
                style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {hourOptions.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.modalOption,
                    startHour === hour && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setStartHour(hour);
                    setShowStartPicker(false);
                    // Reset end hour if it's now invalid
                    if (hour !== 'Any' && endHour !== 'Any') {
                      const startIndex = hourOptions.indexOf(hour);
                      const endIndex = hourOptions.indexOf(endHour);
                      if (endIndex <= startIndex) {
                        setEndHour('Any');
                      }
                    }
                  }}>
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      startHour === hour && styles.modalOptionTextSelected,
                    ]}>
                    {hour}
                  </ThemedText>
                  {startHour === hour && (
                    <MaterialIcons name="check" size={20} color="#5B4C9D" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* End Hour Picker Modal */}
      <Modal
        visible={showEndPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select End Hour</ThemedText>
              <TouchableOpacity
                onPress={() => setShowEndPicker(false)}
                style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {getAvailableEndHours().map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.modalOption,
                    endHour === hour && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setEndHour(hour);
                    setShowEndPicker(false);
                  }}>
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      endHour === hour && styles.modalOptionTextSelected,
                    ]}>
                    {hour}
                  </ThemedText>
                  {endHour === hour && (
                    <MaterialIcons name="check" size={20} color="#5B4C9D" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optimizerButton}
          activeOpacity={0.8}
          onPress={() => router.push('/generated-options')}>
          <ThemedText style={styles.optimizerButtonText}>RUN OPTIMIZER</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => {
            // Stay on current screen since we're already in planner flow
          }}>
          <MaterialIcons name="event-note" size={24} color="#5B4C9D" />
          <ThemedText style={styles.navItemTextActive}>PLANNER</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/saved')}>
          <MaterialIcons name="bookmark" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>SAVED</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/notes')}>
          <MaterialIcons name="description" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>NOTES</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/alerts')}>
          <View style={styles.alertIconContainer}>
            <MaterialIcons name="notifications" size={24} color="#9B9B9B" />
            {alerts.filter((alert) => !alert.isRead).length > 0 && (
              <View style={styles.alertDot} />
            )}
          </View>
          <ThemedText style={styles.navItemText}>ALERTS</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/account')}>
          <MaterialIcons name="account-circle" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>ACCOUNT</ThemedText>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleUni: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerTitleSmart: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B4C9D',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  avoidText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 60,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#E8E6F7',
    borderWidth: 2,
    borderColor: '#5B4C9D',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dayButtonTextSelected: {
    color: '#5B4C9D',
  },
  hourContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  hourDropdown: {
    flex: 1,
  },
  hourLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    width: 56,
    height: 56,
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optimizerButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optimizerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navItemText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9B9B9B',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  navItemTextActive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5B4C9D',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOptions: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#F8F8F8',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalOptionTextSelected: {
    color: '#5B4C9D',
    fontWeight: '600',
  },
  alertIconContainer: {
    position: 'relative',
  },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
});

