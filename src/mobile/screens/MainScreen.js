import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenContainer from "../components/ScreenContainer";
import ImageControls from "../components/ImageControls";
import TreePanel from "../components/TreePanel";
import LoadingOverlay from "../components/LoadingOverlay";
import { theme } from "../theme";
import {
  cloneTree,
  createEmptyTree,
  mergeTrees,
  normalizeRootDomainGrouping,
} from "../utils/treeUtils";

const MAIN_TREE_KEY = "evotree_main_tree_v1";
const COMMON_NAME_MIN_SCORE = 90;
const ANIMALIA_KINGDOM_KEY = 1;
const VERNACULAR_PAGE_SIZE = 100;
const VERNACULAR_MAX_PAGES = 3;
const MAX_VERNACULAR_ENRICH_CANDIDATES = 8;
const MAIN_TAXONOMY_RANK_ORDER = [
  "DOMAIN",
  "KINGDOM",
  "PHYLUM",
  "CLASS",
  "ORDER",
  "FAMILY",
  "GENUS",
  "SPECIES",
];
const MAIN_TAXONOMY_RANK_SET = new Set(MAIN_TAXONOMY_RANK_ORDER);
const DOMAIN_BY_KINGDOM_NAME = {
  animalia: "Eukaryota",
  fungi: "Eukaryota",
  plantae: "Eukaryota",
  chromista: "Eukaryota",
  protista: "Eukaryota",
  protozoa: "Eukaryota",
  bacteria: "Bacteria",
  archaea: "Archaea",
};
const COMMON_NAME_OVERRIDES = {
  cat: "Felis catus",
  cats: "Felis catus",
  dog: "Canis lupus familiaris",
  dogs: "Canis lupus familiaris",
};
const RANK_PRIORITY = {
  SPECIES: 0,
  SUBSPECIES: 1,
  VARIETY: 2,
  FORM: 3,
  GENUS: 4,
  FAMILY: 5,
  ORDER: 6,
  CLASS: 7,
  PHYLUM: 8,
  KINGDOM: 9,
};

const normalizeNameText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const isEnglishLikeLanguage = (value) => {
  const normalized = String(value || "").toLowerCase().trim();
  return !normalized || normalized === "eng" || normalized.startsWith("en");
};

const buildCommonNameVariants = (value) => {
  const base = normalizeNameText(value);
  const variants = new Set();

  if (base) {
    variants.add(base);
  }

  // Basic singularization helps with inputs like "cats", "dogs", "foxes", "butterflies".
  if (base.endsWith("ies") && base.length > 5) {
    variants.add(`${base.slice(0, -3)}y`);
  }

  if (base.endsWith("es") && base.length > 4) {
    variants.add(base.slice(0, -2));
  }

  if (base.endsWith("s") && base.length > 4 && !base.endsWith("ss")) {
    variants.add(base.slice(0, -1));
  }

  // Accept common US/UK spelling variants.
  if (base.includes("grey")) {
    variants.add(base.replaceAll("grey", "gray"));
  }
  if (base.includes("gray")) {
    variants.add(base.replaceAll("gray", "grey"));
  }

  return Array.from(variants);
};

const hasVernacularTokenMatch = (vernacular, queryValue) => {
  if (!vernacular || !queryValue) {
    return false;
  }

  return (
    vernacular === queryValue ||
    vernacular.startsWith(`${queryValue} `) ||
    vernacular.endsWith(` ${queryValue}`) ||
    vernacular.includes(` ${queryValue} `)
  );
};

const keepMainTaxonomyRanks = (path) => {
  const byRank = new Map();

  path.forEach((node) => {
    const rank = String(node?.rank || "").toUpperCase();
    if (!MAIN_TAXONOMY_RANK_SET.has(rank)) {
      return;
    }

    if (!byRank.has(rank)) {
      byRank.set(rank, node);
    }
  });

  if (!byRank.has("DOMAIN")) {
    const kingdomNode = byRank.get("KINGDOM");
    const inferredDomain =
      DOMAIN_BY_KINGDOM_NAME[normalizeNameText(kingdomNode?.name)] || null;

    if (inferredDomain) {
      byRank.set("DOMAIN", {
        name: inferredDomain,
        rank: "DOMAIN",
        key: `inferred-domain-${normalizeNameText(inferredDomain)}`,
      });
    }
  }

  return MAIN_TAXONOMY_RANK_ORDER.map((rank) => byRank.get(rank)).filter(Boolean);
};

