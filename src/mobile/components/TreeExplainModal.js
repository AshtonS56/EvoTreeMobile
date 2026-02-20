import React from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ActionButton from "./ActionButton";
import { theme } from "../theme";

const openExternalLink = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Link Unavailable", "This link could not be opened on this device.");
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert("Link Error", "Could not open the link right now.");
  }
};

const TreeExplainModal = ({ visible, onClose }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.glowPrimary} pointerEvents="none" />
      <View style={styles.glowSecondary} pointerEvents="none" />
      <View style={styles.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerBadge}>
            <MaterialIcons name="hub" size={18} color={theme.colors.primary} />
            <Text style={styles.headerBadgeText}>Phylogenetic Tree Guide</Text>
          </View>

          <Text style={styles.title}>What is a Phylogenetic Tree?</Text>
          <Text style={styles.description}>
            A phylogenetic tree organizes organisms by biological similarity. Species
            that branch near each other generally share more DNA-level similarity than
            species that branch far apart.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Read It</Text>
            <View style={styles.tipRow}>
              <MaterialIcons name="radio-button-checked" size={10} color={theme.colors.primary} />
              <Text style={styles.tipText}>
                Each node is a taxonomic step (Domain, Kingdom, Phylum, Class, Order,
                Family, Genus, Species).
              </Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialIcons name="radio-button-checked" size={10} color={theme.colors.primary} />
              <Text style={styles.tipText}>
                Branch splits represent divergence in similarity between groups.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialIcons name="radio-button-checked" size={10} color={theme.colors.primary} />
              <Text style={styles.tipText}>
                Species labels include scientific names and common names when available.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why It Helps</Text>
            <Text style={styles.sectionBody}>
              This view makes large biological relationships easier to compare at a
              glance, so you can place new species into a structured hierarchy and
              quickly see where they fit.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore More or Get In Touch</Text>

            <Pressable
              onPress={() => openExternalLink("https://www.epoch-technologies.com/")}
              style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}
            >
              <MaterialIcons name="language" size={20} color={theme.colors.primary} />
              <View style={styles.linkTextWrap}>
                <Text style={styles.linkLabel}>Explore other apps</Text>
                <Text style={styles.linkValue}>Website</Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={theme.colors.mutedText} />
            </Pressable>

            <Pressable
              onPress={() => openExternalLink("mailto:epochtechnologies365@gmail.com")}
              style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}
            >
              <MaterialIcons name="mail-outline" size={20} color={theme.colors.primary} />
              <View style={styles.linkTextWrap}>
                <Text style={styles.linkLabel}>Contact</Text>
                <Text style={styles.linkValue}>epochtechnologies365@gmail.com</Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={theme.colors.mutedText} />
            </Pressable>
          </View>
        </ScrollView>

        <ActionButton label="Close" onPress={onClose} compact />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  glowPrimary: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(242, 198, 109, 0.18)",
  },
  glowSecondary: {
    position: "absolute",
    bottom: -90,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(106, 163, 255, 0.14)",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "86%",
    backgroundColor: theme.colors.cardStrong,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.floating,
  },
  scrollContent: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  headerBadgeText: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  section: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionBody: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  tipText: {
    flex: 1,
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },
  linkCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.input,
  },
  linkTextWrap: {
    flex: 1,
    gap: 2,
  },
  linkLabel: {
    color: theme.colors.subtleText,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  linkValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.84,
  },
});

export default TreeExplainModal;
