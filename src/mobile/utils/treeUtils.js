export const createEmptyTree = () => ({ name: "Life", children: [] });

export const firstWordStartsWithCapital = (value) => {
  const input = String(value || "").trim();
  if (!input) {
    return false;
  }

  return /^[A-Z]/.test(input);
};

export const mergeTrees = (existingTree, newPath) => {
  let currentNode = existingTree;

  newPath.forEach((taxon) => {
    const children = Array.isArray(currentNode.children)
      ? currentNode.children
      : (currentNode.children = []);

    let existingChild = children.find((child) => child.name === taxon.name);
    if (!existingChild) {
      existingChild = {
        name: taxon.name,
        children: [],
      };

      if (taxon.commonName) {
        existingChild.commonName = taxon.commonName;
      }

      children.push(existingChild);
    }

    if (taxon.commonName && !existingChild.commonName) {
      existingChild.commonName = taxon.commonName;
    }

    currentNode = existingChild;
  });

  return existingTree;
};

export const cloneTree = (tree) =>
  JSON.parse(JSON.stringify(tree || createEmptyTree()));

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

const normalizeNodeName = (value) => String(value || "").trim().toLowerCase();

const mergeNodeChildren = (targetNode, sourceNode) => {
  if (!targetNode || !sourceNode) {
    return;
  }

  if (sourceNode.commonName && !targetNode.commonName) {
    targetNode.commonName = sourceNode.commonName;
  }

  const sourceChildren = Array.isArray(sourceNode.children) ? sourceNode.children : [];
  if (!sourceChildren.length) {
    return;
  }

  if (!Array.isArray(targetNode.children)) {
    targetNode.children = [];
  }

  sourceChildren.forEach((sourceChild) => {
    const existingChild = targetNode.children.find(
      (targetChild) =>
        normalizeNodeName(targetChild?.name) === normalizeNodeName(sourceChild?.name)
    );

    if (!existingChild) {
      targetNode.children.push(sourceChild);
      return;
    }

    mergeNodeChildren(existingChild, sourceChild);
  });
};

export const normalizeRootDomainGrouping = (tree) => {
  const root = cloneTree(tree || createEmptyTree());

  if (!Array.isArray(root.children) || !root.children.length) {
    return root;
  }

  const keepChildren = [];
  const pendingMoves = [];

  root.children.forEach((child) => {
    const kingdomName = normalizeNodeName(child?.name);
    const inferredDomain = DOMAIN_BY_KINGDOM_NAME[kingdomName];

    if (inferredDomain && normalizeNodeName(inferredDomain) !== kingdomName) {
      pendingMoves.push({ child, inferredDomain });
      return;
    }

    keepChildren.push(child);
  });

  if (!pendingMoves.length) {
    return root;
  }

  root.children = keepChildren;

  pendingMoves.forEach(({ child, inferredDomain }) => {
    let domainNode = root.children.find(
      (existingChild) =>
        normalizeNodeName(existingChild?.name) === normalizeNodeName(inferredDomain)
    );

    if (!domainNode) {
      domainNode = { name: inferredDomain, children: [] };
      root.children.push(domainNode);
    } else if (!Array.isArray(domainNode.children)) {
      domainNode.children = [];
    }

    const existingKingdomNode = domainNode.children.find(
      (existingChild) =>
        normalizeNodeName(existingChild?.name) === normalizeNodeName(child?.name)
    );

    if (!existingKingdomNode) {
      domainNode.children.push(child);
      return;
    }

    mergeNodeChildren(existingKingdomNode, child);
  });

  return root;
};
