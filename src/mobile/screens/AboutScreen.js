import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ScreenContainer from "../components/ScreenContainer";
import { theme } from "../theme";

const parentCompanyUrl = "https://www.epoch-technologies.com/";

const infoSections = [
  {
    id: "what",
    icon: "timeline",
    title: "What This Tree Shows",
    subtitle: "Species grouped by measurable similarities",
    paragraphs: [
      "This tree is a relationship map built from shared DNA patterns and observable traits.",
      "It helps you compare species and quickly see which groups are most similar to each other.",
    ],
    points: [
      "Nearby branches usually indicate stronger similarity.",
      "Group placement can change when better sequence data becomes available.",
    ],
  },
  {
    id: "build",
    icon: "science",
    title: "How Scientists Build Trees",
    subtitle: "From data collection to a structured map",
    paragraphs: [
      "Researchers compare DNA or protein sequences, body features, and trusted classification datasets.",
      "Computational methods then place species where their similarity patterns fit best.",
    ],
    points: [
      "Step 1: Gather sequence and trait data.",
      "Step 2: Align comparable markers across species.",
      "Step 3: Run models to estimate the best grouping.",
      "Step 4: Review confidence scores and refine the dataset.",
    ],
  },
  {
    id: "read",
    icon: "menu-book",
    title: "How To Read A Tree",
    subtitle: "A fast, reliable interpretation workflow",
    paragraphs: [
      "Start at the base and move through nodes toward named species. Each split separates one group into smaller similarity groups.",
      "When two species join at a nearby node, they are usually more similar than species that connect farther away.",
    ],
    points: [
      "Ignore left-right label order unless the figure explicitly encodes it.",
      "Branch rotations around one node do not change the grouping.",
      "Branch length may reflect amount of difference, depending on tree settings.",
    ],
  },
  {
    id: "terms",
    icon: "bookmarks",
    title: "Key Terms You Should Know",
    subtitle: "Vocabulary used across biology and ecology",
    paragraphs: [
      "Node: A split point where one group divides into subgroups.",
      "Clade/Group: A branch-defined cluster of related species.",
      "Sister taxa: Two species or groups linked at the same nearest node.",
      "Root: The base reference point of the displayed tree.",
      "Outgroup: A comparison group used to orient the map.",
    ],
    points: [
      "Cluster quality depends on the quality of the input data.",
      "Name labels can change when taxonomic databases are updated.",
      "Compare node positions, not just visual spacing.",
    ],
  },
  {
    id: "mistakes",
    icon: "warning-amber",
    title: "Common Misconceptions",
    subtitle: "Errors that lead to wrong conclusions",
    paragraphs: [
      "A tree is not a ranking of better or worse species.",
      "Visual similarity alone can mislead; DNA evidence is often needed to confirm closeness.",
    ],
    points: [
      "Top vs bottom position does not indicate quality or importance.",
      "Species that look alike can still be separated when genetic markers differ.",
      "Adjacent labels are not automatically the closest match unless they share a nearby node.",
    ],
  },
  {
    id: "evotree",
    icon: "auto-awesome",
    title: "How EvoTree Uses This",
    subtitle: "From species name to relationship context",
    paragraphs: [
      "When you add a species name, EvoTree pulls classification data and places it into your relationship tree.",
      "This gives quick context for comparing nearby species and understanding larger biological groups.",
    ],
    points: [
      "See which groups sit closest to your selected species.",
      "Compare shared naming levels across branches.",
      "Build a local reference tree for study and discussion.",
    ],
  },
];

