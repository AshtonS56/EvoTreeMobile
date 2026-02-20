import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../components/ScreenContainer";
import ActionButton from "../components/ActionButton";
import { theme } from "../theme";

const LandingScreen = ({ navigation, route }) => (
  <ScreenContainer navigation={navigation} routeName={route.name}>
    <View style={styles.heroCard}>
      <Text style={styles.kicker}>EVOTREE MOBILE</Text>
      <Text style={styles.title}>Explore Biological Diversity</Text>
      <Text style={styles.subtitle}>
        Use EvoTree to enter species names and build your own phylogenetic
        tree from taxonomy data.
      </Text>
      <ActionButton label="Get Started" onPress={() => navigation.navigate("Main")} />
    </View>
  </ScreenContainer>
);

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 20,
    backgroundColor: theme.colors.cardStrong,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  kicker: {
    color: theme.colors.subtleText,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  title: {
    color: theme.colors.text,
    textAlign: "center",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  subtitle: {
    color: theme.colors.mutedText,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
});

export default LandingScreen;
