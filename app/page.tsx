'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaArrowRight, FaRobot, FaSpinner, FaXmark, FaSun, FaMoon } from 'react-icons/fa6';
import { PiSidebarSimpleBold } from 'react-icons/pi';
import { FileTree, EditorPane, TabsBar, AiPanel } from './components';
import { useFileStore } from './fileStore';
import { dbService } from './db';
import { loadFolder } from './loadFolder';
import './page.css';

export default function Home() {
  const { files, activeTabId, openTabs, setFiles, closeTab, setActiveTab } = useFileStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('zide-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  // Apply theme change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zide-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // AI Panel resizing logic remains
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
      <div className="loading-container">
        <div className="loading-inner">
          <div className="loading-bar-track">
            <div className="loading-bar-fill" />
          </div>
          <div className="loading-text">Initializing</div>
        </div>
      </div>
    );
  }

  // Landing screen when no files are loaded
  if (files.length === 0) {
    return (
      <div className="landing-container">
        <div className="landing-card">
          <h1 className="landing-title">ZIDE</h1>
          <p className="landing-desc">
            A minimalist code editor for the web.<br/>
            Open a folder to begin.
          </p>
          <button
            onClick={handleOpenFolder}
            disabled={isPicking}
            className="landing-btn"
          >
            <span className="landing-btn-content">
              {isPicking ? (
                <>
                  <FaSpinner className="landing-spinner" />
                  Reading folder...
                </>
              ) : (
                <>
                  Open Folder
                  <FaArrowRight className="landing-arrow" size={16} />
                </>
              )}
            </span>
          </button>
          {error && (
            <p className="landing-error">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // IDE view
  return (
    <div className="ide-container">
      {/* Sidebar Section */}
      <aside
        style={{ width: isSidebarCollapsed ? 0 : 300 }}
        className="sidebar"
      >
        <div className="sidebar-filetree">
          <FileTree />
        </div>
        <div className="sidebar-header">
          <h1 className="sidebar-title">ZIDE</h1>
          <div className="sidebar-actions">
            <button
              onClick={toggleTheme}
              className="sidebar-theme-btn"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
            <button
              onClick={handleCloseWorkspace}
              className="sidebar-close-btn"
              title="Close workspace"
            >
              <FaXmark size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Editor Section */}
      <main className="editor-main">
        <div className="editor-header">
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="editor-expand-btn"
              title="Expand Sidebar (Ctrl+B)"
            >
              <PiSidebarSimpleBold size={16} />
            </button>
          )}
          <div className="editor-tabs">
            <TabsBar />
          </div>
          {!isAiPanelOpen && (
            <button
              onClick={() => setIsAiPanelOpen(true)}
              className="editor-ai-btn"
              title="Open AI Panel (Ctrl+L)"
            >
              <FaRobot size={16} />
            </button>
          )}
        </div>
        <div className="editor-content">
          <EditorPane />
        </div>
      </main>

      {/* AI Panel Resize Handle */}
      {isAiPanelOpen && (
        <div
          onMouseDown={startAiResizing}
          className="ai-resize-handle"
        />
      )}

      {/* AI Panel */}
      {isAiPanelOpen && (
        <aside
          style={{ width: aiPanelWidth }}
          className="ai-panel"
        >
          <AiPanel onClose={() => setIsAiPanelOpen(false)} />
        </aside>
      )}
    </div>
  );
}
