'use client';

import { useCallback } from 'react';
import { useFileStore } from '../fileStore';
import { getFileIcon } from './fileIcons';

function CloseIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
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
    <div className="flex h-9 min-h-0 items-end overflow-x-auto border-b border-[#2b2b2b] bg-[#252526] scrollbar-hide">
      {openTabs.map((fileId) => {
        const file = files.find((f) => f.id === fileId);
        if (!file) return null;

        const isActive = fileId === activeTabId;
        const { icon: Icon, color: iconColor } = getFileIcon(file?.name || '');

        return (
          <button
            key={fileId}
            onMouseDown={(e) => handleTabClick(e, fileId)}
            className={`
              group relative flex h-8 min-w-0 max-w-[160px] flex-shrink-0 items-center
              border-r border-[#2b2b2b] px-3 text-xs transition-colors
              ${isActive
                ? 'bg-[#1e1e1e] text-[#cccccc]'
                : 'bg-[#2d2d2d] text-[#858585] hover:bg-[#2a2d2e] hover:text-[#cccccc]'
              }
            `}
          >
            <Icon className={`mr-2 text-sm flex-shrink-0 ${iconColor}`} />
            <span className="truncate">{file.name}</span>
            {file.isDirty && <span className="ml-1 text-[10px] text-blue-400">●</span>}
            <span
              onClick={(e) => handleCloseClick(e, fileId)}
              className={`
                ml-2 inline-flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center
                rounded-sm transition-colors
                ${isActive
                  ? 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                  : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                }
              `}
              title="Close tab"
            >
              <CloseIcon className="h-3 w-3" />
            </span>
            {/* Active tab top border indicator */}
            {isActive && (
              <span className="absolute top-0 left-0 right-0 h-[1px] bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
