/**
 * File System Implementation for Browser-based IDE
 * Uses a flat structure for storage and provides utility functions for manipulation.
 */

export type FileNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  createdAt: number;
  updatedAt: number;
  isDirty?: boolean;
};

export type TreeNode = FileNode & {
  children: TreeNode[];
};

/**
 * Creates a new file or folder node.
 */
export const createNode = (
  nodes: FileNode[],
  params: Pick<FileNode, 'name' | 'type' | 'parentId' | 'content'>
): FileNode[] => {
  const now = Date.now();
  const newNode: FileNode = {
    ...params,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  return [...nodes, newNode];
};

/**
 * Renames a node by its ID.
 */
export const renameNode = (
  nodes: FileNode[],
  id: string,
  newName: string
): FileNode[] => {
  return nodes.map((node) =>
    node.id === id
      ? { ...node, name: newName, updatedAt: Date.now() }
      : node
  );
};

/**
 * Recursively gets all descendant IDs of a folder.
 */
const getAllDescendantIds = (nodes: FileNode[], folderId: string): Set<string> => {
  const descendants = new Set<string>();
  const stack = [folderId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    const children = nodes.filter((node) => node.parentId === currentId);
    for (const child of children) {
      descendants.add(child.id);
      if (child.type === 'folder') {
        stack.push(child.id);
      }
    }
  }

  return descendants;
};

/**
 * Deletes a node and all its children if it's a folder.
 */
export const deleteNode = (nodes: FileNode[], id: string): FileNode[] => {
  const nodeToDelete = nodes.find((n) => n.id === id);
  if (!nodeToDelete) return nodes;

  if (nodeToDelete.type === 'file') {
    return nodes.filter((node) => node.id !== id);
  }

  const descendantIds = getAllDescendantIds(nodes, id);
  return nodes.filter((node) => node.id !== id && !descendantIds.has(node.id));
};

/**
 * Moves a node to a different parent folder.
 * Prevents moving a folder into its own descendant.
 */
export const moveNode = (
  nodes: FileNode[],
  id: string,
  newParentId: string | null
): FileNode[] => {
  // Prevent moving into itself
  if (id === newParentId) return nodes;

  // If moving a folder, ensure newParentId is not a descendant
  const nodeToMove = nodes.find((n) => n.id === id);
  if (nodeToMove?.type === 'folder' && newParentId) {
    const descendants = getAllDescendantIds(nodes, id);
    if (descendants.has(newParentId)) return nodes;
  }

  return nodes.map((node) =>
    node.id === id
      ? { ...node, parentId: newParentId, updatedAt: Date.now() }
      : node
  );
};

/**
 * Duplicates a node (recursively if it's a folder).
 */
export const duplicateNode = (
  nodes: FileNode[],
  id: string
): FileNode[] => {
  const nodeToDuplicate = nodes.find((n) => n.id === id);
  if (!nodeToDuplicate) return nodes;

  const now = Date.now();
  const idMap = new Map<string, string>();
  const newNodes: FileNode[] = [];

  const duplicateRecursive = (currentId: string, newParentId: string | null) => {
    const original = nodes.find((n) => n.id === currentId)!;
    const newId = crypto.randomUUID();
    idMap.set(currentId, newId);

    const copy: FileNode = {
      ...original,
      id: newId,
      name: newParentId === original.parentId ? `${original.name} (copy)` : original.name,
      parentId: newParentId,
      createdAt: now,
      updatedAt: now,
    };
    newNodes.push(copy);

    if (original.type === 'folder') {
      const children = nodes.filter((n) => n.parentId === currentId);
      children.forEach((child) => duplicateRecursive(child.id, newId));
    }
  };

  duplicateRecursive(id, nodeToDuplicate.parentId);
  return [...nodes, ...newNodes];
};

/**
 * Builds a hierarchical tree from the flat list of nodes.
 * Optimized with a single pass after initial indexing.
 */
export const buildTree = (nodes: FileNode[]): TreeNode[] => {
  const nodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // First pass: Create TreeNode objects and index them
  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Second pass: Link children to parents
  nodeMap.forEach((node) => {
    if (node.parentId === null) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Handle orphaned nodes as root nodes
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
};

/**
 * Utility to get direct children of a node.
 */
export const getChildren = (nodes: FileNode[], parentId: string | null): FileNode[] => {
  return nodes.filter((node) => node.parentId === parentId);
};

/**
 * Utility to find a node by path (e.g., "src/components/Button.tsx")
 */
export const findNodeByPath = (nodes: FileNode[], path: string): FileNode | undefined => {
  const parts = path.split('/').filter(Boolean);
  let currentParentId: string | null = null;
  let foundNode: FileNode | undefined;

  for (const part of parts) {
    foundNode = nodes.find(
      (n) => n.parentId === currentParentId && n.name === part
    );
    if (!foundNode) return undefined;
    currentParentId = foundNode.id;
  }

  return foundNode;
};
