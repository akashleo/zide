'use client';

import { useState, useCallback } from 'react';
import { TreeNode as TreeNodeType } from '../fs';

interface TreeNodeProps {
  node: TreeNodeType;
  activeFileId: string | null;
  onFileClick: (fileId: string) => void;
  level: number;
}

/**
 * TreeNode - Recursive component for rendering file/folder nodes.
 *
 * Features:
 * - Folders: Toggle expand/collapse with local state (not in global store)
 * - Files: Click to set as active, visual highlight when active
 * - Recursive rendering for nested children
 * - Indentation based on nesting level
 */
export function TreeNode({ node, activeFileId, onFileClick, level }: TreeNodeProps) {
  // Local state for folder expansion - kept out of global store
  // as it's purely UI state, not application data
  const [isExpanded, setIsExpanded] = useState(false);

  const isFolder = node.type === 'folder';
  const isActive = node.id === activeFileId;
  const hasChildren = isFolder && node.children.length > 0;

  // Toggle folder expansion
  const handleFolderClick = useCallback(() => {
    if (isFolder) {
      setIsExpanded((prev) => !prev);
    }
  }, [isFolder]);

  // Handle file click - notifies parent to set active file
  const handleFileClick = useCallback(() => {
    if (!isFolder) {
      onFileClick(node.id);
    }
  }, [isFolder, node.id, onFileClick]);

  // Calculate indentation based on nesting level (16px per level)
  const indentStyle = { paddingLeft: `${level * 16 + 12}px` };

  return (
    <div>
      {/* Node row */}
      <div
        style={indentStyle}
        className={`
          flex items-center py-1 px-2 cursor-pointer select-none text-sm
          transition-colors duration-150
          ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
        `}
        onClick={isFolder ? handleFolderClick : handleFileClick}
      >
        {/* Expand/collapse indicator for folders */}
        {isFolder && (
          <span className="mr-1 w-4 text-center text-xs text-gray-500">
            {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
          </span>
        )}

        {/* Icon for file/folder */}
        <span className="mr-2 text-xs">
          {isFolder ? (isExpanded ? '📂' : '📁') : '📄'}
        </span>

        {/* Node name */}
        <span className="truncate">{node.name}</span>
      </div>

      {/* Recursively render children when folder is expanded */}
      {isFolder && isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeFileId={activeFileId}
              onFileClick={onFileClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
