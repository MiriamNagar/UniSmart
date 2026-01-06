import { StyleSheet, View, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { useMemo, useState } from 'react';
import { ROUTES } from '@/constants/routes';

export default function NotesScreen() {
  const { savedPlans, customFolders, setCustomFolders, userInfo } = useSelection();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Check if user is admin
  const isAdmin = userInfo.userType === 'admin';

  // Extract unique courses from saved plans
  const courseFolders = useMemo(() => {
    const courses = new Map<string, { courseCode: string; courseName: string }>();

    savedPlans.forEach((plan) => {
      Object.values(plan.schedule).forEach((dayCourses) => {
        if (Array.isArray(dayCourses)) {
          dayCourses.forEach((course: any) => {
            if (course && course.courseCode) {
              if (!courses.has(course.courseCode)) {
                courses.set(course.courseCode, {
                  courseCode: course.courseCode,
                  courseName: course.courseName || course.courseCode,
                });
              }
            }
          });
        }
      });
    });

    return Array.from(courses.values());
  }, [savedPlans]);

  // Combine General Notes with course folders and custom folders
  const allFolders = [
    { id: 'general', name: 'General Notes', isGeneral: true, isCustom: false },
    ...courseFolders.map((course) => {
      // Clean up course name (remove truncation dots if present)
      const cleanCourseName = course.courseName.replace(/\.\.\.$/, '');
      return {
        id: course.courseCode,
        name: `${course.courseCode}: ${cleanCourseName}`,
        isGeneral: false,
        isCustom: false,
      };
    }),
    ...customFolders.map((folderName, index) => ({
      id: `custom-${index}`,
      name: folderName,
      isGeneral: false,
      isCustom: true,
    })),
  ];

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setCustomFolders((prev) => [...prev, newFolderName.trim()]);
      setNewFolderName('');
      setIsModalVisible(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>NOTES HUB</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.title}>Note Archive</ThemedText>
              <ThemedText style={styles.subtitle}>LECTURE MATERIALS</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.8}
              onPress={() => setIsModalVisible(true)}>
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Folder Grid */}
        <View style={styles.folderGrid}>
          {allFolders.map((folder, index) => (
            <TouchableOpacity
              key={folder.id}
              style={styles.folderCard}
              activeOpacity={0.7}
              onPress={() => {
                router.push({
                  pathname: ROUTES.STUDENT.FOLDER_CONTENT,
                  params: { folderName: folder.name },
                });
              }}>
              <MaterialIcons
                name="folder"
                size={48}
                color={folder.isGeneral ? '#9B9B9B' : '#5B9BD5'}
              />
              <ThemedText style={styles.folderName} numberOfLines={2}>
                {folder.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* New Folder Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>New Folder</ThemedText>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Lab Snapshots"
              placeholderTextColor="#9B9B9B"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setIsModalVisible(false);
                  setNewFolderName('');
                }}
                activeOpacity={0.7}>
                <ThemedText style={styles.modalCancelText}>CANCEL</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalCreateButton,
                  !newFolderName.trim() && styles.modalCreateButtonDisabled,
                ]}
                onPress={handleCreateFolder}
                activeOpacity={0.8}
                disabled={!newFolderName.trim()}>
                <ThemedText
                  style={[
                    styles.modalCreateText,
                    !newFolderName.trim() && styles.modalCreateTextDisabled,
                  ]}>
                  CREATE
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'flex-start',
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
  titleSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#5B4C9D',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 140,
    justifyContent: 'center',
  },
  folderName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: '#5B4C9D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCreateButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  modalCreateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalCreateTextDisabled: {
    color: '#9B9B9B',
  },
});

