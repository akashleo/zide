'use client';

import { useEffect } from 'react';
import { FileTree } from './components';
import { useFileStore } from './fileStore';
import { FileNode } from './fs';

// Sample data to demonstrate the file tree
const sampleFiles: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    parentId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: 'components',
    type: 'folder',
    parentId: '1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    name: 'Button.tsx',
    type: 'file',
    parentId: '2',
    content: 'export function Button() { return <button>Click</button>; }',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '4',
    name: 'Header.tsx',
    type: 'file',
    parentId: '2',
    content: 'export function Header() { return <header>Header</header>; }',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '5',
    name: 'utils',
    type: 'folder',
    parentId: '1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '6',
    name: 'helpers.ts',
    type: 'file',
    parentId: '5',
    content: 'export const formatDate = (d: Date) => d.toISOString();',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '7',
    name: 'README.md',
    type: 'file',
    parentId: null,
    content: '# Project README',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default function Home() {
  const { files, activeFileId, setFiles } = useFileStore();

  // Load sample files on mount
  useEffect(() => {
    setFiles(sampleFiles);
  }, [setFiles]);

  // Get active file content for display
  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <div className="flex h-screen bg-white">
      {/* File Tree Sidebar */}
      <FileTree />

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        {activeFile ? (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {activeFile.name}
            </h2>
            {activeFile.content ? (
              <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm font-mono text-gray-700 overflow-auto">
                {activeFile.content}
              </pre>
            ) : (
              <p className="text-gray-500 italic">No content</p>
            )}
          </div>
        ) : (
          <div className="text-gray-500">
            Select a file from the sidebar to view its contents
          </div>
        )}
      </main>
    </div>
  );
}
