'use client';

import React, { useMemo, useState, useCallback } from 'react';
import './FileTree.css';
import { useFileStore } from '../fileStore';
import { buildTree, FileNode, TreeNode as TreeNodeType } from '../fs';
import { TreeNode } from './TreeNode';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

import { VscNewFile, VscNewFolder, VscSearch, VscCollapseAll } from 'react-icons/vsc';

/**
 * FileTree - Main sidebar component for the file explorer.
 *
 * Orchestrates the file tree display, context menu state, and CRUD operations.
 */
export function FileTree() {
  const files = useFileStore((state) => state.files);
  const activeTabId = useFileStore((state) => state.activeTabId);
  const openFile = useFileStore((state) => state.openFile);
  
  const createNode = useFileStore((state) => state.createNode);
  const renameNode = useFileStore((state) => state.renameNode);
  const deleteNode = useFileStore((state) => state.deleteNode);
  const duplicateNode = useFileStore((state) => state.duplicateNode);

  // Tree and UI State
  const tree = useMemo(() => buildTree(files), [files]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);

  const handleFileClick = useCallback((fileId: string) => {
    openFile(fileId);
  }, [openFile]);

  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  }, []);

  const handleRenameComplete = useCallback((newName: string) => {
    if (renamingNodeId && newName.trim()) {
      renameNode(renamingNodeId, newName.trim());
    }
    setRenamingNodeId(null);
  }, [renamingNodeId, renameNode]);

  const handleRenameCancel = useCallback(() => {
    setRenamingNodeId(null);
  }, []);

  // Context Menu Actions
  const menuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) return [];
    
    const node = files.find(n => n.id === contextMenu.nodeId);
    if (!node) return [];

    const items: ContextMenuItem[] = [
      {
        label: 'Rename',
        onClick: () => setRenamingNodeId(contextMenu.nodeId),
      },
      {
        label: 'Duplicate',
        onClick: () => duplicateNode(contextMenu.nodeId),
      },
      {
        label: 'Delete',
        danger: true,
        onClick: () => {
          if (confirm(`Are you sure you want to delete ${node.name}?`)) {
            deleteNode(contextMenu.nodeId);
          }
        },
      },
    ];

    if (node.type === 'folder') {
      items.unshift(
        {
          label: 'New File',
          onClick: () => createNode({ name: 'new_file.txt', type: 'file', parentId: node.id }),
        },
        {
          label: 'New Folder',
          onClick: () => createNode({ name: 'new_folder', type: 'folder', parentId: node.id }),
        }
      );
    }

    return items;
  }, [contextMenu, files, createNode, duplicateNode, deleteNode]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Files</span>
        <div className="sidebar-actions">
          <button 
            className="sidebar-action-btn" 
            title="New File"
            onClick={() => createNode({ name: 'new_file.txt', type: 'file', parentId: null })}
          >
            <VscNewFile size={16} />
          </button>
          <button 
            className="sidebar-action-btn" 
            title="New Folder"
            onClick={() => createNode({ name: 'new_folder', type: 'folder', parentId: null })}
          >
            <VscNewFolder size={16} />
          </button>
          <button className="sidebar-action-btn" title="Search">
            <VscSearch size={16} />
          </button>
        </div>
      </div>

      <div 
        className="file-tree"
        role="tree"
        aria-label="File Explorer"
        onContextMenu={(e) => {
          // Right click on empty area should show root context menu
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId: 'root' });
          }
        }}
      >
        {tree.length === 0 ? (
          <div className="file-tree-empty">
            <p className="file-tree-empty-text">No files in workspace</p>
            <p className="file-tree-empty-hint">Right-click to create a file</p>
          </div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              activeTabId={activeTabId}
              onFileClick={handleFileClick}
              onContextMenu={handleContextMenu}
              renamingNodeId={renamingNodeId}
              onRenameComplete={handleRenameComplete}
              onRenameCancel={handleRenameCancel}
              level={0}
            />
          ))
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.nodeId === 'root' ? [
            {
              label: 'New File',
              onClick: () => createNode({ name: 'new_file.txt', type: 'file', parentId: null }),
            },
            {
              label: 'New Folder',
              onClick: () => createNode({ name: 'new_folder', type: 'folder', parentId: null }),
            }
          ] : menuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </aside>
  );
}
