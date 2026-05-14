'use client';

import { useCallback } from 'react';
import { X } from 'lucide-react';
import { useFileStore } from '../fileStore';
import { getFileIcon } from './fileIcons';
import './TabsBar.css';

function CloseIcon({ className }: { className?: string }) {
  return (
    <X className={className} size={14} strokeWidth={2.5} />
  );
}

/**
 * TabsBar - Horizontal tab bar for open files.
 *
 * Features:
 * - Shows one tab per open file with truncated name
 * - Highlights the active tab
 * - Click to switch; click close icon (or middle-click) to close
 * - No duplicate tabs (enforced by store)
 */
export function TabsBar() {
  const files = useFileStore((state) => state.files);
  const openTabs = useFileStore((state) => state.openTabs);
  const activeTabId = useFileStore((state) => state.activeTabId);
  const setActiveTab = useFileStore((state) => state.setActiveTab);
  const closeTab = useFileStore((state) => state.closeTab);

  const handleTabClick = useCallback(
    (e: React.MouseEvent, fileId: string) => {
      // Close on middle click
      if (e.button === 1) {
        e.preventDefault();
        closeTab(fileId);
        return;
      }
      setActiveTab(fileId);
    },
    [setActiveTab, closeTab]
  );

  const handleCloseClick = useCallback(
    (e: React.MouseEvent, fileId: string) => {
      e.stopPropagation();
      closeTab(fileId);
    },
    [closeTab]
  );

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div className="tabs-bar">
      {openTabs.map((fileId) => {
        const file = files.find((f) => f.id === fileId);
        if (!file) return null;

        const isActive = fileId === activeTabId;
        const { icon: Icon, color: iconColor } = getFileIcon(file?.name || '');

        return (
          <button
            key={fileId}
            onMouseDown={(e) => handleTabClick(e, fileId)}
            className={`tab-item ${isActive ? 'active' : ''}`}
          >
            <Icon className={`tab-icon ${iconColor} ${!isActive ? 'inactive' : ''}`} />
            <span className="tab-name">{file.name}</span>
            {file.isDirty ? (
              <span className="tab-dirty-dot" />
            ) : (
              <span
                onClick={(e) => handleCloseClick(e, fileId)}
                className="tab-close-btn"
                title="Close tab"
              >
                <CloseIcon className="tab-close-icon" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
