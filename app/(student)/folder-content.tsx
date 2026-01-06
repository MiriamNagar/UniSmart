import { StyleSheet, View, TouchableOpacity, ScrollView, Modal, Image, Alert, Linking, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ROUTES } from '@/constants/routes';

// Conditionally import Sharing and IntentLauncher (will be available after npm install)
let Sharing: any = null;
let IntentLauncher: any = null;
try {
  Sharing = require('expo-sharing');
} catch (e) {
  // Package not installed yet
}
try {
  IntentLauncher = require('expo-intent-launcher');
} catch (e) {
  // Package not installed yet
}

interface NoteItem {
  id: string;
  type: 'image' | 'document';
  uri: string;
  name: string;
  timestamp: number;
}

export default function FolderContentScreen() {
  const { folderName } = useLocalSearchParams<{ folderName: string }>();
  const { userInfo } = useSelection();
  const [isGalleryModalVisible, setGalleryModalVisible] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);

  const displayName = folderName || 'General Notes';

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return false;
    }
    return true;
  };

  const handleCameraPress = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newNote: NoteItem = {
          id: `note-${Date.now()}`,
          type: 'image',
          uri: asset.uri,
          name: asset.fileName || `Photo_${new Date().toISOString().split('T')[0]}.jpg`,
          timestamp: Date.now(),
        };
        setNotes((prev) => [...prev, newNote]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleGalleryPress = () => {
    setGalleryModalVisible(true);
  };

  const handlePickFromGallery = async () => {
    setGalleryModalVisible(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newNote: NoteItem = {
          id: `note-${Date.now()}`,
          type: 'image',
          uri: asset.uri,
          name: asset.fileName || `Image_${Date.now()}.jpg`,
          timestamp: Date.now(),
        };
        setNotes((prev) => [...prev, newNote]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handlePickFromFiles = async () => {
    setGalleryModalVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true, // Copy to cache - Sharing API will handle making it accessible
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Use the original URI - on Android this will be a content:// URI which is accessible
        // On iOS it will be a file:// URI which is also accessible
        const newNote: NoteItem = {
          id: `note-${Date.now()}`,
          type: 'document',
          uri: asset.uri,
          name: asset.name,
          timestamp: Date.now(),
        };
        setNotes((prev) => [...prev, newNote]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setNotes((prev) => prev.filter((note) => note.id !== noteId));
        },
      },
    ]);
  };

  const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      rtf: 'application/rtf',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  };

  const getUTI = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const utis: { [key: string]: string } = {
      pdf: 'com.adobe.pdf',
      doc: 'com.microsoft.word.doc',
      docx: 'org.openxmlformats.wordprocessingml.document',
      xls: 'com.microsoft.excel.xls',
      xlsx: 'org.openxmlformats.spreadsheetml.sheet',
      ppt: 'com.microsoft.powerpoint.ppt',
      pptx: 'org.openxmlformats.presentationml.presentation',
      txt: 'public.plain-text',
      rtf: 'public.rtf',
      zip: 'public.zip-archive',
      jpg: 'public.jpeg',
      jpeg: 'public.jpeg',
      png: 'public.png',
      gif: 'public.gif',
    };
    return utis[extension || ''] || 'public.data';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const handleOpenNote = async (note: NoteItem) => {
    if (note.type === 'image') {
      // Open image in full screen modal
      setSelectedImage(note.uri);
      setSelectedNote(note);
    } else {
      // Show "Open with" dialog (like WhatsApp)
      try {
        // Use Sharing API which properly handles file access permissions
        // On Android, it makes files accessible to other apps
        if (Sharing) {
          try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              // Sharing API handles file access permissions automatically
              // It creates a shareable URI that other apps can access
              // On Android, when used with files, it shows apps that can open the file
              await Sharing.shareAsync(note.uri, {
                mimeType: getMimeType(note.name),
                dialogTitle: `Open ${note.name}`,
                UTI: Platform.OS === 'ios' ? getUTI(note.name) : undefined,
              });
              return;
            }
          } catch (shareError) {
            console.log('Sharing failed, trying Intent Launcher:', shareError);
          }
        }

        // Fallback: try Intent Launcher on Android
        if (Platform.OS === 'android' && IntentLauncher) {
          try {
            const mimeType = getMimeType(note.name);
            await IntentLauncher.startActivityAsync(
              IntentLauncher.ActivityAction.VIEW,
              {
                data: note.uri,
                type: mimeType,
                flags: 1, // FLAG_ACTIVITY_NEW_TASK
              }
            );
            return;
          } catch (intentError) {
            console.log('Intent launcher failed:', intentError);
          }
        }

        // On iOS, use Sharing API which shows "Open with" options
        if (Platform.OS === 'ios' && Sharing) {
          try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(note.uri, {
                mimeType: getMimeType(note.name),
                dialogTitle: `Open ${note.name}`,
                UTI: getUTI(note.name),
              });
              return;
            }
          } catch (shareError) {
            console.log('Sharing failed:', shareError);
          }
        }
        
        // Fallback: try direct linking
        try {
          await Linking.openURL(note.uri);
        } catch (linkError) {
          Alert.alert(
            'Open File',
            `Unable to open ${note.name}.\n\nPlease ensure you have an app installed that can open ${note.name.split('.').pop()?.toUpperCase()} files.`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error opening file:', error);
        Alert.alert('Error', `Unable to open this file. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push(ROUTES.STUDENT.NOTES)}
          activeOpacity={0.7}>
          <MaterialIcons name="chevron-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <ThemedText style={styles.navTitle}>{displayName}</ThemedText>
        <View style={styles.navRightButtons}>
          <TouchableOpacity
            style={styles.cameraButton}
            activeOpacity={0.8}
            onPress={handleCameraPress}>
            <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.galleryButton}
            activeOpacity={0.8}
            onPress={handleGalleryPress}>
            <MaterialIcons name="photo-library" size={20} color="#9B9B9B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>No notes yet.</ThemedText>
          </View>
        ) : (
          <View style={styles.notesGrid}>
            {notes.map((note) => (
              <View key={note.id} style={styles.noteItemContainer}>
                <TouchableOpacity
                  style={styles.noteItem}
                  activeOpacity={0.8}
                  onPress={() => handleOpenNote(note)}>
                  {note.type === 'image' ? (
                    <>
                      <Image source={{ uri: note.uri }} style={styles.noteImage} />
                      <View style={styles.noteInfo}>
                        <ThemedText style={styles.noteTimestamp}>
                          {formatTimestamp(note.timestamp)}
                        </ThemedText>
                      </View>
                    </>
                  ) : (
                    <View style={styles.documentItem}>
                      <MaterialIcons name="description" size={48} color="#5B4C9D" />
                      <ThemedText style={styles.documentName} numberOfLines={2}>
                        {note.name}
                      </ThemedText>
                      <ThemedText style={styles.documentTimestamp}>
                        {formatTimestamp(note.timestamp)}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNote(note.id)}
                  activeOpacity={0.7}>
                  <MaterialIcons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Gallery/File Picker Modal */}
      <Modal
        visible={isGalleryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGalleryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Select Source</ThemedText>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}>
              <MaterialIcons name="photo-library" size={24} color="#5B4C9D" />
              <ThemedText style={styles.modalOptionText}>Gallery</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickFromFiles}
              activeOpacity={0.7}>
              <MaterialIcons name="folder" size={24} color="#5B4C9D" />
              <ThemedText style={styles.modalOptionText}>Files</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setGalleryModalVisible(false)}
              activeOpacity={0.7}>
              <ThemedText style={styles.modalCancelText}>CANCEL</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSelectedImage(null);
          setSelectedNote(null);
        }}>
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={() => {
              setSelectedImage(null);
              setSelectedNote(null);
            }}
            activeOpacity={0.7}>
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          {selectedNote && (
            <View style={styles.imageViewerFooter}>
              <ThemedText style={styles.imageViewerFileName}>{selectedNote.name}</ThemedText>
            </View>
          )}
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  navRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#5B4C9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9B9B9B',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noteItemContainer: {
    width: '47%',
    marginBottom: 16,
    position: 'relative',
  },
  noteItem: {
    width: '100%',
  },
  noteImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  noteInfo: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  noteTimestamp: {
    fontSize: 11,
    color: '#9B9B9B',
    fontWeight: '400',
  },
  documentItem: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  documentName: {
    fontSize: 12,
    color: '#1A1A1A',
    marginTop: 12,
    textAlign: 'center',
  },
  documentTimestamp: {
    fontSize: 11,
    color: '#9B9B9B',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '400',
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
    marginBottom: 24,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    marginBottom: 12,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  imageViewerFooter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
  },
  imageViewerFileName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

