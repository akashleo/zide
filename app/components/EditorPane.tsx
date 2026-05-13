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
      <div className="flex h-full items-center justify-center text-[#6a6a80] bg-[#0f0f14] font-sans">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-10 w-10 opacity-15" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p className="text-[14px] italic">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  // Case 2: Selected item is a folder
  if (activeFile?.type === 'folder') {
    return (
      <div className="flex h-full items-center justify-center text-[#9a9ab0] bg-[#0f0f14] font-sans">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-12 w-12 opacity-20" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <p className="italic text-[14px]">Folders cannot be edited directly.</p>
        </div>
      </div>
    );
  }

  // Get breadcrumbs (simplified for now)
  const breadcrumbs = activeFile ? activeFile.name : '';

  return (
    <div className="h-full flex flex-col bg-[#0f0f14]">
      {/* Breadcrumbs */}
      <div className="h-9 flex items-center px-4 text-[13px] text-[#6a6a80] border-b border-[#2a2a3a]/50 bg-[#0f0f14]">
        <span className="hover:text-[#f0f0f5] cursor-pointer transition-colors">zide</span>
        <span className="mx-2 opacity-40">/</span>
        <span className="text-[#b0b0c8] font-medium">{breadcrumbs}</span>
      </div>

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
            fontFamily: "'JetBrains Mono', 'Fira Code', ui-mono, monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="h-7 flex items-center justify-between px-4 text-[11px] text-[#6a6a80] border-t border-[#2a2a3a] bg-[#0f0f14]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 group cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500/70 transition-colors" />
            <span className="group-hover:text-[#b0b0c8] transition-colors uppercase tracking-tight font-bold">Local Workspace</span>
          </div>
          {activeFile?.isDirty && (
            <span className="text-blue-500/60 animate-pulse font-medium">Saving...</span>
          )}
        </div>
        <div className="flex items-center gap-4 font-medium uppercase tracking-tighter">
          <span className="hover:text-[#b0b0c8] cursor-pointer transition-colors">{activeFile ? getLanguage(activeFile.name) : 'plain text'}</span>
          <span className="hover:text-[#b0b0c8] cursor-pointer transition-colors">UTF-8</span>
          <span className="hover:text-[#b0b0c8] cursor-pointer transition-colors">Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}
