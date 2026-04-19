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
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useSegments } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

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

export function useNotesViewModel() {
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

  return {
    segments,
    isAdminShell,
    folderContentRoute,
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
  };
}
