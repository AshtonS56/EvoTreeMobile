import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

const LoadingOverlay = ({ visible, label }) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          {label ? <Text style={styles.label}>{label}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.cardStrong,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    minWidth: 220,
    alignItems: "center",
    gap: theme.spacing.sm,
    ...theme.shadows.floating,
  },
  label: {
    color: theme.colors.text,
    fontSize: 15,
    textAlign: "center",
  },
});

export default LoadingOverlay;
