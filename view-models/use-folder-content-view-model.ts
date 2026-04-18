import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import {
  deleteNoteAttachmentForCurrentUserFolder,
  listNoteAttachmentsForCurrentUserFolder,
  mapNoteAttachmentErrorToMessage,
  uploadNoteAttachmentForCurrentUserFolder,
} from "@/lib/note-attachments-firestore";
import type { NoteAttachmentAction } from "@/lib/note-attachments-firestore";
import { listNoteFoldersForCurrentUser } from "@/lib/note-folders-firestore";
import * as DocumentPicker from "expo-document-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useSegments,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Linking,
  NativeModules,
  Platform,
} from "react-native";

let Sharing: unknown = null;
let IntentLauncher: unknown = null;
try {
  // Optional peer deps: require keeps Metro from resolving missing native modules at build time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional expo-sharing
  Sharing = require("expo-sharing");
} catch {
  // Package not installed yet
}
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional expo-intent-launcher
  IntentLauncher = require("expo-intent-launcher");
} catch {
  // Package not installed yet
}

export interface FolderContentNoteItem {
  id: string;
  type: "image" | "document";
  uri: string;
  name: string;
  storagePath?: string;
  timestamp: number;
}

export function useFolderContentViewModel() {
  const segments = useSegments();
  const isAdminShell = segments[0] === "(admin)";
  const notesHubRoute = isAdminShell ? ROUTES.ADMIN.NOTES : ROUTES.STUDENT.NOTES;
  const { folderName, folderId: folderIdParam } = useLocalSearchParams<{
    folderName: string;
    folderId?: string;
  }>();
  const { setLastNotesFolderName } = useSelection();
  const [isGalleryModalVisible, setGalleryModalVisible] = useState(false);
  const [notes, setNotes] = useState<FolderContentNoteItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<FolderContentNoteItem | null>(
    null,
  );
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isUploadingNote, setIsUploadingNote] = useState(false);
  const [isDeletingNoteId, setIsDeletingNoteId] = useState<string | null>(null);
  const [notesErrorMessage, setNotesErrorMessage] = useState<string | null>(
    null,
  );

  const displayName = folderName || "General Notes";
  const [resolvedFolderId, setResolvedFolderId] = useState<string | null>(
    folderIdParam ?? null,
  );
  const latestLoadRequestIdRef = useRef(0);
  const deleteInFlightRef = useRef(false);

  const mapAttachmentErrorForAction = useCallback(
    (error: unknown, action: NoteAttachmentAction) =>
      mapNoteAttachmentErrorToMessage(error, action),
    [],
  );

  const resolveFolderId = useCallback(async (): Promise<string> => {
    const normalizedParam = folderIdParam?.trim();
    if (normalizedParam) {
      if (normalizedParam.includes("/")) {
        throw new Error("This folder reference is invalid. Please reopen it.");
      }
      return normalizedParam;
    }
    if (displayName === "General Notes") {
      return "general";
    }
    try {
      const folders = await listNoteFoldersForCurrentUser();
      const match = folders.find(
        (folder) =>
          folder.name.trim().toLowerCase() === displayName.trim().toLowerCase(),
      );
      if (match) {
        return match.id;
      }
      throw new Error(
        "Could not resolve this folder. Please reopen it from Notes and retry.",
      );
    } catch (error) {
      console.warn("Failed to resolve folder id by folder name:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        "Could not resolve this folder. Please reopen it from Notes and retry.",
      );
    }
  }, [displayName, folderIdParam]);

  const mapAttachmentToNote = useCallback(
    (attachment: {
      id: string;
      type: "image" | "document";
      downloadUrl: string;
      fileName: string;
      storagePath: string;
      createdAtMs: number;
    }): FolderContentNoteItem => {
      return {
        id: attachment.id,
        type: attachment.type,
        uri: attachment.downloadUrl,
        name: attachment.fileName,
        storagePath: attachment.storagePath,
        timestamp: attachment.createdAtMs,
      };
    },
    [],
  );

  const loadFolderAttachments = useCallback(async () => {
    const requestId = ++latestLoadRequestIdRef.current;
    setIsLoadingNotes(true);
    setNotesErrorMessage(null);
    try {
      const folderId = await resolveFolderId();
      if (requestId !== latestLoadRequestIdRef.current) {
        return;
      }
      setResolvedFolderId(folderId);
      const attachments =
        await listNoteAttachmentsForCurrentUserFolder(folderId);
      if (requestId !== latestLoadRequestIdRef.current) {
        return;
      }
      setNotes(attachments.map(mapAttachmentToNote));
    } catch (error) {
      if (requestId !== latestLoadRequestIdRef.current) {
        return;
      }
      setNotesErrorMessage(mapAttachmentErrorForAction(error, "list"));
      console.warn("Failed to load note attachments:", error);
    } finally {
      if (requestId === latestLoadRequestIdRef.current) {
        setIsLoadingNotes(false);
      }
    }
  }, [mapAttachmentErrorForAction, mapAttachmentToNote, resolveFolderId]);

  useFocusEffect(
    useCallback(() => {
      setLastNotesFolderName(displayName);
      void loadFolderAttachments();
    }, [displayName, loadFolderAttachments, setLastNotesFolderName]),
  );

  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.studentFolder(displayName),
  );

  const navigateToNotesHub = useCallback(() => {
    router.push(notesHubRoute);
  }, [notesHubRoute]);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to take photos.",
      );
      return false;
    }
    return true;
  };

  const uploadPickedAsset = useCallback(
    async (input: {
      uri: string;
      name: string;
      type: "image" | "document";
    }) => {
      setIsUploadingNote(true);
      setNotesErrorMessage(null);
      try {
        const uploaded = await uploadNoteAttachmentForCurrentUserFolder({
          folderId: resolvedFolderId ?? (await resolveFolderId()),
          folderName: displayName,
          fileName: input.name,
          localUri: input.uri,
          type: input.type,
        });
        setNotes((previous) => [mapAttachmentToNote(uploaded), ...previous]);
      } catch (error) {
        const errorMessage = mapAttachmentErrorForAction(error, "upload");
        setNotesErrorMessage(errorMessage);
        Alert.alert("Upload failed", errorMessage);
      } finally {
        setIsUploadingNote(false);
      }
    },
    [
      displayName,
      mapAttachmentErrorForAction,
      mapAttachmentToNote,
      resolveFolderId,
      resolvedFolderId,
    ],
  );

  const handleCameraPress = async () => {
    if (isUploadingNote) {
      return;
    }
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
        await uploadPickedAsset({
          uri: asset.uri,
          name:
            asset.fileName ||
            `Photo_${new Date().toISOString().split("T")[0]}.jpg`,
          type: "image",
        });
      }
    } catch {
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const handleGalleryPress = () => {
    setGalleryModalVisible(true);
  };

  const handlePickFromGallery = async () => {
    if (isUploadingNote) {
      return;
    }
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
        await uploadPickedAsset({
          uri: asset.uri,
          name: asset.fileName || `Image_${Date.now()}.jpg`,
          type: "image",
        });
      }
    } catch {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handlePickFromFiles = async () => {
    if (isUploadingNote) {
      return;
    }
    setGalleryModalVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadPickedAsset({
          uri: asset.uri,
          name: asset.name,
          type: "document",
        });
      }
    } catch {
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const handleDeleteNote = (note: FolderContentNoteItem) => {
    if (deleteInFlightRef.current) {
      return;
    }
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (deleteInFlightRef.current) {
            return;
          }
          deleteInFlightRef.current = true;
          setIsDeletingNoteId(note.id);
          setNotesErrorMessage(null);
          try {
            await deleteNoteAttachmentForCurrentUserFolder({
              folderId: resolvedFolderId ?? (await resolveFolderId()),
              attachmentId: note.id,
              storagePath: note.storagePath,
            });
            setNotes((previous) =>
              previous.filter((item) => item.id !== note.id),
            );
          } catch (error) {
            const errorMessage = mapAttachmentErrorForAction(error, "delete");
            setNotesErrorMessage(errorMessage);
            Alert.alert("Delete failed", errorMessage);
          } finally {
            deleteInFlightRef.current = false;
            setIsDeletingNoteId(null);
          }
        },
      },
    ]);
  };

  const getMimeType = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      rtf: "application/rtf",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };
    return mimeTypes[extension || ""] || "application/octet-stream";
  };

  const getUTI = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const utis: { [key: string]: string } = {
      pdf: "com.adobe.pdf",
      doc: "com.microsoft.word.doc",
      docx: "org.openxmlformats.wordprocessingml.document",
      xls: "com.microsoft.excel.xls",
      xlsx: "org.openxmlformats.spreadsheetml.sheet",
      ppt: "com.microsoft.powerpoint.ppt",
      pptx: "org.openxmlformats.presentationml.presentation",
      txt: "public.plain-text",
      rtf: "public.rtf",
      zip: "public.zip-archive",
      jpg: "public.jpeg",
      jpeg: "public.jpeg",
      png: "public.png",
      gif: "public.gif",
    };
    return utis[extension || ""] || "public.data";
  };

  const handleOpenNote = async (note: FolderContentNoteItem) => {
    if (note.type === "image") {
      setSelectedImage(note.uri);
      setSelectedNote(note);
    } else {
      try {
        const mimeType = getMimeType(note.name);
        let externalUri = note.uri;

        if (Platform.OS === "android") {
          if (note.uri.startsWith("content://")) {
            const cacheDirectory = LegacyFileSystem.cacheDirectory;
            if (cacheDirectory) {
              const extension = note.name.includes(".")
                ? note.name.split(".").pop()
                : "";
              const safeExtension = extension ? `.${extension}` : "";
              const cacheUri = `${cacheDirectory}open-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExtension}`;
              try {
                await LegacyFileSystem.copyAsync({
                  from: note.uri,
                  to: cacheUri,
                });
                externalUri =
                  await LegacyFileSystem.getContentUriAsync(cacheUri);
              } catch (copyError) {
                console.log(
                  "Failed to normalize content URI for external open:",
                  copyError,
                );
                externalUri = note.uri;
              }
            }
          } else if (note.uri.startsWith("file://")) {
            try {
              externalUri = await LegacyFileSystem.getContentUriAsync(note.uri);
            } catch (uriError) {
              console.log(
                "Failed to convert file URI to content URI:",
                uriError,
              );
              externalUri = note.uri;
            }
          }
        }

        const shareUri =
          Platform.OS === "android" && note.uri.startsWith("file://")
            ? note.uri
            : externalUri;

        if (Platform.OS === "android") {
          const openDocument = NativeModules.OpenDocumentModule as
            | {
                openWithChooser?: (
                  uri: string,
                  mime: string,
                  title: string,
                ) => Promise<unknown>;
              }
            | undefined;
          if (openDocument?.openWithChooser) {
            try {
              await openDocument.openWithChooser(
                externalUri,
                mimeType,
                `Open ${note.name}`,
              );
              return;
            } catch (nativeErr) {
              console.log(
                "OpenDocumentModule failed, trying IntentLauncher:",
                nativeErr,
              );
            }
          }
        }

        if (Platform.OS === "android" && IntentLauncher) {
          const mod = IntentLauncher as {
            startActivityAsync: (
              action: string,
              params: { data: string; type: string; flags: number },
            ) => Promise<unknown>;
          };
          const ACTION_VIEW = "android.intent.action.VIEW";
          const FLAG_GRANT_READ_URI_PERMISSION = 1;
          const FLAG_ACTIVITY_NEW_TASK = 268435456;
          const intentFlags =
            FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK;
          try {
            await mod.startActivityAsync(ACTION_VIEW, {
              data: externalUri,
              type: mimeType,
              flags: intentFlags,
            });
            return;
          } catch (intentError: unknown) {
            const message =
              intentError instanceof Error
                ? intentError.message
                : String(intentError);
            if (message.includes("already started")) {
              console.log(
                "IntentLauncher busy (stale pending); trying share sheet:",
                intentError,
              );
            } else {
              console.log(
                "VIEW intent failed, trying share fallback:",
                intentError,
              );
            }
          }
        }

        if (Sharing) {
          const shareMod = Sharing as {
            isAvailableAsync: () => Promise<boolean>;
            shareAsync: (
              uri: string,
              opts: {
                mimeType: string;
                dialogTitle: string;
                UTI?: string;
              },
            ) => Promise<void>;
          };
          try {
            const isAvailable = await shareMod.isAvailableAsync();
            if (isAvailable) {
              await shareMod.shareAsync(shareUri, {
                mimeType,
                dialogTitle: `Open ${note.name}`,
                UTI: Platform.OS === "ios" ? getUTI(note.name) : undefined,
              });
              return;
            }
          } catch (shareError) {
            console.log("Sharing failed:", shareError);
          }
        }

        if (Platform.OS === "android") {
          Alert.alert(
            "Open File",
            `Unable to open ${note.name}. Try again, or use Share from the system sheet if it appears.`,
            [{ text: "OK" }],
          );
        } else {
          try {
            await Linking.openURL(externalUri);
          } catch {
            Alert.alert(
              "Open File",
              `Unable to open ${note.name}.\n\nPlease ensure you have an app installed that can open ${note.name.split(".").pop()?.toUpperCase()} files.`,
              [{ text: "OK" }],
            );
          }
        }
      } catch (error) {
        console.error("Error opening file:", error);
        Alert.alert(
          "Error",
          `Unable to open this file. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  };

  const closeImageViewer = useCallback(() => {
    setSelectedImage(null);
    setSelectedNote(null);
  }, []);

  return {
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
  };
}
