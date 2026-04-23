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

  const indentStyle = { paddingLeft: `${level * 12 + 12}px` };

  return (
    <div>
      <div
        style={indentStyle}
        onContextMenu={handleContextMenu}
        className={`
          flex items-center py-1 px-2 cursor-pointer select-none text-sm group
          transition-colors duration-75
          ${isActive ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white'}
          ${isRenaming ? 'bg-[#094771]' : ''}
        `}
        onClick={isFolder ? handleFolderClick : handleFileClick}
      >
        <span className="mr-1.5 w-4 flex items-center justify-center text-[10px] opacity-70">
          {isFolder ? (isExpanded ? '▼' : '▶') : ''}
        </span>

        <Icon className={`mr-2 text-lg flex-shrink-0 ${iconColor}`} />

        {isRenaming ? (
          <RenameInput
            initialValue={node.name}
            onConfirm={onRenameComplete}
            onCancel={onRenameCancel}
          />
        ) : (
          <>
            <span className="truncate flex-1">{node.name}</span>
            {node.isDirty && <span className="ml-1 text-[10px] text-blue-400 opacity-80">●</span>}
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
