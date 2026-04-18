import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ROUTES } from "@/constants/routes";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNotesViewModel } from "@/view-models/use-notes-view-model";

export default function NotesScreen() {
  const {
    userInfo,
    scrollViewProps,
    isModalVisible,
    setIsModalVisible,
    newFolderName,
    setNewFolderName,
    isCreatingFolder,
    foldersErrorMessage,
    isFoldersLoading,
    allFolders,
    isSelectionMode,
    selectedFolderIds,
    setSelectedFolderIds,
    confirmDeleteSelectedFolders,
    isDeletingSelected,
    toggleFolderSelection,
    refreshFolders,
    handleCreateFolder,
    folderContentRoute,
  } = useNotesViewModel();

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
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              onPress={() => setIsModalVisible(true)}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {isSelectionMode ? (
            <View style={styles.selectionBar}>
              <ThemedText style={styles.selectionCountText}>
                {selectedFolderIds.length} selected
              </ThemedText>
              <View style={styles.selectionActions}>
                <TouchableOpacity
                  style={styles.selectionCancelButton}
                  onPress={() => setSelectedFolderIds([])}
                  activeOpacity={0.8}
                  disabled={isDeletingSelected}
                >
                  <ThemedText style={styles.selectionCancelText}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectionDeleteButton,
                    isDeletingSelected && styles.selectionDeleteButtonDisabled,
                  ]}
                  onPress={confirmDeleteSelectedFolders}
                  activeOpacity={0.8}
                  disabled={isDeletingSelected}
                >
                  <ThemedText style={styles.selectionDeleteText}>
                    {isDeletingSelected ? "Deleting..." : "Delete"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          {userInfo.userType !== "admin" ? (
            <TouchableOpacity
              style={[styles.generateButton]}
              activeOpacity={0.85}
              onPress={() => router.push(ROUTES.STUDENT.SAVED)}
            >
              <ThemedText style={styles.generateButtonText}>
                GENERATE FROM SAVED TAB
              </ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Folder Grid */}
        <View style={styles.folderGrid}>
          {foldersErrorMessage ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>
                {foldersErrorMessage}
              </ThemedText>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  void refreshFolders();
                }}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.retryButtonText}>
                  TRY AGAIN
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : null}
          {isFoldersLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#5B4C9D" />
              <ThemedText style={styles.loadingText}>
                Loading folders...
              </ThemedText>
            </View>
          )}
          {allFolders.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.folderCard,
                selectedFolderIds.includes(folder.id) &&
                  styles.folderCardSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (isSelectionMode) {
                  toggleFolderSelection(folder);
                  return;
                }
                router.push({
                  pathname: folderContentRoute,
                  params: { folderName: folder.name, folderId: folder.id },
                });
              }}
              onLongPress={() => toggleFolderSelection(folder)}
            >
              {selectedFolderIds.includes(folder.id) ? (
                <View style={styles.selectedBadge}>
                  <MaterialIcons name="check" size={14} color="#FFFFFF" />
                </View>
              ) : null}
              <MaterialIcons
                name="folder"
                size={48}
                color={folder.isGeneral ? "#9B9B9B" : "#5B9BD5"}
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
        onRequestClose={() => setIsModalVisible(false)}
      >
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
                  setNewFolderName("");
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.modalCancelText}>CANCEL</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalCreateButton,
                  (!newFolderName.trim() || isCreatingFolder) &&
                    styles.modalCreateButtonDisabled,
                ]}
                onPress={handleCreateFolder}
                activeOpacity={0.8}
                disabled={!newFolderName.trim() || isCreatingFolder}
              >
                <ThemedText
                  style={[
                    styles.modalCreateText,
                    (!newFolderName.trim() || isCreatingFolder) &&
                      styles.modalCreateTextDisabled,
                  ]}
                >
                  {isCreatingFolder ? "CREATING..." : "CREATE"}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#5B4C9D",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  generateButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#ECE9F8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  generateButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B4C9D",
    letterSpacing: 0.3,
  },
  selectionBar: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F1FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A3FA8",
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionCancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E8E4FB",
  },
  selectionCancelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A3FA8",
  },
  selectionDeleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#B3261E",
  },
  selectionDeleteButtonDisabled: {
    opacity: 0.6,
  },
  selectionDeleteText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  folderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  loadingContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
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
  folderCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    minHeight: 140,
    justifyContent: "center",
  },
  folderCardSelected: {
    borderColor: "#5B4C9D",
    borderWidth: 2,
    backgroundColor: "#F5F3FF",
  },
  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#5B4C9D",
    alignItems: "center",
    justifyContent: "center",
  },
  folderName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    marginTop: 12,
    textAlign: "center",
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
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#1A1A1A",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: "#5B4C9D",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCreateButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  modalCreateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  modalCreateTextDisabled: {
    color: "#9B9B9B",
  },
});