'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { TreeNode as TreeNodeType } from '../fs';
import { RenameInput } from './RenameInput';
import { useFileStore } from '../fileStore';
import { getFileIcon, getFolderIcon } from './fileIcons';

interface TreeNodeProps {
  node: TreeNodeType;
  activeTabId: string | null;
  onFileClick: (fileId: string) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  renamingNodeId: string | null;
  onRenameComplete: (newName: string) => void;
  onRenameCancel: () => void;
  level: number;
}

/**
 * TreeNode - Recursive component for rendering file/folder nodes.
 *
 * Features:
 * - Folders: Toggle expand/collapse with local state
 * - Files: Click to set as active
 * - Inline Rename: Show RenameInput when renaming
 * - Context Menu: Trigger parent handler on right click
 */
export function TreeNode({
  node,
  activeTabId,
  onFileClick,
  onContextMenu,
  renamingNodeId,
  onRenameComplete,
  onRenameCancel,
  level,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isFolder = node.type === 'folder';
  const isActive = node.id === activeTabId;
  const isRenaming = renamingNodeId === node.id;
  const hasChildren = isFolder && node.children.length > 0;

  // Compute icon based on type and state
  const { icon: Icon, color: iconColor } = useMemo(() => {
    if (isFolder) return getFolderIcon(isExpanded);
    return getFileIcon(node.name);
  }, [isFolder, isExpanded, node.name]);

  const handleFolderClick = useCallback(() => {
    if (isFolder) {
      setIsExpanded((prev) => !prev);
    }
  }, [isFolder]);

  const handleFileClick = useCallback(() => {
    if (!isFolder) {
      onFileClick(node.id);
    }
  }, [isFolder, node.id, onFileClick]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node.id);
    if (isFolder && !isExpanded) {
      setIsExpanded(true);
    }
  };

  const indentStyle = { paddingLeft: `${level * 14 + 14}px` };

  return (
    <div>
      <div
        style={indentStyle}
        onContextMenu={handleContextMenu}
        className={`
          flex items-center h-8 px-2 cursor-pointer select-none text-[14px] group
          transition-colors duration-100 ease-in-out
          ${isActive 
            ? 'bg-[#1a1a24] text-[#f0f0f5] border-l-2 border-indigo-500' 
            : 'hover:bg-[#1a1a24]/60 text-[#9a9ab0] hover:text-[#f0f0f5] border-l-2 border-transparent'}
          ${isRenaming ? 'bg-[#1a1a24]' : ''}
        `}
        onClick={isFolder ? handleFolderClick : handleFileClick}
      >
        <span className={`mr-1 w-4 flex items-center justify-center text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${!isFolder && 'invisible'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>

        <Icon className={`mr-2 text-[16px] flex-shrink-0 ${iconColor} ${!isActive && 'opacity-80'}`} />

        {isRenaming ? (
          <RenameInput
            initialValue={node.name}
            onConfirm={onRenameComplete}
            onCancel={onRenameCancel}
          />
        ) : (
          <>
            <span className={`truncate flex-1 ${isActive ? 'font-medium' : 'font-normal'}`}>{node.name}</span>
            {node.isDirty && (
              <span className="ml-1 h-2 w-2 rounded-full bg-blue-500/60" />
            )}
          </>
        )}
      </div>

      {isFolder && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeTabId={activeTabId}
              onFileClick={onFileClick}
              onContextMenu={onContextMenu}
              renamingNodeId={renamingNodeId}
              onRenameComplete={onRenameComplete}
              onRenameCancel={onRenameCancel}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
