import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import ActionButton from "./ActionButton";
import { theme } from "../theme";
import { firstWordStartsWithCapital } from "../utils/treeUtils";

const ImageControls = ({
  animalName,
  onAnimalNameChange,
  onAddSpecies,
  disabled,
}) => {
  const [nameError, setNameError] = useState("");

  const handleNameChange = (value) => {
    onAnimalNameChange(value);
    if (!value.trim()) {
      setNameError("");
      return;
    }

    if (!firstWordStartsWithCapital(value)) {
      setNameError("Species must start with a capital letter.");
    } else {
      setNameError("");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Species Name Entry</Text>
      <Text style={styles.instructions}>
        Enter species names to build a preview tree, then add that preview to your saved tree.
      </Text>

      <TextInput
        style={styles.input}
        value={animalName}
        onChangeText={handleNameChange}
        placeholder="Enter a species name"
        placeholderTextColor={theme.colors.mutedText}
        autoCapitalize="words"
      />

      {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

      <ActionButton label="Add To Tree" onPress={onAddSpecies} disabled={disabled} />
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
  },
  instructions: {
    color: theme.colors.mutedText,
    lineHeight: 22,
    fontSize: 14,
  },
  input: {
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.input,
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  error: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginTop: -4,
  },
});

export default ImageControls;