const AccordionSection = ({ section, expanded, onToggle }) => (
  <View style={[styles.accordionCard, expanded && styles.accordionCardOpen]}>
    <Pressable
      style={({ pressed }) => [styles.accordionHeader, pressed && styles.headerPressed]}
      onPress={() => onToggle(section.id)}
    >
      <View style={styles.headerTextWrap}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <MaterialIcons name={section.icon} size={18} color="#18161f" />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      </View>
      <MaterialIcons
        name={expanded ? "expand-less" : "expand-more"}
        size={24}
        color={theme.colors.text}
      />
    </Pressable>

    {expanded ? (
      <View style={styles.accordionBody}>
        {section.paragraphs.map((paragraph) => (
          <Text key={paragraph} style={styles.body}>
            {paragraph}
          </Text>
        ))}
        <View style={styles.pointList}>
          {section.points.map((point) => (
            <View key={point} style={styles.pointRow}>
              <Text style={styles.pointMark}>-</Text>
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>
      </View>
    ) : null}
  </View>
);

const AboutScreen = ({ navigation, route }) => {
  const [expandedIds, setExpandedIds] = useState(() => new Set(["what"]));

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const sections = useMemo(() => infoSections, []);

  const toggleSection = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const openParentCompany = useCallback(async () => {
    const canOpen = await Linking.canOpenURL(parentCompanyUrl);
    if (canOpen) {
      await Linking.openURL(parentCompanyUrl);
    }
  }, []);

  return (
    <ScreenContainer navigation={navigation} routeName={route.name}>
      <View style={styles.heroCard}>
        <View style={styles.heroGlowPrimary} pointerEvents="none" />
        <View style={styles.heroGlowSecondary} pointerEvents="none" />
        <Text style={styles.heroTitle}>Species Relationship Guide</Text>
        <Text style={styles.heroBody}>
          Learn how this tree organizes species using DNA and trait
          similarities. Tap each section to expand practical explanations.
        </Text>
      </View>

      <View style={styles.stack}>
        {sections.map((section) => (
          <AccordionSection
            key={section.id}
            section={section}
            expanded={expandedIds.has(section.id)}
            onToggle={toggleSection}
          />
        ))}
      </View>

      <View style={styles.companyCard}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="apartment" size={18} color="#18161f" />
          </View>
          <Text style={styles.sectionTitle}>Explore Other Tools</Text>
        </View>
        <Text style={styles.body}>
          Built by Epoch Technologies LLC. Visit their website to explore more
          tools and projects.
        </Text>
        <Pressable
          onPress={openParentCompany}
          style={({ pressed }) => [styles.companyLink, pressed && styles.headerPressed]}
        >
          <Text style={styles.linkText}>{parentCompanyUrl}</Text>
          <MaterialIcons name="open-in-new" size={18} color={theme.colors.primary} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: theme.radii.lg,
    borderColor: theme.colors.border,
    borderWidth: 1,
    backgroundColor: "rgba(23, 29, 47, 0.95)",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  heroGlowPrimary: {
    position: "absolute",
    top: -80,
    right: -90,
    width: 230,
    height: 230,
    borderRadius: 120,
    backgroundColor: "rgba(112, 128, 217, 0.24)",
  },
  heroGlowSecondary: {
    position: "absolute",
    top: 20,
    right: 30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(226, 177, 121, 0.14)",
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: 0.25,
  },
  heroBody: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 23,
  },
  stack: {
    gap: theme.spacing.sm,
  },
  companyCard: {
    borderRadius: theme.radii.lg,
    borderColor: theme.colors.border,
    borderWidth: 1,
    backgroundColor: theme.colors.cardStrong,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  companyLink: {
    borderRadius: theme.radii.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  linkText: {
    flex: 1,
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  accordionCard: {
    borderRadius: theme.radii.lg,
    borderColor: theme.colors.border,
    borderWidth: 1,
    backgroundColor: theme.colors.cardStrong,
    ...theme.shadows.card,
  },
  accordionCardOpen: {
    borderColor: "#7c88c9",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  headerPressed: {
    opacity: 0.88,
  },
  headerTextWrap: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  sectionTitle: {
    flexShrink: 1,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: theme.colors.subtleText,
    fontSize: 13,
    lineHeight: 18,
  },
  accordionBody: {
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomLeftRadius: theme.radii.lg,
    borderBottomRightRadius: theme.radii.lg,
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 22,
  },
  pointList: {
    gap: 8,
  },
  pointRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  pointMark: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800",
  },
  pointText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13.5,
    lineHeight: 21,
  },
});

export default AboutScreen;
