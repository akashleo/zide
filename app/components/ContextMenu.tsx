'use client';

import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

/**
 * Portable context menu component.
 * Renders at specific (x, y) coordinates and closes on outside click.
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Ensure menu doesn't go off-screen
  const style: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 1000,
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="bg-[#252526] border border-[#454545] shadow-lg rounded-md py-1 min-w-[160px] animate-in fade-in zoom-in duration-75"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors
            ${item.danger 
              ? 'text-red-400 hover:bg-red-500/10' 
              : 'text-[#cccccc] hover:bg-[#37373d] hover:text-white'
            }`}
        >
          {item.icon && <span className="opacity-70">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
