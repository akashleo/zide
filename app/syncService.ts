import { FileNode } from './fs';

// ============================================================================
// Types
// ============================================================================

export type SyncResult = {
  success: boolean;
  created: string[];
  updated: string[];
  deleted: string[];
  errors: SyncError[];
};

export type SyncError = {
  path: string;
  operation: 'create' | 'update' | 'delete' | 'read';
  message: string;
};

export type SyncOptions = {
  /** Skip confirmation for deletions (default: false) */
  skipDeleteConfirmation?: boolean;
  /** Maximum file size in bytes for updates (default: 10MB) */
  maxFileSize?: number;
  /** Callback for progress updates */
  onProgress?: (status: SyncProgress) => void;
};

export type SyncProgress = {
  phase: 'scanning' | 'diffing' | 'applying' | 'complete';
  current: number;
  total: number;
  message: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Builds a full path string for a FileNode by traversing parentIds.
 * Returns path relative to root (e.g., "src/components/Button.tsx").
 */
export function buildPath(files: FileNode[], node: FileNode): string {
  const parts: string[] = [node.name];
  let currentId = node.parentId;

  while (currentId) {
    const parent = files.find((f) => f.id === currentId);
    if (!parent) break;
    parts.unshift(parent.name);
    currentId = parent.parentId;
  }

  return parts.join('/');
}

/**
 * Builds a map of path -> FileNode for all nodes in the virtual file system.
 */
export function buildVirtualPathMap(
  files: FileNode[]
): Map<string, FileNode> {
  const map = new Map<string, FileNode>();

  for (const node of files) {
    const path = buildPath(files, node);
    map.set(path, node);
  }

  return map;
}

/**
 * Recursively scans the actual directory using File System Access API.
 * Returns a map of path -> FileSystemHandle.
 */
export async function scanDirectory(
  rootHandle: FileSystemDirectoryHandle,
  options: {
    onProgress?: (count: number) => void;
  } = {}
): Promise<Map<string, FileSystemHandle>> {
  const handleMap = new Map<string, FileSystemHandle>();
  const queue: Array<{
    handle: FileSystemDirectoryHandle;
    path: string;
  }> = [{ handle: rootHandle, path: '' }];

  let scannedCount = 0;

  while (queue.length > 0) {
    const { handle, path } = queue.shift()!;

    try {
      // Request permission if needed
      if ((await handle.queryPermission({ mode: 'read' })) !== 'granted') {
        const permission = await handle.requestPermission({ mode: 'read' });
        if (permission !== 'granted') {
          console.warn(`[scanDirectory] Permission denied for: ${path || '.'}`);
          continue;
        }
      }

      for await (const entry of handle.values()) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name;

        if (entry.kind === 'directory') {
          handleMap.set(entryPath, entry);
          queue.push({
            handle: entry as FileSystemDirectoryHandle,
            path: entryPath,
          });
        } else {
          handleMap.set(entryPath, entry);
        }

        scannedCount++;
        options.onProgress?.(scannedCount);
      }
    } catch (err) {
      console.warn(`[scanDirectory] Failed to scan ${path || '.'}:`, err);
    }
  }

  return handleMap;
}

/**
 * Calculates the diff between virtual and actual file systems.
 */
export function calculateDiff(
  virtualMap: Map<string, FileNode>,
  actualMap: Map<string, FileSystemHandle>,
  rootHandle: FileSystemDirectoryHandle
): {
  toCreate: FileNode[];
  toUpdate: Array<{ node: FileNode; handle: FileSystemFileHandle }>;
  toDelete: Array<{ path: string; handle: FileSystemHandle }>;
} {
  const toCreate: FileNode[] = [];
  const toUpdate: Array<{ node: FileNode; handle: FileSystemFileHandle }> = [];
  const toDelete: Array<{ path: string; handle: FileSystemHandle }> = [];

  // Find CREATE and UPDATE operations
  for (const [path, node] of virtualMap) {
    const actualHandle = actualMap.get(path);

    if (!actualHandle) {
      // Virtual exists, actual doesn't -> CREATE
      toCreate.push(node);
    } else if (node.type === 'file' && actualHandle.kind === 'file') {
      // Both exist and are files -> check for UPDATE
      toUpdate.push({
        node,
        handle: actualHandle as FileSystemFileHandle,
      });
    }
    // If both are folders, no action needed (we'll sync contents separately)
  }

  // Find DELETE operations
  for (const [path, handle] of actualMap) {
    if (!virtualMap.has(path)) {
      // Actual exists, virtual doesn't -> DELETE
      toDelete.push({ path, handle });
    }
  }

  // Sort deletions: deepest paths first (to handle nested structures)
  toDelete.sort((a, b) => b.path.localeCompare(a.path));

  return { toCreate, toUpdate, toDelete };
}

