import { FileNode } from './fs';

// ---------------------------------------------------------------------------
// Pure file-system manipulation helpers.
// These functions accept an immutable flat array of FileNode[] and return a
// *new* array.  They never touch the DOM, IndexedDB, or Zustand directly.
// ---------------------------------------------------------------------------

/**
 * Return all direct children of a given parent (root-level when parentId is null).
 */
export function getChildren(nodes: FileNode[], parentId: string | null): FileNode[] {
  return nodes.filter((n) => n.parentId === parentId);
}

/**
 * Collect every descendant ID of `nodeId` using an iterative stack.
 * Works for both files (returns empty) and folders (returns transitive children).
 */
export function getDescendantIds(nodes: FileNode[], nodeId: string): string[] {
  const result: string[] = [];
  const stack: string[] = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    const children = nodes.filter((n) => n.parentId === currentId);

    for (const child of children) {
      result.push(child.id);
      if (child.type === 'folder') {
        stack.push(child.id);
      }
    }
  }

  return result;
}

/**
 * Return the actual FileNode objects that are descendants of `nodeId`.
 */
export function getDescendants(nodes: FileNode[], nodeId: string): FileNode[] {
  const ids = new Set(getDescendantIds(nodes, nodeId));
  return nodes.filter((n) => ids.has(n.id));
}

// ---------------------------------------------------------------------------
// Core CRUD operations
// ---------------------------------------------------------------------------

/**
 * Create a new file or folder node.
 *
 * - Generates a unique id via crypto.randomUUID().
 * - Defaults file content to '' (empty string).
 * - Throws if the name is empty/whitespace.
 * - Defensively guards against an astronomically-rare ID collision.
 */
export function createNode(
  nodes: FileNode[],
  params: Pick<FileNode, 'name' | 'type' | 'parentId'> & Partial<Pick<FileNode, 'content'>>
): FileNode[] {
  const trimmedName = params.name.trim();
  if (!trimmedName) {
    throw new Error('Node name cannot be empty or whitespace');
  }

  const now = Date.now();
  const newNode: FileNode = {
    id: crypto.randomUUID(),
    name: trimmedName,
    type: params.type,
    parentId: params.parentId ?? null,
    content: params.type === 'file' ? (params.content ?? '') : undefined,
    createdAt: now,
    updatedAt: now,
  };

  if (nodes.some((n) => n.id === newNode.id)) {
    throw new Error('Generated ID collision detected');
  }

  return [...nodes, newNode];
}

/**
 * Rename a node by ID.
 *
 * - Returns the original array unchanged if the ID is missing.
 * - Throws if the new name is empty/whitespace.
 * - Only touches the target node; children are NOT renamed.
 */
export function renameNode(nodes: FileNode[], id: string, newName: string): FileNode[] {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new Error('Node name cannot be empty or whitespace');
  }

  const exists = nodes.some((n) => n.id === id);
  if (!exists) return nodes;

  return nodes.map((n) =>
    n.id === id ? { ...n, name: trimmed, updatedAt: Date.now() } : n
  );
}

/**
 * Delete a node and, if it is a folder, all of its descendants.
 *
 * - Returns the original array unchanged if the ID is missing.
 * - Uses an iterative approach (stack) to avoid deep recursion limits.
 */
export function deleteNode(nodes: FileNode[], id: string): FileNode[] {
  const target = nodes.find((n) => n.id === id);
  if (!target) return nodes;

  const idsToRemove = new Set<string>([id]);

  if (target.type === 'folder') {
    for (const descId of getDescendantIds(nodes, id)) {
      idsToRemove.add(descId);
    }
  }

  return nodes.filter((n) => !idsToRemove.has(n.id));
}

/**
 * Duplicate a node (recursively if it is a folder).
 *
 * - Returns the original array unchanged if the ID is missing.
 * - Generates fresh IDs for every duplicated node so the flat list stays valid.
 * - Appends `_copy` to the *root* duplicated node only; children keep their
 *   original names so the internal structure remains intact.
 * - Maintains parent-child relationships by mapping old parents to new ones
 *   during an iterative depth-first traversal.
 */
