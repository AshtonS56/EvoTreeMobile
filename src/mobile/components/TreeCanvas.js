import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../theme";

const NODE_RADIUS = 7;
const SIBLING_GAP = 170;
const DEPTH_GAP = 120;
const PAD_X = 36;
const PAD_Y = 36;
const LABEL_WRAP_LENGTH = 15;
const NODE_LABEL_FONT_SIZE = 14;
const NODE_LABEL_VERTICAL_GAP = 10;
const NODE_LABEL_LINE_HEIGHT = 15;
const BRANCH_STROKE_WIDTH = 2.6;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.2;
const clampZoom = (value) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
const clampZoomWorklet = (value) => {
  "worklet";
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
};
const clampOffsetWorklet = (value, contentSize, viewportSize) => {
  "worklet";
  const maxOffset = Math.max(0, (contentSize - viewportSize) / 2);
  return Math.max(-maxOffset, Math.min(maxOffset, value));
};
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const splitLabelIntoLines = (label) => {
  const value = String(label || "Unknown").replace(/\s+/g, " ").trim();
  if (!value) {
    return ["Unknown"];
  }

  const words = value.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= LABEL_WRAP_LENGTH || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [value];
};

const normalizeLabelText = (value) => String(value || "").trim().toLowerCase();

const buildNodeLabel = (node) => {
  const scientific = String(node?.name || "Unknown").trim();
  const common = String(node?.commonName || "").trim();

  if (!common) {
    return scientific;
  }

  const normalizedScientific = normalizeLabelText(scientific);
  const normalizedCommon = normalizeLabelText(common);

  if (
    !normalizedCommon ||
    normalizedCommon === "unknown" ||
    normalizedCommon === normalizedScientific
  ) {
    return scientific;
  }

  return `${scientific} (${common})`;
};

const buildLayout = (treeData) => {
  if (!treeData || !treeData.name) {
    return { nodes: [], links: [], width: 420, height: 280, rootX: 210 };
  }

  let leafIndex = 0;
  let idCounter = 0;
  let maxDepth = 0;

  const nodes = [];
  const links = [];

  const walk = (node, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const id = String(idCounter++);
    const children = Array.isArray(node.children) ? node.children : [];
    const y = PAD_Y + depth * DEPTH_GAP;

    if (children.length === 0) {
      const x = PAD_X + leafIndex * SIBLING_GAP;
      leafIndex += 1;
      nodes.push({ id, x, y, label: buildNodeLabel(node) });
      return { id, x, y };
    }

    const childPositions = children.map((child) => walk(child, depth + 1));
    const averageX =
      childPositions.reduce((sum, current) => sum + current.x, 0) /
      childPositions.length;

    nodes.push({ id, x: averageX, y, label: buildNodeLabel(node) });
    childPositions.forEach((childPosition) => {
      links.push({ from: id, to: childPosition.id });
    });

    return { id, x: averageX, y };
  };

  walk(treeData, 0);

  const rootNode = nodes.find((node) => node.id === "0") || nodes[0];
  const rootX = rootNode?.x ?? PAD_X;
  const minX = Math.min(...nodes.map((node) => node.x));
  const maxX = Math.max(...nodes.map((node) => node.x));
  const leftSpan = Math.max(0, rootX - minX);
  const rightSpan = Math.max(0, maxX - rootX);
  const horizontalRadius = Math.max(leftSpan, rightSpan);
  const width = Math.max(420, Math.ceil(horizontalRadius * 2 + PAD_X * 2 + 140));
  const height = Math.max(360, PAD_Y * 2 + maxDepth * DEPTH_GAP + 120);
  const centeredRootX = width / 2;
  const xShift = centeredRootX - rootX;
  const centeredNodes = nodes.map((node) => ({ ...node, x: node.x + xShift }));

  return { nodes: centeredNodes, links, width, height, rootX: centeredRootX };
};