/**
 * Gets the parent directory handle and ensures it exists.
 */
async function getOrCreateParentHandle(
  rootHandle: FileSystemDirectoryHandle,
  files: FileNode[],
  node: FileNode,
  createdHandles: Map<string, FileSystemDirectoryHandle>
): Promise<FileSystemDirectoryHandle> {
  if (!node.parentId) {
    return rootHandle;
  }

  // Check if we've already created this parent
  const parentPath = buildPath(files, files.find((f) => f.id === node.parentId)!);
  if (createdHandles.has(parentPath)) {
    return createdHandles.get(parentPath)!;
  }

  // Build ancestor chain
  const ancestors: FileNode[] = [];
  let currentId: string | null = node.parentId;

  while (currentId) {
    const parent = files.find((f) => f.id === currentId);
    if (!parent) break;
    ancestors.unshift(parent);
    currentId = parent.parentId;
  }

  // Navigate/create ancestor chain
  let currentHandle = rootHandle;

  for (const ancestor of ancestors) {
    const ancestorPath = buildPath(files, ancestor);

    if (createdHandles.has(ancestorPath)) {
      currentHandle = createdHandles.get(ancestorPath)!;
      continue;
    }

    try {
      currentHandle = await currentHandle.getDirectoryHandle(ancestor.name, {
        create: true,
      });
      createdHandles.set(ancestorPath, currentHandle);
    } catch (err) {
      throw new Error(
        `Failed to create/access directory "${ancestorPath}": ${err}`
      );
    }
  }

  return currentHandle;
}

/**
 * Applies the calculated diff to the actual file system.
 */
