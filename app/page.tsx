'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileTree, EditorPane, TabsBar } from './components';
import { useFileStore } from './fileStore';
import { dbService } from './db';
import { loadFolder } from './loadFolder';
import { syncToDisk, SyncResult } from './syncService';

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function Home() {
  const { files, activeTabId, openTabs, setFiles, closeTab, setActiveTab } = useFileStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check IndexedDB on mount; restore workspace if present
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const existing = await dbService.getAllFiles();
        if (!cancelled && existing.length > 0) {
          setFiles(existing);
        }
      } catch (err) {
        console.error('Failed to load workspace from IndexedDB:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [setFiles]);

  // Keyboard shortcuts: Ctrl+W close tab, Ctrl+Tab switch tabs
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+W or Cmd+W → close active tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && !e.shiftKey) {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
        return;
      }

      // Ctrl+Tab → next tab, Ctrl+Shift+Tab → previous tab
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (openTabs.length === 0) return;
        const currentIndex = openTabs.indexOf(activeTabId ?? '');
        if (currentIndex === -1) {
          setActiveTab(openTabs[0]);
          return;
        }
        if (e.shiftKey) {
          const prevIndex = currentIndex === 0 ? openTabs.length - 1 : currentIndex - 1;
          setActiveTab(openTabs[prevIndex]);
        } else {
          const nextIndex = currentIndex === openTabs.length - 1 ? 0 : currentIndex + 1;
          setActiveTab(openTabs[nextIndex]);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, openTabs, closeTab, setActiveTab]);

  const handleOpenFolder = useCallback(async () => {
    setError(null);
    setIsPicking(true);
    try {
      const { nodes, rootHandle: newRootHandle } = await loadFolder();
      if (nodes.length === 0) {
        setIsPicking(false);
        return;
      }
      await dbService.clearAllFiles();
      await dbService.bulkInsertFiles(nodes);
      setFiles(nodes);
      setRootHandle(newRootHandle);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open folder';
      setError(message);
    } finally {
      setIsPicking(false);
    }
  }, [setFiles]);

  const handleCloseWorkspace = useCallback(async () => {
    try {
      await dbService.clearAllFiles();
      setFiles([]);
      setRootHandle(null);
      setSyncStatus(null);
    } catch (err) {
      console.error('Failed to close workspace:', err);
    }
  }, [setFiles]);

  const handleSyncToDisk = useCallback(async () => {
    let currentRootHandle = rootHandle;

    // If rootHandle is missing in state (e.g. after refresh), try to recover it from the files list
    if (!currentRootHandle) {
      const rootNode = files.find((f) => f.parentId === null && f.type === 'folder');
      if (rootNode?.handle && rootNode.handle.kind === 'directory') {
        currentRootHandle = rootNode.handle as FileSystemDirectoryHandle;
        setRootHandle(currentRootHandle);
      }
    }

    if (!currentRootHandle) {
      setSyncStatus('No folder opened');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Syncing...');

    try {
      const result: SyncResult = await syncToDisk(currentRootHandle, files, {
        onProgress: (status) => {
          setSyncStatus(status.message);
        },
      });

      if (result.success) {
        const summary = `Saved: ${result.created.length} created, ${result.updated.length} updated, ${result.deleted.length} deleted`;
        setSyncStatus(summary);
        // Clear status after 3 seconds
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        const errorMsg = result.errors.length > 0
          ? `Sync failed: ${result.errors[0].message}`
          : 'Sync failed';
        setSyncStatus(errorMsg);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setSyncStatus(`Error: ${message}`);
    } finally {
      setIsSyncing(false);
    }
  }, [rootHandle, files]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1e1e]">
        <div className="text-[#858585]">Loading workspace…</div>
      </div>
    );
  }

  // Landing screen when no files are loaded
  if (files.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1e1e] px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#252526] shadow-sm border border-[#2b2b2b]">
            <FolderIcon className="h-8 w-8 text-[#cccccc]" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Welcome to ZIDE</h1>
          <p className="text-[#858585] mb-8">
            Open a local folder to start editing. Your files are kept in the browser and persist across sessions.
          </p>
          <button
            onClick={handleOpenFolder}
            disabled={isPicking}
            className="inline-flex items-center justify-center rounded-lg bg-[#007acc] px-6 py-3 text-sm font-medium text-white hover:bg-[#0062a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPicking ? 'Reading folder…' : 'Open Folder'}
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // IDE view
  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
      {/* Sidebar Section */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[#2b2b2b] overflow-hidden bg-[#252526]">
        <div className="p-4 border-b border-[#2b2b2b] flex justify-between items-center bg-[#252526]">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-[#cccccc] tracking-tight">ZIDE</h1>
            {syncStatus && (
              <span className={`text-xs ${syncStatus.startsWith('Error') || syncStatus.includes('failed') ? 'text-red-400' : 'text-[#858585]'}`}>
                • {syncStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncToDisk}
              disabled={isSyncing}
              className="text-xs text-[#858585] hover:text-[#cccccc] transition-colors disabled:opacity-50"
              title="Save all changes to disk"
            >
              {isSyncing ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCloseWorkspace}
              className="text-xs text-[#858585] hover:text-[#cccccc] transition-colors"
              title="Close workspace"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileTree />
        </div>
      </aside>

      {/* Editor Section */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#1e1e1e]">
        <TabsBar />
        <div className="flex-1 overflow-hidden">
          <EditorPane />
        </div>
      </main>
    </div>
  );
}