const MainScreen = ({ navigation, route }) => {
  const [animalName, setAnimalName] = useState("");
  const [mainTreeData, setMainTreeData] = useState(createEmptyTree());
  const [previewTreeData, setPreviewTreeData] = useState(createEmptyTree());
  const [previewTaxonomyPath, setPreviewTaxonomyPath] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [loading, setLoading] = useState({ visible: false, label: "" });

  const vernacularCacheRef = useRef(new Map());

  const setLoadingState = (visible, label = "") => {
    setLoading({ visible, label });
  };

  useEffect(() => {
    let isMounted = true;

    const loadTree = async () => {
      try {
        const stored = await AsyncStorage.getItem(MAIN_TREE_KEY);
        if (isMounted && stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.name) {
            setMainTreeData(normalizeRootDomainGrouping(parsed));
          }
        }
      } catch {
        // Fall back to empty tree if local read fails.
      } finally {
        if (isMounted) {
          setStorageReady(true);
        }
      }
    };

    loadTree();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady || !mainTreeData) {
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(MAIN_TREE_KEY, JSON.stringify(mainTreeData));
      } catch {
        // Keep local tree state even if local save fails.
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [mainTreeData, storageReady]);

  const fetchFullTaxonomy = async (speciesKey) => {
    let currentKey = speciesKey;
    const path = [];

    while (currentKey) {
      const response = await fetch(`https://api.gbif.org/v1/species/${currentKey}`);
      const data = await response.json();
      const rank = String(data.rank || "").toUpperCase();

      path.unshift({
        name: data.canonicalName || data.scientificName || "Unknown",
        rank,
        key: currentKey,
        commonName: rank === "SPECIES" ? data.vernacularName || undefined : undefined,
      });

      currentKey = data.parentKey;
    }

    return keepMainTaxonomyRanks(path);
  };

  const isLikelyScientificName = (value) => {
    const trimmed = value.trim();
    return /^[A-Z][a-z-]+(\s+[a-z-]+){1,2}$/.test(trimmed);
  };

  const scoreSearchCandidate = (candidate, query, options = {}) => {
    const { preferCommonAnimalMatch = false } = options;
    const rank = String(candidate?.rank || "").toUpperCase();
    const rankScore = 30 - (RANK_PRIORITY[rank] ?? 20);
    const statusScore = candidate?.status === "ACCEPTED" ? 25 : 0;

    const queryValue = query.toLowerCase();
    const canonical = String(candidate?.canonicalName || "").toLowerCase();
    const scientific = String(candidate?.scientificName || "").toLowerCase();
    const vernacular = String(candidate?.vernacularName || "").toLowerCase();
    const kingdom = String(candidate?.kingdom || "").toLowerCase();
    const isAnimal = kingdom === "animalia";

    let textScore = 0;
    if (canonical === queryValue || vernacular === queryValue) {
      textScore = 35;
    } else if (
      canonical.includes(queryValue) ||
      scientific.includes(queryValue) ||
      vernacular.includes(queryValue)
    ) {
      textScore = 15;
    }

    const lineageScore = candidate?.parentKey ? 10 : 0;
    let total = rankScore + statusScore + textScore + lineageScore;

    if (preferCommonAnimalMatch) {
      if (vernacular === queryValue) {
        total += 140;
      } else if (vernacular.includes(queryValue)) {
        total += 80;
      }

      if (isAnimal) {
        total += 70;
      } else {
        total -= 60;
      }

      // Short common names should match vernacular fields, not just Latin text fragments.
      if (queryValue.length <= 4 && !hasVernacularTokenMatch(vernacular, queryValue)) {
        total -= 220;
      }

      // Avoid false positives like random Latin names containing short common words.
      if (queryValue.length <= 4 && vernacular !== queryValue && canonical.includes(queryValue)) {
        total -= 80;
      }
    }

    return total;
  };

  const pickBestSearchKey = (results, query, options = {}) => {
    const usable = Array.isArray(results)
      ? results.filter((item) => item?.key)
      : [];

    if (!usable.length) {
      return null;
    }

    const ranked = usable
      .map((item) => ({
        key: item.key,
        score: scoreSearchCandidate(item, query, options),
      }))
      .sort((a, b) => b.score - a.score);

    if (options.preferCommonAnimalMatch) {
      return ranked[0]?.score >= COMMON_NAME_MIN_SCORE ? ranked[0].key : null;
    }

    return ranked[0]?.key || null;
  };

  const fetchVernacularCandidates = async (commonNameVariant, animalsOnly = true) => {
    const kingdomFilter = animalsOnly ? `&kingdomKey=${ANIMALIA_KINGDOM_KEY}` : "";
    const response = await fetch(
      `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(
        commonNameVariant
      )}&qField=VERNACULAR&rank=SPECIES&status=ACCEPTED&limit=100${kingdomFilter}`
    );
    const data = await response.json();
    return Array.isArray(data?.results) ? data.results : [];
  };

  const fetchSpeciesVernacularAliases = async (speciesKey) => {
    if (!speciesKey) {
      return [];
    }

    const cached = vernacularCacheRef.current.get(speciesKey);
    if (cached) {
      return cached;
    }

    const all = [];
    let offset = 0;

    for (let page = 0; page < VERNACULAR_MAX_PAGES; page += 1) {
      const response = await fetch(
        `https://api.gbif.org/v1/species/${speciesKey}/vernacularNames?limit=${VERNACULAR_PAGE_SIZE}&offset=${offset}`
      );
      const data = await response.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      all.push(...results);

      if (data?.endOfRecords || !results.length) {
        break;
      }

      offset += data?.limit || VERNACULAR_PAGE_SIZE;
    }

    vernacularCacheRef.current.set(speciesKey, all);
    return all;
  };

  const scoreCommonCandidate = (candidate, variants) => {
    const variantSet = new Set(variants.map(normalizeNameText));
    const rank = String(candidate?.rank || "").toUpperCase();
    const rankScore = 30 - (RANK_PRIORITY[rank] ?? 20);
    const statusScore = candidate?.status === "ACCEPTED" ? 25 : 0;
    const lineageScore = candidate?.parentKey ? 10 : 0;
    const kingdom = String(candidate?.kingdom || "").toLowerCase();
    const isAnimal = kingdom === "animalia";

    const vernacular = normalizeNameText(candidate?.vernacularName);
    const canonical = normalizeNameText(candidate?.canonicalName);
    const scientific = normalizeNameText(candidate?.scientificName);

    let textScore = 0;
    if (variantSet.has(vernacular)) {
      textScore = 180;
    } else if (
      Array.from(variantSet).some(
        (query) => vernacular.startsWith(`${query} `) || vernacular.endsWith(` ${query}`)
      )
    ) {
      textScore = 95;
    } else if (
      Array.from(variantSet).some((query) => vernacular.includes(` ${query} `))
    ) {
      textScore = 70;
    } else if (
      Array.from(variantSet).some((query) => canonical === query || scientific.startsWith(query))
    ) {
      textScore = 15;
    }

    const queryIsShort = Array.from(variantSet).some((query) => query.length <= 4);
    let total = textScore + rankScore + statusScore + lineageScore;

    if (isAnimal) {
      total += 70;
    } else {
      total -= 60;
    }

    if (
      queryIsShort &&
      !Array.from(variantSet).some((query) => hasVernacularTokenMatch(vernacular, query))
    ) {
      total -= 220;
    }

    return total;
  };

  const scoreAliasList = (aliases, variants) => {
    if (!aliases.length || !variants.length) {
      return 0;
    }

    const aliasSet = new Set(aliases);
    const longVariants = variants.filter((variant) => variant.length > 4);

    if (variants.some((variant) => aliasSet.has(variant))) {
      return 250;
    }

    if (
      variants.some((variant) =>
        aliases.some((alias) => hasVernacularTokenMatch(alias, variant))
      )
    ) {
      return 120;
    }

    if (
      longVariants.some((variant) =>
        aliases.some((alias) => alias.includes(variant))
      )
    ) {
      return 75;
    }

    return 0;
  };

  const pickBestCommonNameKeyWithAliasEnrichment = async (results, variants) => {
    const usable = Array.isArray(results)
      ? results.filter((item) => item?.key)
      : [];

    if (!usable.length) {
      return null;
    }

    const baseRanked = usable
      .map((item) => ({
        item,
        key: item.key,
        score: scoreCommonCandidate(item, variants),
      }))
      .sort((a, b) => b.score - a.score);

    const topCandidates = baseRanked.slice(0, MAX_VERNACULAR_ENRICH_CANDIDATES);

    await Promise.all(
      topCandidates.map(async (candidate) => {
        try {
          const rows = await fetchSpeciesVernacularAliases(candidate.key);
          const preferredAliases = rows
            .filter((row) => isEnglishLikeLanguage(row?.language))
            .map((row) => normalizeNameText(row?.vernacularName))
            .filter(Boolean);

          const fallbackAliases = rows
            .map((row) => normalizeNameText(row?.vernacularName))
            .filter(Boolean);

          const aliasPool = preferredAliases.length ? preferredAliases : fallbackAliases;
          candidate.score += scoreAliasList(aliasPool, variants);
        } catch {
          // Preserve base score if alias lookup fails.
        }
      })
    );

    topCandidates.sort((a, b) => b.score - a.score);
    const winner = topCandidates[0] || baseRanked[0];
    return winner?.score >= COMMON_NAME_MIN_SCORE ? winner.key : null;
  };

  const pickExactScientificKey = (results, scientificName) => {
    const target = scientificName.toLowerCase();
    const usable = Array.isArray(results)
      ? results.filter((item) => item?.key)
      : [];

    if (!usable.length) {
      return null;
    }

    const exactCanonical = usable.find(
      (item) => String(item?.canonicalName || "").toLowerCase() === target
    );
    if (exactCanonical) {
      return exactCanonical.key;
    }

    const exactScientific = usable.find((item) =>
      String(item?.scientificName || "").toLowerCase().startsWith(target)
    );
    if (exactScientific) {
      return exactScientific.key;
    }

    return usable[0].key;
  };

  const resolveScientificNameKey = async (scientificName) => {
    const encodedValue = encodeURIComponent(scientificName);

    const matchResponse = await fetch(
      `https://api.gbif.org/v1/species/match?name=${encodedValue}`
    );
    const matchData = await matchResponse.json();
    const directKey = matchData?.speciesKey || matchData?.acceptedUsageKey || null;
    if (directKey) {
      return directKey;
    }

    const speciesSearchResponse = await fetch(
      `https://api.gbif.org/v1/species/search?q=${encodedValue}&rank=SPECIES&status=ACCEPTED&limit=50`
    );
    const speciesSearchData = await speciesSearchResponse.json();
    const exactKey = pickExactScientificKey(speciesSearchData?.results, scientificName);
    if (exactKey) {
      return exactKey;
    }

    const broadSearchResponse = await fetch(
      `https://api.gbif.org/v1/species/search?q=${encodedValue}&limit=50`
    );
    const broadSearchData = await broadSearchResponse.json();
    return pickExactScientificKey(broadSearchData?.results, scientificName);
  };

  const resolveSpeciesKey = async (value) => {
    const encodedValue = encodeURIComponent(value);
    const normalizedValue = value.trim().toLowerCase();
    const scientificName = isLikelyScientificName(value);

    // Deterministic common-name overrides are evaluated first.
    const overrideScientificName = COMMON_NAME_OVERRIDES[normalizedValue];
    if (overrideScientificName) {
      return resolveScientificNameKey(overrideScientificName);
    }

    if (scientificName) {
      return resolveScientificNameKey(value.trim());
    }

    const variants = buildCommonNameVariants(value);
    if (variants.length) {
      const byKey = new Map();
      for (const variant of variants) {
        const candidates = await fetchVernacularCandidates(variant, true);
        candidates.forEach((item) => {
          if (item?.key && !byKey.has(item.key)) {
            byKey.set(item.key, item);
          }
        });
      }

      const vernacularKey = await pickBestCommonNameKeyWithAliasEnrichment(
        Array.from(byKey.values()),
        variants
      );
      if (vernacularKey) {
        return vernacularKey;
      }

      // Fallback: if no animal vernacular match exists, try broader vernacular data.
      const broadByKey = new Map();
      for (const variant of variants) {
        const candidates = await fetchVernacularCandidates(variant, false);
        candidates.forEach((item) => {
          if (item?.key && !broadByKey.has(item.key)) {
            broadByKey.set(item.key, item);
          }
        });
      }

      const broadVernacularKey = await pickBestCommonNameKeyWithAliasEnrichment(
        Array.from(broadByKey.values()),
        variants
      );
      if (broadVernacularKey) {
        return broadVernacularKey;
      }
    }

    const broadSearchResponse = await fetch(
      `https://api.gbif.org/v1/species/search?q=${encodedValue}&rank=SPECIES&status=ACCEPTED&kingdomKey=${ANIMALIA_KINGDOM_KEY}&limit=100`
    );
    const broadSearchData = await broadSearchResponse.json();
    const broadKey = pickBestSearchKey(broadSearchData?.results, value, {
      preferCommonAnimalMatch: true,
    });

    if (broadKey) {
      return broadKey;
    }

    const fallbackSearchResponse = await fetch(
      `https://api.gbif.org/v1/species/search?q=${encodedValue}&rank=SPECIES&status=ACCEPTED&limit=100`
    );
    const fallbackSearchData = await fallbackSearchResponse.json();
    const fallbackKey = pickBestSearchKey(fallbackSearchData?.results, value, {
      preferCommonAnimalMatch: true,
    });

    if (fallbackKey) {
      return fallbackKey;
    }

    // Avoid weak lexical fallbacks for common names (prevents mismatches like "cat" -> nematodes).
    return null;
  };

  const addSpeciesToTree = async () => {
    const value = animalName.trim();
    if (!value) {
      Alert.alert("Missing Name", "Please enter a species name first.");
      return;
    }

    setLoadingState(true, "Building preview...");

    try {
      const resolvedKey = await resolveSpeciesKey(value);

      if (!resolvedKey) {
        Alert.alert(
          "Not Found",
          "Species not found. Try the scientific name (for example: Panthera leo)."
        );
        return;
      }

      const taxonomyPath = await fetchFullTaxonomy(resolvedKey);
      const matchedSpeciesName = taxonomyPath[taxonomyPath.length - 1]?.name || "";

      const previewTree = mergeTrees(createEmptyTree(), taxonomyPath);
      setPreviewTreeData(previewTree);
      setPreviewTaxonomyPath(taxonomyPath);

      if (matchedSpeciesName) {
        setAnimalName(matchedSpeciesName);
      }

      if (
        matchedSpeciesName &&
        matchedSpeciesName.toLowerCase() !== value.toLowerCase()
      ) {
        Alert.alert("Matched Species", `Previewing as ${matchedSpeciesName}.`);
      }
    } catch (error) {
      Alert.alert("Tree Update Error", error.message || "Failed to add species.");
    } finally {
      setLoadingState(false);
    }
  };

  const clearTreeData = () => {
    setPreviewTreeData(createEmptyTree());
    setPreviewTaxonomyPath([]);
  };

  const addPreviewToMainTree = () => {
    if (!previewTaxonomyPath.length) {
      Alert.alert(
        "Nothing To Add",
        "Preview a species first, then use this button to add it to your main tree."
      );
      return;
    }

    const matchedSpeciesName =
      previewTaxonomyPath[previewTaxonomyPath.length - 1]?.name || "species";

    setMainTreeData((previous) => {
      const baseTree = cloneTree(previous);
      return mergeTrees(baseTree, previewTaxonomyPath);
    });

    Alert.alert("Added", `${matchedSpeciesName} was added to your main tree.`);
  };

  return (
    <ScreenContainer navigation={navigation} routeName={route.name}>
      <View style={styles.layout}>
        <ImageControls
          animalName={animalName}
          onAnimalNameChange={setAnimalName}
          onAddSpecies={addSpeciesToTree}
          disabled={loading.visible || !storageReady}
        />

        <TreePanel
          title="Species Preview"
          treeData={previewTreeData}
          onSaveTree={addPreviewToMainTree}
          onClearTree={clearTreeData}
          saveLabel="Add Species To Main Tree"
          saveVariant="primary"
          saveDisabled={!previewTaxonomyPath.length || loading.visible}
          clearLabel="Clear Preview"
        />
      </View>

      <LoadingOverlay visible={loading.visible} label={loading.label} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  layout: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
});

export default MainScreen;
