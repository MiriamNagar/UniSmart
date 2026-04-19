import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { formatNoteTimestamp } from "@/lib/note-timestamp";
import { useFolderContentViewModel } from "@/view-models/use-folder-content-view-model";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function FolderContentScreen() {
  const {
    displayName,
    scrollViewProps,
    navigateToNotesHub,
    notesErrorMessage,
    loadFolderAttachments,
    isLoadingNotes,
    isUploadingNote,
    notes,
    handleOpenNote,
    handleDeleteNote,
    isDeletingNoteId,
    isGalleryModalVisible,
    setGalleryModalVisible,
    handlePickFromGallery,
    handlePickFromFiles,
    handleCameraPress,
    handleGalleryPress,
    selectedImage,
    selectedNote,
    closeImageViewer,
  } = useFolderContentViewModel();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>NOTES HUB</ThemedText>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigateToNotesHub}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <ThemedText style={styles.navTitle}>{displayName}</ThemedText>
        <View style={styles.navRightButtons}>
          <TouchableOpacity
            style={styles.cameraButton}
            activeOpacity={0.8}
            onPress={handleCameraPress}
          >
            <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.galleryButton}
            activeOpacity={0.8}
            onPress={handleGalleryPress}
          >
            <MaterialIcons name="photo-library" size={20} color="#9B9B9B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notesErrorMessage ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>
              {notesErrorMessage}
            </ThemedText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                void loadFolderAttachments();
              }}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.retryButtonText}>TRY AGAIN</ThemedText>
            </TouchableOpacity>
          </View>
        ) : null}
        {isLoadingNotes || isUploadingNote ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#5B4C9D" />
            <ThemedText style={styles.loadingText}>
              {isUploadingNote
                ? "Uploading attachment..."
                : "Loading attachments..."}
            </ThemedText>
          </View>
        ) : null}
        {!isLoadingNotes && notes.length === 0 ? (
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
                  onPress={() => handleOpenNote(note)}
                >
                  {note.type === "image" ? (
                    <>
                      <Image
                        source={{ uri: note.uri }}
                        style={styles.noteImage}
                      />
                      <View style={styles.noteInfo}>
                        <ThemedText style={styles.noteTimestamp}>
                          {formatNoteTimestamp(note.timestamp)}
                        </ThemedText>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.documentItem}>
                        <MaterialIcons
                          name="description"
                          size={48}
                          color="#5B4C9D"
                        />
                        <ThemedText style={styles.documentName} numberOfLines={2}>
                          {note.name}
                        </ThemedText>
                      </View>
                      <View style={styles.documentInfo}>
                        <ThemedText style={styles.documentTimestamp}>
                          {formatNoteTimestamp(note.timestamp)}
                        </ThemedText>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNote(note)}
                  activeOpacity={0.7}
                  disabled={isDeletingNoteId !== null}
                >
                  {isDeletingNoteId === note.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialIcons name="close" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isGalleryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGalleryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Select Source</ThemedText>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <MaterialIcons name="photo-library" size={24} color="#5B4C9D" />
              <ThemedText style={styles.modalOptionText}>Gallery</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickFromFiles}
              activeOpacity={0.7}
            >
              <MaterialIcons name="folder" size={24} color="#5B4C9D" />
              <ThemedText style={styles.modalOptionText}>Files</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setGalleryModalVisible(false)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.modalCancelText}>CANCEL</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={closeImageViewer}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : null}
          {selectedNote ? (
            <View style={styles.imageViewerFooter}>
              <ThemedText style={styles.imageViewerFileName}>
                {selectedNote.name}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "flex-start",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitleUni: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerTitleSmart: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5B4C9D",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  navRightButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#5B4C9D",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  loadingContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#5B4C9D",
    fontWeight: "500",
  },
  errorContainer: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#FFF4F3",
    borderWidth: 1,
    borderColor: "#F2C7C3",
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#B3261E",
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#B3261E",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9B9B9B",
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  noteItemContainer: {
    width: "47%",
    marginBottom: 16,
    position: "relative",
  },
  noteItem: {
    width: "100%",
  },
  noteImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  noteInfo: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  noteTimestamp: {
    fontSize: 11,
    color: "#9B9B9B",
    fontWeight: "400",
  },
  documentItem: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  documentName: {
    fontSize: 12,
    color: "#1A1A1A",
    marginTop: 12,
    textAlign: "center",
  },
  documentInfo: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  documentTimestamp: {
    fontSize: 11,
    color: "#9B9B9B",
    textAlign: "left",
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 24,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    marginBottom: 12,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF4444",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  imageViewerFooter: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 16,
    borderRadius: 12,
  },
  imageViewerFileName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
