import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import TreeExplainModal from "./TreeExplainModal";
import { theme } from "../theme";

const logo = require("../assets/EvoTreeLogo.png");

const TopBar = () => {
  const insets = useSafeAreaInsets();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <View
        style={[styles.container, { paddingTop: Math.max(insets.top, theme.spacing.xs) }]}
      >
        <View style={styles.topRow}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <View style={styles.userInfoWrap}>
            <Pressable
              onPress={() => setHelpOpen(true)}
              style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="help-outline" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <TreeExplainModal visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.navBg,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    paddingBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  logo: {
    width: 126,
    height: 56,
  },
  userInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  helpButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  pressed: {
    opacity: 0.8,
  },
});

export default TopBar;
