import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { theme } from "../theme";

const NODE_RADIUS = 7;
const SIBLING_GAP = 170;
const DEPTH_GAP = 120;
const PAD_X = 36;
const PAD_Y = 36;
const MAX_LABEL_LENGTH = 42;

const truncateLabel = (label) => {
  const value = String(label || "Unknown");
  if (value.length <= MAX_LABEL_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_LABEL_LENGTH - 3)}...`;
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

const TreeCanvas = ({ treeData, fillHeight = false }, captureRef) => {
  const layout = useMemo(() => buildLayout(treeData), [treeData]);
  const hasTree = Array.isArray(treeData?.children) && treeData.children.length > 0;
  const { height: windowHeight } = useWindowDimensions();
  const viewportHeight = Math.min(540, Math.max(300, Math.floor(windowHeight * 0.52)));
  const horizontalScrollRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const nodeMap = useMemo(
    () => new Map(layout.nodes.map((node) => [node.id, node])),
    [layout.nodes]
  );

  useEffect(() => {
    if (!hasTree || !viewportWidth || !horizontalScrollRef.current) {
      return;
    }

    const targetX = Math.max(0, layout.rootX - viewportWidth / 2);
    horizontalScrollRef.current.scrollTo({ x: targetX, y: 0, animated: false });
  }, [hasTree, layout.rootX, viewportWidth]);

  if (!hasTree) {
    return (
      <View style={[styles.emptyState, fillHeight && styles.emptyStateFill]}>
        <Text style={styles.emptyText}>Add species to build your tree.</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.viewport, fillHeight ? styles.viewportFill : { height: viewportHeight }]}
      onLayout={(event) => {
        const nextWidth = event?.nativeEvent?.layout?.width || 0;
        setViewportWidth(nextWidth);
      }}
    >
      <ScrollView
        ref={horizontalScrollRef}
        style={styles.scrollFill}
        horizontal
        nestedScrollEnabled
        directionalLockEnabled={false}
        showsHorizontalScrollIndicator
      >
        <ScrollView
          style={styles.scrollFill}
          nestedScrollEnabled
          directionalLockEnabled={false}
          contentContainerStyle={[
            styles.verticalContainer,
            { minHeight: layout.height, minWidth: layout.width },
          ]}
          showsVerticalScrollIndicator
        >
          <View ref={captureRef} collapsable={false} style={styles.captureRoot}>
            <Svg width={layout.width} height={layout.height}>
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
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {layout.nodes.map((node) => (
                <React.Fragment key={node.id}>
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS}
                    fill={theme.colors.primary}
                  />
                  <SvgText
                    x={node.x}
                    y={node.y - NODE_RADIUS - 8}
                    fontSize="12"
                    fill={theme.colors.text}
                    textAnchor="middle"
                  >
                    {truncateLabel(node.label)}
                  </SvgText>
                </React.Fragment>
              ))}
            </Svg>
          </View>
        </ScrollView>
      </ScrollView>
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
