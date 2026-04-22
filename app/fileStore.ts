import { create } from 'zustand';
import { FileNode } from './fs';

interface FileState {
  files: FileNode[];
  activeFileId: string | null;
  
  // Actions
  setFiles: (files: FileNode[]) => void;
  createFile: (file: FileNode) => void;
  updateFile: (id: string, updates: Partial<FileNode>) => void;
  deleteFile: (id: string) => void;
  setActiveFile: (id: string | null) => void;
}

/**
 * Zustand store for UI state management.
 * Implements optimistic updates for the file system.
 */
export const useFileStore = create<FileState>((set) => ({
  files: [],
  activeFileId: null,

  setFiles: (files) => set({ files }),

  createFile: (file) => 
    set((state) => ({ 
      files: [...state.files, file] 
    })),

  updateFile: (id, updates) =>
    set((state) => ({
      files: state.files.map((f) => 
        f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
      ),
    })),

  deleteFile: (id) =>
    set((state) => {
      // Logic for recursive deletion in Zustand if needed, 
      // but syncService handles the heavy lifting for the DB.
      // Here we just filter the node itself and descendants.
      const descendantIds = new Set<string>();
      const getDescendants = (parentId: string) => {
        state.files.filter(f => f.parentId === parentId).forEach(child => {
          descendantIds.add(child.id);
          getDescendants(child.id);
        });
      };
      
      const nodeToDelete = state.files.find(f => f.id === id);
      if (nodeToDelete?.type === 'folder') {
        getDescendants(id);
      }
      
      return {
        files: state.files.filter((f) => f.id !== id && !descendantIds.has(f.id)),
        activeFileId: state.activeFileId === id ? null : state.activeFileId
      };
    }),

  setActiveFile: (id) => set({ activeFileId: id }),
}));
