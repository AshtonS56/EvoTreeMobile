import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const navItems = [
  { label: "Add Species", screen: "Main", icon: "add-circle-outline" },
  { label: "My Tree", screen: "MyTree", icon: "device-hub" },
  { label: "About", screen: "About", icon: "groups" },
];

const BottomNav = ({ navigation, routeName }) => {
  const insets = useSafeAreaInsets();

  const handleTabPress = useCallback(
    (targetScreen) => {
      if (targetScreen === routeName) {
        return;
      }

      navigation.navigate({
        name: targetScreen,
        params: {
          tabSwitch: true,
          transitionStamp: Date.now(),
        },
        merge: true,
      });
    },
    [navigation, routeName]
  );

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}
    >
      {navItems.map((item) => {
        const isActive = routeName === item.screen;

        return (
          <Pressable
            key={item.screen}
            onPress={() => handleTabPress(item.screen)}
            style={({ pressed }) => [
              styles.item,
              isActive && styles.activeItem,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name={item.icon}
              size={20}
              color={isActive ? "#171208" : theme.colors.text}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.navBg,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  item: {
    flex: 1,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 3,
  },
  activeItem: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  label: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: "#171208",
  },
  pressed: {
    opacity: 0.8,
  },
});

export default BottomNav;