const buildRoundedBranchPath = (startX, startY, endX, endY) => {
  const midY = startY + (endY - startY) / 2;
  const dx = endX - startX;
  const directionX = dx >= 0 ? 1 : -1;
  const radius = Math.min(
    18,
    Math.abs(dx) / 2,
    Math.abs(midY - startY),
    Math.abs(endY - midY)
  );

  if (radius < 1) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  const firstCornerY = midY - radius;
  const secondCornerY = midY + radius;
  const firstCornerX = startX + directionX * radius;
  const secondEntryX = endX - directionX * radius;

  return [
    `M ${startX} ${startY}`,
    `L ${startX} ${firstCornerY}`,
    `Q ${startX} ${midY} ${firstCornerX} ${midY}`,
    `L ${secondEntryX} ${midY}`,
    `Q ${endX} ${midY} ${endX} ${secondCornerY}`,
    `L ${endX} ${endY}`,
  ].join(" ");
};

const TreeCanvas = (
  {
    treeData,
    fillHeight = false,
    fitToViewport = false,
    zoomEnabled = false,
    preferredHeight,
  },
  captureRef
) => {
  const layout = useMemo(() => buildLayout(treeData), [treeData]);
  const hasTree = Array.isArray(treeData?.children) && treeData.children.length > 0;
  const { height: windowHeight } = useWindowDimensions();
  const viewportHeight = Math.min(540, Math.max(300, Math.floor(windowHeight * 0.52)));
  const compactViewportHeight = Number(preferredHeight) || viewportHeight;
  const horizontalScrollRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const animatedZoom = useSharedValue(1);
  const pinchStartZoom = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const baseWidthShared = useSharedValue(1);
  const baseHeightShared = useSharedValue(1);
  const viewportWidthShared = useSharedValue(1);
  const viewportHeightShared = useSharedValue(1);

  const nodeMap = useMemo(
    () => new Map(layout.nodes.map((node) => [node.id, node])),
    [layout.nodes]
  );

  const fitScale = useMemo(() => {
    if (!fitToViewport || !viewportSize.width || !viewportSize.height) {
      return 1;
    }

    const horizontalPadding = 14;
    const verticalPadding = 14;
    const availableWidth = Math.max(1, viewportSize.width - horizontalPadding);
    const availableHeight = Math.max(1, viewportSize.height - verticalPadding);
    const scaleByWidth = availableWidth / layout.width;
    const scaleByHeight = availableHeight / layout.height;

    return Math.min(1, scaleByWidth, scaleByHeight);
  }, [fitToViewport, layout.height, layout.width, viewportSize.height, viewportSize.width]);

  const baseRenderedWidth = Math.max(1, Math.round(layout.width * fitScale));
  const baseRenderedHeight = Math.max(1, Math.round(layout.height * fitScale));
  const renderedWidth = Math.max(1, Math.round(baseRenderedWidth * zoomLevel));
  const renderedHeight = Math.max(1, Math.round(baseRenderedHeight * zoomLevel));
  const contentWidth = fitToViewport
    ? Math.max(renderedWidth, viewportSize.width || renderedWidth)
    : renderedWidth;
  const contentHeight = fitToViewport
    ? Math.max(renderedHeight, viewportSize.height || renderedHeight)
    : renderedHeight;
  const zoomCaptureWidth = fitToViewport
    ? Math.max(baseRenderedWidth, viewportSize.width || baseRenderedWidth)
    : baseRenderedWidth;
  const zoomCaptureHeight = fitToViewport
    ? Math.max(baseRenderedHeight, viewportSize.height || baseRenderedHeight)
    : baseRenderedHeight;

  useEffect(() => {
    if (
      !hasTree ||
      fitToViewport ||
      !viewportSize.width ||
      !horizontalScrollRef.current
    ) {
      return;
    }

    const targetX = Math.max(0, layout.rootX - viewportSize.width / 2);
    horizontalScrollRef.current.scrollTo({ x: targetX, y: 0, animated: false });
  }, [fitToViewport, hasTree, layout.rootX, viewportSize.width]);

  useEffect(() => {
    setZoomLevel(1);
    animatedZoom.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
  }, [animatedZoom, offsetX, offsetY, treeData, fitToViewport]);

  useEffect(() => {
    baseWidthShared.value = baseRenderedWidth;
    baseHeightShared.value = baseRenderedHeight;
    viewportWidthShared.value = viewportSize.width || 1;
    viewportHeightShared.value = viewportSize.height || 1;
  }, [
    baseHeightShared,
    baseRenderedHeight,
    baseRenderedWidth,
    baseWidthShared,
    viewportHeightShared,
    viewportSize.height,
    viewportSize.width,
    viewportWidthShared,
  ]);

  const setZoomLevelSafe = useCallback((nextValue) => {
    const normalized = Number(clampZoom(nextValue).toFixed(2));
    setZoomLevel((previous) =>
      Math.abs(previous - normalized) < 0.01 ? previous : normalized
    );
  }, []);

  const applyZoomFromControls = useCallback(
    (nextValue) => {
      const normalized = Number(clampZoom(nextValue).toFixed(2));
      setZoomLevelSafe(normalized);

      animatedZoom.value = withTiming(normalized, { duration: 140 });

      const clampedX = clampOffsetWorklet(
        offsetX.value,
        baseWidthShared.value * normalized,
        viewportWidthShared.value
      );
      const clampedY = clampOffsetWorklet(
        offsetY.value,
        baseHeightShared.value * normalized,
        viewportHeightShared.value
      );

      offsetX.value = withTiming(clampedX, { duration: 140 });
      offsetY.value = withTiming(clampedY, { duration: 140 });
    },
    [
      animatedZoom,
      baseHeightShared,
      baseWidthShared,
      offsetX,
      offsetY,
      setZoomLevelSafe,
      viewportHeightShared,
      viewportWidthShared,
    ]
  );

  const zoomOutDisabled = zoomLevel <= ZOOM_MIN;
  const zoomInDisabled = zoomLevel >= ZOOM_MAX;

  const zoomOut = () => {
    applyZoomFromControls(zoomLevel - ZOOM_STEP);
  };

  const zoomIn = () => {
    applyZoomFromControls(zoomLevel + ZOOM_STEP);
  };

  const resetZoom = () => {
    applyZoomFromControls(1);
  };

  const animatedSvgProps = useAnimatedProps(() => ({
    width: baseWidthShared.value * animatedZoom.value,
    height: baseHeightShared.value * animatedZoom.value,
  }));

  const zoomLayerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
    ],
  }));

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(zoomEnabled)
        .onBegin(() => {
          panStartX.value = offsetX.value;
          panStartY.value = offsetY.value;
        })
        .onUpdate((event) => {
          const currentZoom = animatedZoom.value;
          const nextX = panStartX.value + event.translationX;
          const nextY = panStartY.value + event.translationY;
          offsetX.value = clampOffsetWorklet(
            nextX,
            baseWidthShared.value * currentZoom,
            viewportWidthShared.value
          );
          offsetY.value = clampOffsetWorklet(
            nextY,
            baseHeightShared.value * currentZoom,
            viewportHeightShared.value
          );
        }),
    [
      animatedZoom,
      baseHeightShared,
      baseWidthShared,
      offsetX,
      offsetY,
      panStartX,
      panStartY,
      viewportHeightShared,
      viewportWidthShared,
      zoomEnabled,
    ]
  );

  const finishPinchGesture = useCallback(
    (nextValue) => {
      setZoomLevelSafe(nextValue);
      setIsPinching(false);
    },
    [setZoomLevelSafe]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(zoomEnabled)
        .onBegin(() => {
          pinchStartZoom.value = animatedZoom.value;
          runOnJS(setIsPinching)(true);
        })
        .onUpdate((event) => {
          const nextZoom = clampZoomWorklet(pinchStartZoom.value * event.scale);
          const previousZoom = animatedZoom.value || 1;
          const focalX = event.focalX - viewportWidthShared.value / 2;
          const focalY = event.focalY - viewportHeightShared.value / 2;
          const worldX = (focalX - offsetX.value) / previousZoom;
          const worldY = (focalY - offsetY.value) / previousZoom;
          const nextX = focalX - worldX * nextZoom;
          const nextY = focalY - worldY * nextZoom;

          animatedZoom.value = nextZoom;
          offsetX.value = clampOffsetWorklet(
            nextX,
            baseWidthShared.value * nextZoom,
            viewportWidthShared.value
          );
          offsetY.value = clampOffsetWorklet(
            nextY,
            baseHeightShared.value * nextZoom,
            viewportHeightShared.value
          );
        })
        .onEnd(() => {
          runOnJS(finishPinchGesture)(animatedZoom.value);
        })
        .onFinalize(() => {
          runOnJS(setIsPinching)(false);
        }),
    [
      animatedZoom,
      baseHeightShared,
      baseWidthShared,
      finishPinchGesture,
      offsetX,
      offsetY,
      pinchStartZoom,
      viewportHeightShared,
      viewportWidthShared,
      zoomEnabled,
    ]
  );

  const zoomGesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, panGesture),
    [panGesture, pinchGesture]
  );

  if (!hasTree) {
    return (
      <View style={[styles.emptyState, fillHeight && styles.emptyStateFill]}>
        <Text style={styles.emptyText}>Add species to build your tree.</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.viewport,
        fillHeight ? styles.viewportFill : { height: Math.max(170, compactViewportHeight) },
      ]}
      onLayout={(event) => {
        const nextWidth = event?.nativeEvent?.layout?.width || 0;
        const nextHeight = event?.nativeEvent?.layout?.height || 0;
        setViewportSize((previous) => {
          if (previous.width === nextWidth && previous.height === nextHeight) {
            return previous;
          }
          return { width: nextWidth, height: nextHeight };
        });
      }}
    >
      {zoomEnabled ? (
        <View style={styles.zoomControls}>
          <Pressable
            onPress={zoomOut}
            disabled={zoomOutDisabled}
            style={({ pressed }) => [
              styles.zoomButton,
              pressed && !zoomOutDisabled && styles.zoomPressed,
              zoomOutDisabled && styles.zoomDisabled,
            ]}
          >
            <Text style={styles.zoomText}>-</Text>
          </Pressable>
          <Pressable
            onPress={resetZoom}
            style={({ pressed }) => [styles.zoomButton, pressed && styles.zoomPressed]}
          >
            <Text style={styles.zoomText}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={zoomIn}
            disabled={zoomInDisabled}
            style={({ pressed }) => [
              styles.zoomButton,
              pressed && !zoomInDisabled && styles.zoomPressed,
              zoomInDisabled && styles.zoomDisabled,
            ]}
          >
            <Text style={styles.zoomText}>+</Text>
          </Pressable>
        </View>
      ) : null}
      {zoomEnabled ? (
        <GestureDetector gesture={zoomGesture}>
          <View style={styles.zoomHost}>
            <View
              ref={captureRef}
              collapsable={false}
              style={[
                styles.captureRoot,
                fitToViewport && styles.captureRootFit,
                {
                  width: zoomCaptureWidth,
                  minHeight: zoomCaptureHeight,
                  height: fitToViewport ? zoomCaptureHeight : undefined,
                },
              ]}
            >
              <Animated.View style={zoomLayerStyle}>
                <AnimatedSvg
                  animatedProps={animatedSvgProps}
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {layout.links.map((link, index) => {
                    const from = nodeMap.get(link.from);
                    const to = nodeMap.get(link.to);
                    if (!from || !to) {
                      return null;
                    }

                    const startX = from.x;
                    const startY = from.y + NODE_RADIUS;
                    const endX = to.x;
                    const endY = to.y - NODE_RADIUS;
                    const path = buildRoundedBranchPath(startX, startY, endX, endY);

                    return (
                      <Path
                        key={`${link.from}-${link.to}-${index}`}
                        d={path}
                        fill="none"
                        stroke={theme.colors.border}
                        strokeWidth={BRANCH_STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}

                  {layout.nodes.map((node) => {
                    const labelLines = splitLabelIntoLines(node.label);
                    const labelStartY =
                      node.y -
                      NODE_RADIUS -
                      NODE_LABEL_VERTICAL_GAP -
                      (labelLines.length - 1) * NODE_LABEL_LINE_HEIGHT;

                    return (
                      <React.Fragment key={node.id}>
                        <Circle
                          cx={node.x}
                          cy={node.y}
                          r={NODE_RADIUS}
                          fill={theme.colors.primary}
                        />
                        {labelLines.map((line, index) => (
                          <SvgText
                            key={`${node.id}-line-${index}`}
                            x={node.x}
                            y={labelStartY + index * NODE_LABEL_LINE_HEIGHT}
                            fontSize={NODE_LABEL_FONT_SIZE}
                            fill={theme.colors.text}
                            textAnchor="middle"
                          >
                            {line}
                          </SvgText>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </AnimatedSvg>
              </Animated.View>
            </View>
          </View>
        </GestureDetector>
      ) : (
        <View style={styles.scrollHost}>
          <ScrollView
            ref={horizontalScrollRef}
            style={styles.scrollFill}
            horizontal
            nestedScrollEnabled
            directionalLockEnabled={false}
            showsHorizontalScrollIndicator
            scrollEnabled={!isPinching}
          >
            <ScrollView
              style={styles.scrollFill}
              nestedScrollEnabled
              directionalLockEnabled={false}
              contentContainerStyle={[
                styles.verticalContainer,
                {
                  minHeight: contentHeight,
                  minWidth: contentWidth,
                  alignItems: fitToViewport ? "center" : "stretch",
                },
              ]}
              showsVerticalScrollIndicator
              scrollEnabled={!isPinching}
            >
              <View
                ref={captureRef}
                collapsable={false}
                style={[
                  styles.captureRoot,
                  fitToViewport && styles.captureRootFit,
                  {
                    width: contentWidth,
                    minHeight: contentHeight,
                    height: fitToViewport ? contentHeight : undefined,
                  },
                ]}
              >
                <Svg
                  width={renderedWidth}
                  height={renderedHeight}
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {layout.links.map((link, index) => {
                    const from = nodeMap.get(link.from);
                    const to = nodeMap.get(link.to);
                    if (!from || !to) {
                      return null;
                    }

                    const startX = from.x;
                    const startY = from.y + NODE_RADIUS;
                    const endX = to.x;
                    const endY = to.y - NODE_RADIUS;
                    const path = buildRoundedBranchPath(startX, startY, endX, endY);

                    return (
                      <Path
                        key={`${link.from}-${link.to}-${index}`}
                        d={path}
                        fill="none"
                        stroke={theme.colors.border}
                        strokeWidth={BRANCH_STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}

                  {layout.nodes.map((node) => {
                    const labelLines = splitLabelIntoLines(node.label);
                    const labelStartY =
                      node.y -
                      NODE_RADIUS -
                      NODE_LABEL_VERTICAL_GAP -
                      (labelLines.length - 1) * NODE_LABEL_LINE_HEIGHT;

                    return (
                      <React.Fragment key={node.id}>
                        <Circle
                          cx={node.x}
                          cy={node.y}
                          r={NODE_RADIUS}
                          fill={theme.colors.primary}
                        />
                        {labelLines.map((line, index) => (
                          <SvgText
                            key={`${node.id}-line-${index}`}
                            x={node.x}
                            y={labelStartY + index * NODE_LABEL_LINE_HEIGHT}
                            fontSize={NODE_LABEL_FONT_SIZE}
                            fill={theme.colors.text}
                            textAnchor="middle"
                          >
                            {line}
                          </SvgText>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </Svg>
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    overflow: "hidden",
  },
  viewportFill: {
    flex: 1,
    minHeight: 320,
  },
  scrollFill: {
    flex: 1,
  },
  scrollHost: {
    flex: 1,
  },
  zoomHost: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalContainer: {
    justifyContent: "center",
  },
  captureRoot: {
    backgroundColor: "#0c1222",
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    minHeight: 300,
  },
  captureRootFit: {
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomControls: {
    position: "absolute",
    zIndex: 5,
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  zoomButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(8, 12, 22, 0.92)",
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    minWidth: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomPressed: {
    opacity: 0.85,
  },
  zoomDisabled: {
    opacity: 0.45,
  },
  zoomText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  emptyState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.input,
    padding: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  emptyStateFill: {
    flex: 1,
  },
});

export default forwardRef(TreeCanvas);
