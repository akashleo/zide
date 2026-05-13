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
    <div className="flex h-12 items-center overflow-x-auto scrollbar-hide bg-[#0f0f14] px-1 gap-0.5">
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
              group relative flex h-10 min-w-0 max-w-[200px] flex-shrink-0 items-center
              px-3.5 text-[14px] transition-all duration-150 ease-in-out border-t-2 border-transparent rounded-t-md
              ${isActive
                ? 'bg-[#1a1a24] text-[#f0f0f5] border-t-indigo-500'
                : 'bg-[#0f0f14] text-[#6a6a80] hover:text-[#b0b0c8] hover:bg-[#1a1a24]/60'
              }
            `}
          >
            <Icon className={`mr-2 text-sm flex-shrink-0 ${iconColor} ${!isActive && 'opacity-60'}`} />
            <span className="truncate mr-2 font-medium">{file.name}</span>
            {file.isDirty ? (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            ) : (
              <span
                onClick={(e) => handleCloseClick(e, fileId)}
                className={`
                  ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded-md
                  hover:bg-[#2a2a3a] hover:text-[#f0f0f5] transition-all
                  ${isActive ? 'text-[#9a9ab0]' : 'text-[#6a6a80]'}
                `}
                title="Close tab"
              >
                <CloseIcon className="h-3 w-3" />
              </span>
            )}
            {/* Bottom active indicator - optional, using top border for now */}
            {/* {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500" />
            )} */}
          </button>
        );
      })}
    </div>
  );
}
