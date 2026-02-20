import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ActionButton from "./ActionButton";
import TreeCanvas from "./TreeCanvas";
import { theme } from "../theme";

const TreePanel = ({
  title,
  treeData,
  onSaveTree,
  onClearTree,
  treeCaptureRef,
  saveLabel = "Save Tree Image",
  saveVariant = "secondary",
  saveDisabled = false,
  showClear = true,
  clearLabel = "Clear Tree",
  clearCompact = false,
  clearConfirmTitle = "Clear tree?",
  clearConfirmMessage = "Clearing the tree cannot be undone.",
  doubleConfirmClear = false,
  actionsInMenu = false,
  cardStyle,
  canvasFill = false,
}) => {
  const handleClear = () => {
    const performSecondStep = () => {
      if (!doubleConfirmClear) {
        onClearTree();
        return;
      }

      Alert.alert(
        "Are you absolutely sure?",
        "This permanently removes your saved tree from this device.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes, Delete", style: "destructive", onPress: onClearTree },
        ]
      );
    };

    Alert.alert(clearConfirmTitle, clearConfirmMessage, [
      { text: "Cancel", style: "cancel" },
      { text: "Continue", style: "destructive", onPress: performSecondStep },
    ]);
  };

  const openActionsMenu = () => {
    const buttons = [];

    if (typeof onSaveTree === "function" && !saveDisabled) {
      buttons.push({ text: saveLabel, onPress: onSaveTree });
    }

    if (showClear && typeof onClearTree === "function") {
      buttons.push({ text: clearLabel, style: "destructive", onPress: handleClear });
    }

    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Tree Actions", "Choose an action for this tree.", buttons);
  };

  return (
    <View style={[styles.card, cardStyle]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {actionsInMenu ? (
          <Pressable
            onPress={openActionsMenu}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="settings" size={18} color={theme.colors.text} />
          </Pressable>
        ) : null}
      </View>
      <TreeCanvas treeData={treeData} ref={treeCaptureRef} fillHeight={canvasFill} />
      {!actionsInMenu ? (
        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <ActionButton
              label={saveLabel}
              onPress={onSaveTree}
              variant={saveVariant}
              disabled={saveDisabled}
            />
          </View>
          {showClear ? (
            <View style={[styles.actionItem, clearCompact && styles.compactActionItem]}>
              <ActionButton
                label={clearLabel}
                onPress={handleClear}
                variant="secondary"
                compact={clearCompact}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardStrong,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  settingsButton: {
    height: 34,
    width: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    flexWrap: "wrap",
  },
  actionItem: {
    flexBasis: "49%",
    flexGrow: 1,
  },
  compactActionItem: {
    flexBasis: "auto",
    flexGrow: 0,
    alignSelf: "flex-start",
  },
  pressed: {
    opacity: 0.8,
  },
});

export default TreePanel;