export function duplicateNode(nodes: FileNode[], id: string): FileNode[] {
  const target = nodes.find((n) => n.id === id);
  if (!target) return nodes;

  const now = Date.now();
  const newNodes: FileNode[] = [];

  // Stack entry: [originalId, newParentId, isRootOfDuplication]
  type StackItem = [string, string | null, boolean];
  const stack: StackItem[] = [[id, target.parentId, true]];

  while (stack.length > 0) {
    const [originalId, newParentId, isRoot] = stack.pop()!;
    const original = nodes.find((n) => n.id === originalId);
    if (!original) continue;

    const newId = crypto.randomUUID();
    const newName = isRoot ? `${original.name}_copy` : original.name;

    const copy: FileNode = {
      ...original,
      id: newId,
      name: newName,
      parentId: newParentId,
      createdAt: now,
      updatedAt: now,
    };

    newNodes.push(copy);

    if (original.type === 'folder') {
      // Reverse children so they are processed in original order after popping.
      const children = nodes
        .filter((n) => n.parentId === originalId)
        .reverse();

      for (const child of children) {
        stack.push([child.id, newId, false]);
      }
    }
  }

  return [...nodes, ...newNodes];
}

// ---------------------------------------------------------------------------
// Zustand integration examples (copy-paste into your store file)
// ---------------------------------------------------------------------------

/*
import { create } from 'zustand';
import { FileNode } from './fs';
import { dbService } from './db';
import {
  createNode as fsCreate,
  renameNode as fsRename,
  deleteNode as fsDelete,
  duplicateNode as fsDuplicate,
} from './fileSystemService';

interface FileState {
  files: FileNode[];
  activeTabId: string | null;
  openTabs: string[];
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  activeTabId: null,
  openTabs: [],

  // ------------------------------------------------------------------
  // Optimistic updates: mutate Zustand state immediately, then persist
  // to IndexedDB asynchronously so the UI never blocks.
  // ------------------------------------------------------------------

  createFile: (params) => {
    set((state) => {
      const next = fsCreate(state.files, params);
      const created = next[next.length - 1];
      dbService.upsertFile(created).catch(console.error);
      return { files: next };
    });
  },

  renameFile: (id, newName) => {
    set((state) => {
      const next = fsRename(state.files, id, newName);
      const renamed = next.find((n) => n.id === id);
      if (renamed) {
        dbService.upsertFile(renamed).catch(console.error);
      }
      return { files: next };
    });
  },

  deleteFile: (id) => {
    set((state) => {
      const target = state.files.find((n) => n.id === id);
      if (!target) return state;

      // 1. Optimistically remove from local state
      const next = fsDelete(state.files, id);

      // 2. Asynchronously clean up IndexedDB
      dbService.deleteFile(id).catch(console.error);
      if (target.type === 'folder') {
        // Dexie bulkDelete would be ideal here; otherwise loop over descendants.
        const ids = getDescendantIds(state.files, id);
        ids.forEach((descId) => dbService.deleteFile(descId).catch(console.error));
      }

      // 3. If the deleted file was open in a tab, close that tab
      const wasOpen = state.openTabs.includes(id);
      const newTabs = state.openTabs.filter((t) => t !== id);
      const newActive =
        state.activeTabId === id
          ? newTabs[newTabs.length - 1] ?? null
          : state.activeTabId;

      return { files: next, openTabs: newTabs, activeTabId: newActive };
    });
  },

  duplicateFile: (id) => {
    set((state) => {
      const next = fsDuplicate(state.files, id);
      const added = next.filter(
        (n) => !state.files.some((o) => o.id === n.id)
      );

      // Persist every newly created node
      Promise.all(added.map((f) => dbService.upsertFile(f))).catch(console.error);

      return { files: next };
    });
  },
}));
*/
