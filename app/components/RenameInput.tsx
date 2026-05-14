'use client';

import React, { useEffect, useRef, useState } from 'react';
import './RenameInput.css';

interface RenameInputProps {
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Inline input component for renaming or creating nodes.
 * Handles confirmation on Enter and cancellation on Escape/Blur.
 */
export const RenameInput: React.FC<RenameInputProps> = ({
  initialValue,
  onConfirm,
  onCancel,
  className = '',
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus and select text when mounted
    if (inputRef.current) {
      inputRef.current.focus();
      // Select filename part excluding extension if possible
      const lastDotIndex = initialValue.lastIndexOf('.');
      if (lastDotIndex > 0) {
        inputRef.current.setSelectionRange(0, lastDotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm(value.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onConfirm(value.trim())}
      className={`rename-input ${className}`}
      spellCheck={false}
    />
  );
};
