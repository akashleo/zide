import { create } from 'zustand';
import { FileNode } from './fs';
import * as fsService from './fileSystemService';
import { dbService } from './db';

interface FileState {
  files: FileNode[];
  openTabs: string[];
  activeTabId: string | null;
  recentFiles: string[];

  // CRUD Actions
  setFiles: (files: FileNode[]) => void;
  createNode: (params: Parameters<typeof fsService.createNode>[1]) => void;
  renameNode: (id: string, newName: string) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;

  // Tab actions
  openFile: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  setActiveTab: (fileId: string | null) => void;
}

/**
 * Zustand store for UI state management.
 * All persistence is to IndexedDB only (no local disk write-back).
 */
export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  openTabs: [],
  activeTabId: null,
  recentFiles: [],

  setFiles: (files) => set({ files }),

  createNode: (params) => {
    set((state) => {
      try {
        const next = fsService.createNode(state.files, params);
        const created = next[next.length - 1];
        dbService.upsertFile(created).catch(console.error);
        return { files: next };
      } catch (e) {
        console.error(e);
        return state;
      }
    });
  },

  renameNode: (id, newName) => {
    set((state) => {
      try {
        const next = fsService.renameNode(state.files, id, newName);
        const renamed = next.find((n) => n.id === id);
        if (renamed) {
          dbService.upsertFile(renamed).catch(console.error);
        }
        return { files: next };
      } catch (e) {
        console.error(e);
        return state;
      }
    });
  },

  deleteNode: (id) => {
    set((state) => {
      const target = state.files.find((n) => n.id === id);
      if (!target) return state;

      const next = fsService.deleteNode(state.files, id);
      const descendantIds = fsService.getDescendantIds(state.files, id);
      const idsToRemove = new Set([id, ...descendantIds]);

      // Persistence
      dbService.deleteFile(id).catch(console.error);
      if (target.type === 'folder') {
        descendantIds.forEach((dId) => dbService.deleteFile(dId).catch(console.error));
      }

      // Tab cleanup
      const newTabs = state.openTabs.filter((t) => !idsToRemove.has(t));
      const newActiveTab = state.activeTabId && idsToRemove.has(state.activeTabId)
        ? newTabs[newTabs.length - 1] ?? null
        : state.activeTabId;

      return {
        files: next,
        openTabs: newTabs,
        activeTabId: newActiveTab,
        recentFiles: state.recentFiles.filter((r) => !idsToRemove.has(r)),
      };
    });
  },

  duplicateNode: (id) => {
    set((state) => {
      const next = fsService.duplicateNode(state.files, id);
      const added = next.filter((n) => !state.files.some((o) => o.id === n.id));
      
      Promise.all(added.map((f) => dbService.upsertFile(f))).catch(console.error);
      
      return { files: next };
    });
  },

  updateFileContent: (id, content) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, content, isDirty: true, updatedAt: Date.now() } : f
      ),
    }));
  },

  openFile: (fileId) =>
    set((state) => {
      const isAlreadyOpen = state.openTabs.includes(fileId);
      const newTabs = isAlreadyOpen ? state.openTabs : [...state.openTabs, fileId];
      const newRecent = [fileId, ...state.recentFiles.filter((r) => r !== fileId)].slice(0, 20);
      return {
        openTabs: newTabs,
        activeTabId: fileId,
        recentFiles: newRecent,
      };
    }),

  closeTab: (fileId) =>
    set((state) => {
      const index = state.openTabs.indexOf(fileId);
      if (index === -1) return state;

      const newTabs = state.openTabs.filter((t) => t !== fileId);

      // If closing the active tab, activate the previous tab (or next if none before)
      let newActiveTab = state.activeTabId;
      if (state.activeTabId === fileId) {
        // Prefer previous tab; if none, fall back to the new last tab
        const previousTab = newTabs[index - 1];
        const fallbackTab = newTabs[newTabs.length - 1];
        newActiveTab = previousTab ?? fallbackTab ?? null;
      }

      return {
        openTabs: newTabs,
        activeTabId: newActiveTab,
      };
    }),

  setActiveTab: (fileId) =>
    set({ activeTabId: fileId }),
}));
