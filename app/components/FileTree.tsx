'use client';

import { useMemo } from 'react';
import { useFileStore } from '../fileStore';
import { buildTree, FileNode, TreeNode as TreeNodeType } from '../fs';
import { TreeNode } from './TreeNode';

/**
 * FileTree - Main sidebar component for the file explorer.
 *
 * Converts the flat file list from Zustand store into a hierarchical tree
 * structure and renders it recursively.
 */
export function FileTree() {
  // Get flat files and active file ID from global state
  const files = useFileStore((state) => state.files);
  const activeFileId = useFileStore((state) => state.activeFileId);
  const setActiveFile = useFileStore((state) => state.setActiveFile);

  // Build hierarchical tree structure from flat list
  // Memoized to avoid rebuilding on every render
  const tree = useMemo(() => buildTree(files), [files]);

  // Handler for when a file is clicked - updates global activeFileId
  const handleFileClick = (fileId: string) => {
    setActiveFile(fileId);
  };

  // Empty state when no files exist
  if (tree.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No files yet. Create a file to get started.
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="py-2">
        {/* Render root-level nodes recursively */}
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            activeFileId={activeFileId}
            onFileClick={handleFileClick}
            level={0}
          />
        ))}
      </div>
    </div>
  );
}
