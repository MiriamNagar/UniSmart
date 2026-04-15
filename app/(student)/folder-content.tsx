import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
import { listNoteFoldersForCurrentUser } from "@/lib/note-folders-firestore";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    NativeModules,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

// Conditionally import Sharing and IntentLauncher (will be available after npm install)
let Sharing: any = null;
let IntentLauncher: any = null;
try {
  Sharing = require("expo-sharing");
} catch {
  // Package not installed yet
}
try {
  IntentLauncher = require("expo-intent-launcher");
} catch {
  // Package not installed yet
}

interface NoteItem {
  id: string;
  type: "image" | "document";
  uri: string;
  name: string;
  storagePath?: string;
  timestamp: number;
}

export default function FolderContentScreen() {
  const { folderName, folderId: folderIdParam } = useLocalSearchParams<{
    folderName: string;
    folderId?: string;
  }>();
  const { setLastNotesFolderName } = useSelection();
  const [isGalleryModalVisible, setGalleryModalVisible] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
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

  const resolveFolderId = useCallback(async (): Promise<string> => {
    if (folderIdParam?.trim()) {
      return folderIdParam.trim();
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
    } catch (error) {
      console.warn("Failed to resolve folder id by folder name:", error);
    }
    return displayName;
  }, [displayName, folderIdParam]);

  const mapAttachmentToNote = useCallback(
    (attachment: {
      id: string;
      type: "image" | "document";
      downloadUrl: string;
      fileName: string;
      storagePath: string;
      createdAtMs: number;
    }): NoteItem => {
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
    setIsLoadingNotes(true);
    setNotesErrorMessage(null);
    try {
      const folderId = await resolveFolderId();
      setResolvedFolderId(folderId);
      const attachments =
        await listNoteAttachmentsForCurrentUserFolder(folderId);
      setNotes(attachments.map(mapAttachmentToNote));
    } catch (error) {
      setNotesErrorMessage(mapNoteAttachmentErrorToMessage(error));
      console.warn("Failed to load note attachments:", error);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [mapAttachmentToNote, resolveFolderId]);

  useFocusEffect(
    useCallback(() => {
      setLastNotesFolderName(displayName);
      void loadFolderAttachments();
    }, [displayName, loadFolderAttachments, setLastNotesFolderName]),
  );

  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.studentFolder(displayName),
  );

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
        const errorMessage = mapNoteAttachmentErrorToMessage(error);
        setNotesErrorMessage(errorMessage);
        Alert.alert("Upload failed", errorMessage);
      } finally {
        setIsUploadingNote(false);
      }
    },
    [displayName, mapAttachmentToNote, resolveFolderId, resolvedFolderId],
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
        // Copy into app cache first so each pick has a stable file:// URI for
        // copyAsync into document storage (avoids Android revoking prior content://).
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

  const handleDeleteNote = (note: NoteItem) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
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
            const errorMessage = mapNoteAttachmentErrorToMessage(error);
            setNotesErrorMessage(errorMessage);
            Alert.alert("Delete failed", errorMessage);
          } finally {
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

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const handleOpenNote = async (note: NoteItem) => {
    if (note.type === "image") {
      // Open image in full screen modal
      setSelectedImage(note.uri);
      setSelectedNote(note);
    } else {
      // Show "Open with" dialog (like WhatsApp)
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

        // Android: prefer OpenDocumentModule (plain startActivity + createChooser, no
        // startActivityForResult) so every tap shows the full “Open with” list. expo-intent-launcher
        // keeps one pending promise; the next open often failed and fell through to Sharing
        // (wrong targets). Linking.openURL omits FLAG_GRANT_READ_URI_PERMISSION.
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
          const ACTION_VIEW = "android.intent.action.VIEW";
          const FLAG_GRANT_READ_URI_PERMISSION = 1;
          const FLAG_ACTIVITY_NEW_TASK = 268435456;
          const intentFlags =
            FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK;
          try {
            await IntentLauncher.startActivityAsync(ACTION_VIEW, {
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
          try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(shareUri, {
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

        // Last resort: iOS can open some local URIs via Linking. On Android, Linking does not
        // grant read permission for content:// (same issue as opening with Office above).
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

      {/* Main Content */}
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
                          {formatTimestamp(note.timestamp)}
                        </ThemedText>
                      </View>
                    </>
                  ) : (
                    <View style={styles.documentItem}>
                      <MaterialIcons
                        name="description"
                        size={48}
                        color="#5B4C9D"
                      />
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
                  onPress={() => handleDeleteNote(note)}
                  activeOpacity={0.7}
                  disabled={isDeletingNoteId === note.id}
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

      {/* Gallery/File Picker Modal */}
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

      {/* Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSelectedImage(null);
          setSelectedNote(null);
        }}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={() => {
              setSelectedImage(null);
              setSelectedNote(null);
            }}
            activeOpacity={0.7}
          >
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
              <ThemedText style={styles.imageViewerFileName}>
                {selectedNote.name}
              </ThemedText>
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
  documentTimestamp: {
    fontSize: 11,
    color: "#9B9B9B",
    marginTop: 6,
    textAlign: "center",
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
