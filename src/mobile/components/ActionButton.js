import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../theme";

const ActionButton = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  compact = false,
}) => {
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        isSecondary ? styles.secondary : styles.primary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, isSecondary ? styles.secondaryText : null]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radii.pill,
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    ...theme.shadows.card,
  },
  compact: {
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  secondary: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: "#16140b",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  secondaryText: {
    color: theme.colors.text,
  },
});

export default ActionButton;
