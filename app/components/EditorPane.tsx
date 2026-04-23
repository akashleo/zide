'use client';

import { useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useFileStore } from '../fileStore';
import { useDebouncedSave } from '../hooks/useDebouncedSave';

/**
 * Maps file extensions to Monaco language identifiers.
 */
const getLanguage = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

/**
 * EditorPane - Monaco Editor integration component.
 *
 * Features:
 * - Syncs with Zustand for active file state.
 * - Performs optimistic updates to Zustand on change.
 * - Debounces persistence to IndexedDB via custom hook.
 * - Detects language based on file extension.
 * - Placeholder for when no file or a folder is selected.
 */
export function EditorPane() {
  const activeTabId = useFileStore((state) => state.activeTabId);
  const files = useFileStore((state) => state.files);
  const updateFileContent = useFileStore((state) => state.updateFileContent);

  const { save } = useDebouncedSave(500);

  // Find the active file object from the store
  const activeFile = useMemo(
    () => files.find((f) => f.id === activeTabId),
    [files, activeTabId]
  );

  /**
   * handleEditorChange - Triggered on every keystroke in Monaco.
   * 
   * 1. Updates Zustand immediately (optimistic update for UI responsiveness).
   * 2. Triggers debounced save to IndexedDB.
   */
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!activeFile || value === undefined) return;

      const updatedFile = {
        ...activeFile,
        content: value,
        updatedAt: Date.now(),
        isDirty: true,
      };

      // 1. Update Zustand immediately
      updateFileContent(activeFile.id, value);

      // 2. Debounced save to IndexedDB
      save(updatedFile);
    },
    [activeFile, updateFileContent, save]
  );

  // Case 1: No file selected
  if (!activeTabId) {
    return (
      <div className="flex h-full items-center justify-center text-[#858585] bg-[#1e1e1e] font-sans italic">
        Select a file from the sidebar to start editing
      </div>
    );
  }

  // Case 2: Selected item is a folder
  if (activeFile?.type === 'folder') {
    return (
      <div className="flex h-full items-center justify-center text-[#858585] bg-[#1e1e1e] font-sans">
        Folders cannot be edited directly. Select a file inside.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l border-[#2b2b2b]">
      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={activeFile ? getLanguage(activeFile.name) : 'plaintext'}
          value={activeFile?.content || ''}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 10 },
          }}
        />
      </div>
    </div>
  );
}
