'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileTree, EditorPane, TabsBar, AiPanel } from './components';
import { useFileStore } from './fileStore';
import { dbService } from './db';
import { loadFolder } from './loadFolder';

export default function Home() {
  const { files, activeTabId, openTabs, setFiles, closeTab, setActiveTab } = useFileStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // AI Panel state
  const [aiPanelWidth, setAiPanelWidth] = useState(380);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isAiResizing, setIsAiResizing] = useState(false);

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

  // Handle sidebar resizing
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Handle AI panel resizing
  const startAiResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsAiResizing(true);
  }, []);

  const stopAiResizing = useCallback(() => {
    setIsAiResizing(false);
  }, []);

  const aiResize = useCallback((e: MouseEvent) => {
    if (isAiResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 280 && newWidth < 700) {
        setAiPanelWidth(newWidth);
      }
    }
  }, [isAiResizing]);

  useEffect(() => {
    if (isAiResizing) {
      window.addEventListener('mousemove', aiResize);
      window.addEventListener('mouseup', stopAiResizing);
    } else {
      window.removeEventListener('mousemove', aiResize);
      window.removeEventListener('mouseup', stopAiResizing);
    }
    return () => {
      window.removeEventListener('mousemove', aiResize);
      window.removeEventListener('mouseup', stopAiResizing);
    };
  }, [isAiResizing, aiResize, stopAiResizing]);

  // Keyboard shortcuts: Ctrl+W close tab, Ctrl+Tab switch tabs, Ctrl+B toggle sidebar, Ctrl+L toggle AI panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+B -> toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
        return;
      }

      // Ctrl+L -> toggle AI panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setIsAiPanelOpen(prev => !prev);
        return;
      }

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
          setActiveTab(nextIndex === -1 ? openTabs[0] : openTabs[nextIndex]);
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
      const nodes = await loadFolder();
      if (nodes.length === 0) {
        setIsPicking(false);
        return;
      }
      await dbService.clearAllFiles();
      await dbService.bulkInsertFiles(nodes);
      setFiles(nodes);
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
    } catch (err) {
      console.error('Failed to close workspace:', err);
    }
  }, [setFiles]);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f14]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-1 w-24 bg-[#1a1a24] overflow-hidden rounded-full">
            <div className="h-full bg-indigo-500 w-1/2 animate-[loading_1s_ease-in-out_infinite]" />
          </div>
          <div className="text-[12px] font-bold text-[#6a6a80] tracking-[0.2em] uppercase">Initializing</div>
        </div>
        <style jsx>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  // Landing screen when no files are loaded
  if (files.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f14] px-4 font-sans select-none">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-[#f0f0f5] mb-3 tracking-tight">ZIDE</h1>
          <p className="text-[#9a9ab0] mb-10 text-[16px] leading-relaxed">
            A minimalist code editor for the web.<br/>
            Open a folder to begin.
          </p>
          <button
            onClick={handleOpenFolder}
            disabled={isPicking}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-indigo-500 px-8 py-3.5 text-[15px] font-bold text-white hover:bg-indigo-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
          >
            <span className="relative flex items-center gap-2">
              {isPicking ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#09090b]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Reading folder...
                </>
              ) : (
                <>
                  Open Folder
                  <svg className="group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </>
              )}
            </span>
          </button>
          {error && (
            <p className="mt-6 text-[14px] text-red-400 font-medium bg-red-400/10 py-2.5 px-5 rounded-lg inline-block">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // IDE view
  return (
    <div className="flex h-screen bg-[#0f0f14] text-[#b0b0c8] overflow-hidden select-none">
      {/* Sidebar Section */}
      <aside 
        style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
        className={`flex-shrink-0 flex flex-col border-r border-[#2a2a3a] overflow-hidden bg-[#0f0f14] transition-[width] duration-200 ease-in-out relative group`}
      >
        <div className="h-12 px-4 border-b border-[#2a2a3a] flex justify-between items-center bg-[#0f0f14]">
          <h1 className="text-[12px] font-bold text-[#f0f0f5] tracking-wider uppercase opacity-90">Explorer</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCloseWorkspace}
              className="p-1.5 rounded-full text-[#6a6a80] hover:text-[#f0f0f5] hover:bg-[#1a1a24] transition-all"
              title="Close workspace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <FileTree />
        </div>
      </aside>

      {/* Resize Handle */}
      {!isSidebarCollapsed && (
        <div
          onMouseDown={startResizing}
          className={`w-[2px] cursor-col-resize hover:bg-indigo-500 transition-colors active:bg-indigo-500 z-50 bg-transparent h-full flex-shrink-0`}
        />
      )}

      {/* Editor Section */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#0f0f14]">
        <div className="flex items-center bg-[#0f0f14] border-b border-[#2a2a3a] h-12">
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 ml-1 text-[#6a6a80] hover:text-[#f0f0f5] transition-colors"
              title="Expand Sidebar (Ctrl+B)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/></svg>
            </button>
          )}
          <div className="flex-1 overflow-hidden">
            <TabsBar />
          </div>
          {!isAiPanelOpen && (
            <button
              onClick={() => setIsAiPanelOpen(true)}
              className="p-2 mr-1 text-[#6a6a80] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all"
              title="Open AI Panel (Ctrl+L)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-hidden relative">
          <EditorPane />
        </div>
      </main>

      {/* AI Panel Resize Handle */}
      {isAiPanelOpen && (
        <div
          onMouseDown={startAiResizing}
          className="w-[2px] cursor-col-resize hover:bg-indigo-500 transition-colors active:bg-indigo-500 z-50 bg-transparent h-full flex-shrink-0"
        />
      )}

      {/* AI Panel */}
      {isAiPanelOpen && (
        <aside
          style={{ width: aiPanelWidth }}
          className="flex-shrink-0 border-l border-[#2a2a3a] overflow-hidden transition-[width] duration-200 ease-in-out"
        >
          <AiPanel onClose={() => setIsAiPanelOpen(false)} />
        </aside>
      )}
    </div>
  );
}