async function applyDiff(
  rootHandle: FileSystemDirectoryHandle,
  files: FileNode[],
  diff: ReturnType<typeof calculateDiff>,
  result: SyncResult,
  options: SyncOptions
): Promise<void> {
  const createdHandles = new Map<string, FileSystemDirectoryHandle>();

  // 1. Handle DELETIONS first (deepest paths first)
  for (const { path, handle } of diff.toDelete) {
    try {
      const parentPath = path.includes('/')
        ? path.slice(0, path.lastIndexOf('/'))
        : '';
      const name = path.slice(path.lastIndexOf('/') + 1);

      let parentHandle: FileSystemDirectoryHandle;

      if (!parentPath) {
        parentHandle = rootHandle;
      } else {
        const parentNode = files.find((f) => buildPath(files, f) === parentPath);
        if (parentNode) {
          parentHandle = await getOrCreateParentHandle(
            rootHandle,
            files,
            { ...parentNode, parentId: parentNode.parentId },
            createdHandles
          );
        } else {
          // Parent doesn't exist in virtual, get from actual
          const parts = parentPath.split('/');
          parentHandle = rootHandle;
          for (const part of parts) {
            parentHandle = await parentHandle.getDirectoryHandle(part);
          }
        }
      }

      // Request write permission
      if ((await parentHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
        const permission = await parentHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          throw new Error('Write permission denied');
        }
      }

      await parentHandle.removeEntry(name, { recursive: handle.kind === 'directory' });
      result.deleted.push(path);
      options.onProgress?.({
        phase: 'applying',
        current: result.deleted.length + result.created.length + result.updated.length,
        total: diff.toDelete.length + diff.toCreate.length + diff.toUpdate.length,
        message: `Deleted: ${path}`,
      });
    } catch (err) {
      result.errors.push({
        path,
        operation: 'delete',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  // 2. Handle CREATIONS
  for (const node of diff.toCreate) {
    try {
      const path = buildPath(files, node);
      const parentHandle = await getOrCreateParentHandle(
        rootHandle,
        files,
        node,
        createdHandles
      );

      // Request write permission
      if ((await parentHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
        const permission = await parentHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          throw new Error('Write permission denied');
        }
      }

      if (node.type === 'folder') {
        const newHandle = await parentHandle.getDirectoryHandle(node.name, {
          create: true,
        });
        createdHandles.set(path, newHandle);
      } else {
        const fileHandle = await parentHandle.getFileHandle(node.name, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(node.content || '');
        await writable.close();
      }

      result.created.push(path);
      options.onProgress?.({
        phase: 'applying',
        current: result.deleted.length + result.created.length + result.updated.length,
        total: diff.toDelete.length + diff.toCreate.length + diff.toUpdate.length,
        message: `Created: ${path}`,
      });
    } catch (err) {
      result.errors.push({
        path: buildPath(files, node),
        operation: 'create',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  // 3. Handle UPDATES
  for (const { node, handle } of diff.toUpdate) {
    try {
      const path = buildPath(files, node);

      // Check file size
      const maxSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
      const contentSize = new Blob([node.content || '']).size;

      if (contentSize > maxSize) {
        throw new Error(`File exceeds maximum size (${maxSize} bytes)`);
      }

      // Request write permission
      if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
        const permission = await handle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          throw new Error('Write permission denied');
        }
      }

      const writable = await handle.createWritable();
      await writable.write(node.content || '');
      await writable.close();

      result.updated.push(path);
      options.onProgress?.({
        phase: 'applying',
        current: result.deleted.length + result.created.length + result.updated.length,
        total: diff.toDelete.length + diff.toCreate.length + diff.toUpdate.length,
        message: `Updated: ${path}`,
      });
    } catch (err) {
      result.errors.push({
        path: buildPath(files, node),
        operation: 'update',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
}

// ============================================================================
// Main Sync Function
// ============================================================================

/**
 * Syncs the virtual file system (IndexedDB state) with the actual local directory.
 *
 * @param rootHandle - The root directory handle from showDirectoryPicker()
 * @param files - Array of FileNodes representing the virtual file system
 * @param options - Optional configuration for the sync operation
 * @returns SyncResult with details of operations performed
 *
 * @example
 * ```typescript
 * const result = await syncToDisk(rootHandle, files, {
 *   onProgress: (status) => console.log(status.message)
 * });
 *
 * if (result.success) {
 *   console.log(`Created: ${result.created.length}, Updated: ${result.updated.length}, Deleted: ${result.deleted.length}`);
 * }
 * ```
 */
export async function syncToDisk(
  rootHandle: FileSystemDirectoryHandle,
  files: FileNode[],
  options: SyncOptions = {}
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    created: [],
    updated: [],
    deleted: [],
    errors: [],
  };

  try {
    // Phase 1: Scan actual directory
    options.onProgress?.({
      phase: 'scanning',
      current: 0,
      total: 0,
      message: 'Scanning local directory...',
    });

    const actualMap = await scanDirectory(rootHandle, {
      onProgress: (count) => {
        options.onProgress?.({
          phase: 'scanning',
          current: count,
          total: 0,
          message: `Scanned ${count} entries...`,
        });
      },
    });

    // Phase 2: Build virtual map and calculate diff
    options.onProgress?.({
      phase: 'diffing',
      current: 0,
      total: files.length,
      message: 'Calculating changes...',
    });

    const virtualMap = buildVirtualPathMap(files);
    const diff = calculateDiff(virtualMap, actualMap, rootHandle);

    // Check if there's anything to do
    const totalOperations =
      diff.toCreate.length + diff.toUpdate.length + diff.toDelete.length;

    if (totalOperations === 0) {
      result.success = true;
      options.onProgress?.({
        phase: 'complete',
        current: 0,
        total: 0,
        message: 'Everything is up to date',
      });
      return result;
    }

    // Phase 3: Apply changes
    options.onProgress?.({
      phase: 'applying',
      current: 0,
      total: totalOperations,
      message: `Applying ${totalOperations} changes...`,
    });

    await applyDiff(rootHandle, files, diff, result, options);

    // Determine success (no errors = success, even if some operations had issues)
    result.success = result.errors.length === 0;

    options.onProgress?.({
      phase: 'complete',
      current: totalOperations,
      total: totalOperations,
      message: result.success
        ? 'Sync completed successfully'
        : `Sync completed with ${result.errors.length} error(s)`,
    });
  } catch (err) {
    result.errors.push({
      path: '',
      operation: 'read',
      message: err instanceof Error ? err.message : 'Sync failed unexpectedly',
    });
    result.success = false;
  }

  return result;
}

// ============================================================================
// Convenience Export
// ============================================================================

export const syncService = {
  syncToDisk,
  buildPath,
  buildVirtualPathMap,
  scanDirectory,
  calculateDiff,
};

export default syncService;
