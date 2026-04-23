import { FileNode } from './fs';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB
const BINARY_SAMPLE_SIZE = 8192;

function isLikelyText(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);
  const limit = Math.min(view.length, BINARY_SAMPLE_SIZE);
  for (let i = 0; i < limit; i++) {
    if (view[i] === 0) return false;
  }
  return true;
}

/**
 * Loads a folder from the local file system using File System Access API.
 * This is read-only - no file handles are stored, no write-back capability.
 * Files are extracted and converted to FileNode[] for in-memory + IndexedDB storage.
 */
export async function loadFolder(): Promise<FileNode[]> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API is not supported in this browser.');
  }

  let dirHandle: FileSystemDirectoryHandle;
  try {
    dirHandle = await window.showDirectoryPicker();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return [];
    }
    throw err;
  }

  const nodes: FileNode[] = [];
  const skipped: string[] = [];

  async function traverse(
    handle: FileSystemDirectoryHandle,
    parentId: string | null
  ): Promise<void> {
    const folderId = crypto.randomUUID();
    const now = Date.now();

    nodes.push({
      id: folderId,
      name: handle.name,
      type: 'folder',
      parentId,
      createdAt: now,
      updatedAt: now,
    });

    for await (const entry of handle.values()) {
      if (entry.kind === 'directory') {
        if (SKIP_DIRS.has(entry.name)) {
          skipped.push(`${handle.name}/${entry.name}`);
          continue;
        }
        await traverse(entry as FileSystemDirectoryHandle, folderId);
      } else if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();

        if (file.size > MAX_FILE_SIZE_BYTES) {
          skipped.push(`${handle.name}/${entry.name} (exceeds 1MB)`);
          continue;
        }

        let buffer: ArrayBuffer;
        try {
          buffer = await file.arrayBuffer();
        } catch {
          skipped.push(`${handle.name}/${entry.name} (read error)`);
          continue;
        }

        if (!isLikelyText(buffer)) {
          skipped.push(`${handle.name}/${entry.name} (binary)`);
          continue;
        }

        nodes.push({
          id: crypto.randomUUID(),
          name: entry.name,
          type: 'file',
          parentId: folderId,
          content: new TextDecoder().decode(buffer),
          createdAt: file.lastModified,
          updatedAt: file.lastModified,
        });
      }
    }
  }

  await traverse(dirHandle, null);

  if (skipped.length > 0) {
    console.log('[loadFolder] Skipped:', skipped);
  }

  return nodes;
}
