'use client';

import { useCallback, useMemo } from 'react';
import { File, Folder } from 'lucide-react';
import './EditorPane.css';
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
      <div className="editor-pane-empty">
        <div className="editor-pane-empty-inner">
          <File className="editor-pane-empty-icon" size={24} />
          <p className="editor-pane-empty-text">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  // Case 2: Selected item is a folder
  if (activeFile?.type === 'folder') {
    return (
      <div className="editor-pane-folder">
        <div className="editor-pane-folder-inner">
          <Folder className="editor-pane-folder-icon" size={24} />
          <p className="editor-pane-folder-text">Folders cannot be edited directly.</p>
        </div>
      </div>
    );
  }

  // Get breadcrumbs (simplified for now)
  const breadcrumbs = activeFile ? activeFile.name : '';

  return (
    <div className="editor-pane">
      {/* Breadcrumbs */}
      <div className="editor-breadcrumbs">
        <span className="editor-breadcrumb-home">zide</span>
        <span className="editor-breadcrumb-sep">/</span>
        <span className="editor-breadcrumb-file">{breadcrumbs}</span>
      </div>

      {/* Monaco Editor */}
      <div className="editor-wrapper">
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
      <div className="editor-statusbar">
        <div className="editor-statusbar-left">
          <div className="editor-statusbar-workspace">
            <span className="editor-statusbar-dot" />
            <span className="editor-statusbar-workspace-label">Local Workspace</span>
          </div>
          {activeFile?.isDirty && (
            <span className="editor-statusbar-saving">Saving...</span>
          )}
        </div>
        <div className="editor-statusbar-right">
          <span className="editor-statusbar-item">{activeFile ? getLanguage(activeFile.name) : 'plain text'}</span>
          <span className="editor-statusbar-item">UTF-8</span>
          <span className="editor-statusbar-item">Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}
