'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { TreeNode as TreeNodeType } from '../fs';
import { RenameInput } from './RenameInput';
import { useFileStore } from '../fileStore';
import { getFileIcon, getFolderIcon } from './fileIcons';
import { VscChevronRight } from 'react-icons/vsc';

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

  // Compute icon based on type and state
  const { icon: Icon, color: iconColor } = useMemo(() => {
    if (isFolder) return getFolderIcon(isExpanded);
    return getFileIcon(node.name);
  }, [isFolder, isExpanded, node.name]);

  const handleFolderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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

  const indentStyle = { paddingLeft: `${level * 12 + 10}px` };

  return (
    <div role="none">
      <div
        style={indentStyle}
        onContextMenu={handleContextMenu}
        className={`file-item ${isActive ? 'active' : ''} ${isRenaming ? 'renaming' : ''}`}
        onClick={isFolder ? handleFolderClick : handleFileClick}
        role="treeitem"
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isActive}
        tabIndex={0}
      >
        {isFolder && (
          <VscChevronRight 
            className={`file-item-chevron ${isExpanded ? 'expanded' : ''}`}
          />
        )}
        
        <div className="file-item-icon">
          <Icon className={iconColor} size={16} />
        </div>

        {isRenaming ? (
          <RenameInput
            initialValue={node.name}
            onConfirm={onRenameComplete}
            onCancel={onRenameCancel}
          />
        ) : (
          <>
            <span className="file-item-name">{node.name}</span>
            {node.isDirty && (
              <span className="file-item-dirty" />
            )}
          </>
        )}
      </div>

      {isFolder && isExpanded && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeTabId={activeTabId}
              onFileClick={onFileClick}
              onContextMenu={handleContextMenu}
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
