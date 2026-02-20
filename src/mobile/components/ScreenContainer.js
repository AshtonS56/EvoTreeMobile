import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const ScreenContainer = ({
  navigation,
  routeName,
  children,
  scroll = true,
  contentContainerStyle,
}) => {
  const [headerHeight, setHeaderHeight] = useState(92);
  const [navHeight, setNavHeight] = useState(82);

  const handleHeaderLayout = useCallback((event) => {
    const nextHeight = event?.nativeEvent?.layout?.height || 0;
    setHeaderHeight((previous) =>
      Math.abs(previous - nextHeight) > 1 ? nextHeight : previous
    );
  }, []);

  const handleNavLayout = useCallback((event) => {
    const nextHeight = event?.nativeEvent?.layout?.height || 0;
    setNavHeight((previous) =>
      Math.abs(previous - nextHeight) > 1 ? nextHeight : previous
    );
  }, []);

  return (
    <View style={styles.background}>
      <View style={styles.accentGlowPrimary} pointerEvents="none" />
      <View style={styles.accentGlowSecondary} pointerEvents="none" />
      <View style={styles.accentGlowTertiary} pointerEvents="none" />
      <View style={styles.accentGlowQuaternary} pointerEvents="none" />
      <View style={styles.accentRingLarge} pointerEvents="none" />
      <View style={styles.accentRingMedium} pointerEvents="none" />
      <View style={styles.accentRingSmall} pointerEvents="none" />
      <View style={styles.accentDotOne} pointerEvents="none" />
      <View style={styles.accentDotTwo} pointerEvents="none" />
      <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.safeArea}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[styles.contentLayer, { paddingTop: headerHeight, paddingBottom: navHeight }]}
          >
            {scroll ? (
              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View style={[styles.contentWrap, contentContainerStyle]}>{children}</View>
              </ScrollView>
            ) : (
              <View style={[styles.body, styles.nonScrollContent]}>
                <View style={[styles.contentWrap, contentContainerStyle]}>{children}</View>
              </View>
            )}
          </View>

          <View style={styles.headerWrap} onLayout={handleHeaderLayout}>
            <TopBar />
          </View>

          <View style={styles.bottomWrap} onLayout={handleNavLayout}>
            <BottomNav navigation={navigation} routeName={routeName} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#060910",
    overflow: "hidden",
  },
  accentGlowPrimary: {
    position: "absolute",
    top: -170,
    right: -180,
    width: 430,
    height: 430,
    borderRadius: 220,
    backgroundColor: "rgba(86, 103, 178, 0.26)",
  },
  accentGlowSecondary: {
    position: "absolute",
    top: -70,
    right: -90,
    width: 290,
    height: 290,
    borderRadius: 150,
    backgroundColor: "rgba(145, 158, 232, 0.14)",
  },
  accentGlowTertiary: {
    position: "absolute",
    top: 190,
    left: -130,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(97, 112, 196, 0.14)",
  },
  accentGlowQuaternary: {
    position: "absolute",
    bottom: -180,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(224, 176, 112, 0.09)",
  },
  accentRingLarge: {
    position: "absolute",
    top: 340,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: "rgba(153, 166, 233, 0.16)",
    backgroundColor: "transparent",
  },
  accentRingMedium: {
    position: "absolute",
    bottom: 160,
    left: -90,
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: "rgba(132, 146, 216, 0.14)",
    backgroundColor: "transparent",
  },
  accentRingSmall: {
    position: "absolute",
    top: 110,
    left: 34,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "rgba(232, 191, 133, 0.16)",
    backgroundColor: "transparent",
  },
  accentDotOne: {
    position: "absolute",
    top: 262,
    right: 54,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(221, 180, 121, 0.22)",
  },
  accentDotTwo: {
    position: "absolute",
    bottom: 240,
    left: 42,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(145, 158, 232, 0.3)",
  },
  safeArea: {
    flex: 1,
  },
  contentLayer: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 22,
  },
  nonScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 22,
  },
  contentWrap: {
    width: "100%",
    maxWidth: 940,
    alignSelf: "center",
    gap: 14,
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
});

export default ScreenContainer;
