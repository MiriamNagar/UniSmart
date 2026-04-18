import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import {
    createCustomNoteFolderForCurrentUser,
    deleteNoteFoldersForCurrentUser,
    listNoteFoldersForCurrentUser,
    mapNoteFolderErrorToMessage,
    type NoteFolderRecord,
} from "@/lib/note-folders-firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router, useFocusEffect, useSegments } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type NotesFolderViewModel = {
  id: string;
  name: string;
  isGeneral: boolean;
  isCustom: boolean;
  canDelete: boolean;
};

function mergeFolderNameOnce(previous: string[], nextName: string): string[] {
  const normalized = nextName.trim().toLowerCase();
  if (previous.some((name) => name.trim().toLowerCase() === normalized)) {
    return previous;
  }
  return [...previous, nextName];
}

export default function NotesScreen() {
  const segments = useSegments();
  const isAdminShell = segments[0] === "(admin)";
  const folderContentRoute = isAdminShell
    ? ROUTES.ADMIN.FOLDER_CONTENT
    : ROUTES.STUDENT.FOLDER_CONTENT;
  const {
    customFolders,
    setCustomFolders,
    setLastNotesFolderName,
    noteFoldersSyncVersion,
    bumpNoteFoldersSyncVersion,
    userInfo,
  } = useSelection();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [persistedFolders, setPersistedFolders] = useState<NoteFolderRecord[]>(
    [],
  );
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [foldersErrorMessage, setFoldersErrorMessage] = useState<string | null>(
    null,
  );
  const [noteFoldersPermissionBlocked, setNoteFoldersPermissionBlocked] =
    useState(false);
  const hasHydratedFoldersRef = useRef(false);
  const noteFoldersPermissionBlockedRef = useRef(noteFoldersPermissionBlocked);
  const lastSeenFoldersSyncVersionRef = useRef(noteFoldersSyncVersion);
  const isFocused = useIsFocused();

  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.STUDENT_NOTES,
  );

  useEffect(() => {
    noteFoldersPermissionBlockedRef.current = noteFoldersPermissionBlocked;
  }, [noteFoldersPermissionBlocked]);

  const isPermissionDeniedError = useCallback((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "permission-denied"
    ) {
      return true;
    }
    if (error instanceof Error) {
      return error.message.toLowerCase().includes("insufficient permissions");
    }
    return false;
  }, []);

  const refreshFolders = useCallback(async () => {
    setIsFoldersLoading(true);
    setFoldersErrorMessage(null);
    try {
      const folders = await listNoteFoldersForCurrentUser();
      setPersistedFolders(folders);
      noteFoldersPermissionBlockedRef.current = false;
      setNoteFoldersPermissionBlocked(false);
      hasHydratedFoldersRef.current = true;
      lastSeenFoldersSyncVersionRef.current = noteFoldersSyncVersion;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        noteFoldersPermissionBlockedRef.current = true;
        setNoteFoldersPermissionBlocked(true);
        hasHydratedFoldersRef.current = true;
        setFoldersErrorMessage(
          "You do not have permission to load note folders right now. Please sign in again and retry.",
        );
      } else {
        setFoldersErrorMessage(mapNoteFolderErrorToMessage(error));
      }
      setSelectedFolderIds([]);
      lastSeenFoldersSyncVersionRef.current = noteFoldersSyncVersion;
      console.warn("Failed to load note folders:", error);
    } finally {
      setIsFoldersLoading(false);
    }
  }, [isPermissionDeniedError, noteFoldersSyncVersion]);

  useFocusEffect(
    useCallback(() => {
      setLastNotesFolderName(null);
    }, [setLastNotesFolderName]),
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    const currentToken = noteFoldersSyncVersion;
    const shouldRefreshForExternalChange =
      currentToken !== lastSeenFoldersSyncVersionRef.current;
    if (!hasHydratedFoldersRef.current || shouldRefreshForExternalChange) {
      void refreshFolders();
    }
  }, [isFocused, noteFoldersSyncVersion, refreshFolders]);

  const fallbackBaseFolders: NotesFolderViewModel[] = [
    {
      id: "general",
      name: "General Notes",
      isGeneral: true,
      isCustom: false,
      canDelete: false,
    },
  ];

  const persistedBaseFolders: NotesFolderViewModel[] = persistedFolders.map(
    (folder) => ({
      id: folder.id,
      name: folder.name,
      isGeneral: folder.scope === "general",
      isCustom: folder.scope === "custom",
      canDelete: folder.scope !== "general",
    }),
  );

  const baseFolders =
    persistedBaseFolders.length > 0
      ? persistedBaseFolders
      : fallbackBaseFolders;

  const existingFolderNames = new Set(
    baseFolders.map((folder) => folder.name.trim().toLowerCase()),
  );
  const customStateFolders: NotesFolderViewModel[] = customFolders
    .filter(
      (folderName) => !existingFolderNames.has(folderName.trim().toLowerCase()),
    )
    .map((folderName, index) => ({
      id: `custom-${index}`,
      name: folderName,
      isGeneral: false,
      isCustom: true,
      canDelete: true,
    }));

  const allFolders = [...baseFolders, ...customStateFolders];
  const selectedFolders = allFolders.filter((folder) =>
    selectedFolderIds.includes(folder.id),
  );
  const isSelectionMode = selectedFolderIds.length > 0;

  const toggleFolderSelection = useCallback((folder: NotesFolderViewModel) => {
    if (!folder.canDelete) {
      return;
    }
    setSelectedFolderIds((previous) =>
      previous.includes(folder.id)
        ? previous.filter((id) => id !== folder.id)
        : [...previous, folder.id],
    );
  }, []);

  const handleCreateFolder = useCallback(async () => {
    const folderName = newFolderName.trim();
    if (!folderName || isCreatingFolder) {
      return;
    }

    setIsCreatingFolder(true);
    try {
      if (noteFoldersPermissionBlocked) {
        Alert.alert(
          "Folder not saved",
          "Cloud folder permissions are currently blocked, so this folder could not be saved.",
        );
        return;
      } else {
        const created = await createCustomNoteFolderForCurrentUser(folderName);
        setPersistedFolders((prev) => {
          const nextFolders = [...prev, created].sort((left, right) =>
            left.name.localeCompare(right.name),
          );
          return nextFolders;
        });
        bumpNoteFoldersSyncVersion();
        setCustomFolders((prev) => mergeFolderNameOnce(prev, created.name));
      }
      setNewFolderName("");
      setIsModalVisible(false);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        noteFoldersPermissionBlockedRef.current = true;
        setNoteFoldersPermissionBlocked(true);
        hasHydratedFoldersRef.current = true;
        Alert.alert(
          "Folder not saved",
          "Cloud folder permissions are currently blocked, so this folder could not be saved.",
        );
      } else {
        Alert.alert("Folder Error", mapNoteFolderErrorToMessage(error));
      }
    } finally {
      setIsCreatingFolder(false);
    }
  }, [
    bumpNoteFoldersSyncVersion,
    isCreatingFolder,
    isPermissionDeniedError,
    newFolderName,
    noteFoldersPermissionBlocked,
    setCustomFolders,
  ]);

  const handleDeleteSelectedFolders = useCallback(async () => {
    if (selectedFolders.length === 0 || isDeletingSelected) {
      return;
    }
    const selectedNameSet = new Set(
      selectedFolders.map((folder) => folder.name),
    );
    const persistedFolderIdSet = new Set(
      persistedFolders.map((folder) => folder.id),
    );
    const persistedFolderIdsToDelete = selectedFolders
      .map((folder) => folder.id)
      .filter((folderId) => persistedFolderIdSet.has(folderId));
    const localFolderNamesToDelete = selectedFolders
      .map((folder) => folder.name)
      .filter((folderName) =>
        customFolders.some(
          (customFolderName) => customFolderName === folderName,
        ),
      );

    setIsDeletingSelected(true);
    try {
      if (
        !noteFoldersPermissionBlockedRef.current &&
        persistedFolderIdsToDelete.length > 0
      ) {
        await deleteNoteFoldersForCurrentUser(persistedFolderIdsToDelete);
      }

      if (persistedFolderIdsToDelete.length > 0) {
        setPersistedFolders((previous) => {
          const nextFolders = previous.filter(
            (folder) => !persistedFolderIdsToDelete.includes(folder.id),
          );
          return nextFolders;
        });
        bumpNoteFoldersSyncVersion();
      }

      if (localFolderNamesToDelete.length > 0 || selectedNameSet.size > 0) {
        setCustomFolders((previous) =>
          previous.filter((folderName) => !selectedNameSet.has(folderName)),
        );
      }

      setSelectedFolderIds([]);
    } catch (error) {
      Alert.alert("Folder Error", mapNoteFolderErrorToMessage(error));
    } finally {
      setIsDeletingSelected(false);
    }
  }, [
    customFolders,
    isDeletingSelected,
    persistedFolders,
    selectedFolders,
    bumpNoteFoldersSyncVersion,
    setCustomFolders,
  ]);

  const confirmDeleteSelectedFolders = useCallback(() => {
    if (selectedFolders.length === 0) {
      return;
    }
    Alert.alert(
      "Delete selected folders?",
      `This will delete ${selectedFolders.length} folder${selectedFolders.length === 1 ? "" : "s"}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteSelectedFolders();
          },
        },
      ],
    );
  }, [handleDeleteSelectedFolders, selectedFolders.length]);

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
