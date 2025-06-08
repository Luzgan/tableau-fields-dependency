import { Node, FileData } from "../types/app.types";

function uniqueNodes(nodes: Node[]): Node[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

export function getReferencingNodes(
  fileData: FileData,
  nodeId: string
): Node[] {
  if (!fileData?.references || !fileData.nodesById) return [];
  const referencingNodeIds = fileData.references
    .filter((ref) => ref.targetId === nodeId)
    .map((ref) => ref.sourceId);
  const nodes = referencingNodeIds
    .map((id) => fileData.nodesById.get(id))
    .filter((node): node is Node => {
      if (!node) return false;
      return "id" in node && "name" in node && "type" in node;
    });
  return uniqueNodes(nodes);
}

export function getReferencedNodes(fileData: FileData, nodeId: string): Node[] {
  if (!fileData?.references || !fileData.nodesById) return [];
  const referencedNodeIds = fileData.references
    .filter((ref) => ref.sourceId === nodeId)
    .map((ref) => ref.targetId);
  const nodes = referencedNodeIds
    .map((id) => fileData.nodesById.get(id))
    .filter((node): node is Node => {
      if (!node) return false;
      return "id" in node && "name" in node && "type" in node;
    });
  return uniqueNodes(nodes);
}

export function getIndirectReferencingNodes(
  fileData: FileData,
  nodeId: string
): Node[] {
  if (!fileData?.references || !fileData.nodesById) return [];

  const visited = new Set<string>();
  const indirectNodes = new Set<Node>();
  const foundPaths = new Set<string>();

  const findIndirectReferences = (currentId: string, depth: number) => {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const directReferences = fileData.references
      .filter((ref) => ref.targetId === currentId)
      .map((ref) => ref.sourceId);

    directReferences.forEach((refId) => {
      const node = fileData.nodesById.get(refId);
      if (node) {
        // Only add if depth >= 2 (not direct) and not the original node
        if (depth >= 2 && node.id !== nodeId) {
          const pathKey = `${refId}->${nodeId}`;
          if (!foundPaths.has(pathKey)) {
            foundPaths.add(pathKey);
            indirectNodes.add(node);
          }
        }
        findIndirectReferences(refId, depth + 1);
      }
    });
  };

  findIndirectReferences(nodeId, 1);
  return uniqueNodes(Array.from(indirectNodes));
}

export function getIndirectReferencedNodes(
  fileData: FileData,
  nodeId: string
): Node[] {
  if (!fileData?.references || !fileData.nodesById) return [];

  const visited = new Set<string>();
  const indirectNodes = new Set<Node>();
  const foundPaths = new Set<string>();

  const findIndirectReferences = (currentId: string, depth: number) => {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const directReferences = fileData.references
      .filter((ref) => ref.sourceId === currentId)
      .map((ref) => ref.targetId);

    directReferences.forEach((refId) => {
      const node = fileData.nodesById.get(refId);
      if (node) {
        // Only add if depth >= 2 (not direct) and not the original node
        if (depth >= 2 && node.id !== nodeId) {
          const pathKey = `${nodeId}->${refId}`;
          if (!foundPaths.has(pathKey)) {
            foundPaths.add(pathKey);
            indirectNodes.add(node);
          }
        }
        findIndirectReferences(refId, depth + 1);
      }
    });
  };

  findIndirectReferences(nodeId, 1);
  return uniqueNodes(Array.from(indirectNodes));
}
