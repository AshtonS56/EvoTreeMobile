import React, { useCallback, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useFocusEffect } from "@react-navigation/native";
import { captureRef } from "react-native-view-shot";
import ScreenContainer from "../components/ScreenContainer";
import TreePanel from "../components/TreePanel";
import LoadingOverlay from "../components/LoadingOverlay";
import { createEmptyTree, normalizeRootDomainGrouping } from "../utils/treeUtils";

const MAIN_TREE_KEY = "evotree_main_tree_v1";

const MyTreeScreen = ({ navigation, route }) => {
  const [treeData, setTreeData] = useState(createEmptyTree());
  const [loading, setLoading] = useState({ visible: false, label: "" });
  const treeCaptureRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadTree = async () => {
        setLoading({ visible: true, label: "Loading your tree..." });
        try {
          const stored = await AsyncStorage.getItem(MAIN_TREE_KEY);
          const parsed = stored ? JSON.parse(stored) : null;
          if (isMounted) {
            setTreeData(parsed?.name ? normalizeRootDomainGrouping(parsed) : createEmptyTree());
          }
        } catch {
          if (isMounted) {
            setTreeData(createEmptyTree());
          }
        } finally {
          if (isMounted) {
            setLoading({ visible: false, label: "" });
          }
        }
      };

      loadTree();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const saveTreeImage = async () => {
    if (!treeCaptureRef.current) {
      Alert.alert("Unavailable", "Tree preview is not ready yet.");
      return;
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Photos Permission", "Allow Photos access to save images.");
      return;
    }

    try {
      const uri = await captureRef(treeCaptureRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved", "Tree image saved to your photo library.");
    } catch (error) {
      Alert.alert("Save Failed", error.message || "Could not save tree image.");
    }
  };

  const clearSavedTree = async () => {
    setLoading({ visible: true, label: "Clearing saved tree..." });
    try {
      await AsyncStorage.removeItem(MAIN_TREE_KEY);
      setTreeData(createEmptyTree());
    } catch (error) {
      Alert.alert("Clear Failed", error.message || "Could not clear saved tree.");
    } finally {
      setLoading({ visible: false, label: "" });
    }
  };

  return (
    <ScreenContainer
      navigation={navigation}
      routeName={route.name}
      scroll={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.layout}>
        <TreePanel
          title="My Saved Tree"
          treeData={treeData}
          onSaveTree={saveTreeImage}
          onClearTree={clearSavedTree}
          treeCaptureRef={treeCaptureRef}
          showClear
          clearLabel="Clear Saved Tree"
          clearConfirmTitle="Clear saved tree?"
          clearConfirmMessage="This clears your full saved tree on this device."
          doubleConfirmClear
          actionsInMenu
          cardStyle={styles.treeCard}
          canvasFill
          fitToViewport
          zoomEnabled
        />
      </View>

      <LoadingOverlay visible={loading.visible} label={loading.label} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  layout: {
    flex: 1,
  },
  treeCard: {
    flex: 1,
  },
});

export default MyTreeScreen;
