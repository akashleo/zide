import { dbService } from './db';
import { useFileStore } from './fileStore';
import { FileNode } from './fs';
import { debounce } from 'lodash-es';

/**
 * Sync Service logic between Zustand and Dexie.
 * Handles persistence and debounced updates.
 */
class SyncService {
  /**
   * Initialize the store with data from IndexedDB
   */
  async init() {
    const files = await dbService.getAllFiles();
    useFileStore.getState().setFiles(files);
  }

  /**
   * Create a file: Zustand first, then DB
   */
  async createFile(file: FileNode) {
    useFileStore.getState().createFile(file);
    await dbService.upsertFile(file);
  }

  /**
   * Update a file: Zustand first, then DB
   */
  async updateFile(id: string, updates: Partial<FileNode>) {
    useFileStore.getState().updateFile(id, updates);
    
    // Get the updated node to persist
    const updatedNode = useFileStore.getState().files.find(f => f.id === id);
    if (updatedNode) {
      await dbService.upsertFile(updatedNode);
    }
  }

  /**
   * Debounced version for frequent updates (like content changes)
   */
  debouncedUpdate = debounce(async (id: string, updates: Partial<FileNode>) => {
    await this.updateFile(id, updates);
  }, 500);

  /**
   * Delete a node and its children
   */
  async deleteNode(id: string) {
    const state = useFileStore.getState();
    const nodeToDelete = state.files.find(f => f.id === id);
    
    // Optimistic update in Zustand
    state.deleteFile(id);

    // Persistence in DB
    if (nodeToDelete?.type === 'folder') {
      const descendants = this.getAllDescendantIds(state.files, id);
      await Promise.all([
        dbService.deleteFile(id),
        ...Array.from(descendants).map(dId => dbService.deleteFile(dId))
      ]);
    } else {
      await dbService.deleteFile(id);
    }
  }

  private getAllDescendantIds(nodes: FileNode[], folderId: string): Set<string> {
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
  }
}

export const syncService = new SyncService();
