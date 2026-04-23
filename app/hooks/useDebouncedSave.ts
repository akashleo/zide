import { useCallback, useRef } from 'react';
import { debounce } from 'lodash-es';
import { dbService } from '../db';
import { FileNode } from '../fs';

/**
 * useDebouncedSave - Custom hook to handle debounced persistence to IndexedDB.
 * 
 * Why debounce?
 * - To prevent excessive disk I/O on every keystroke.
 * - To keep the UI responsive while ensuring data is eventually persisted.
 * 
 * @param delay - Debounce delay in milliseconds (default 500ms)
 */
export function useDebouncedSave(delay: number = 500) {
  // We use a ref for the debounced function to ensure it persists across re-renders
  // and maintains its internal timer/state correctly.
  const debouncedSaveRef = useRef(
    debounce(async (file: FileNode) => {
      try {
        await dbService.upsertFile(file);
        console.log(`Saved file: ${file.name} to IndexedDB`);
      } catch (error) {
        console.error('Failed to save file to IndexedDB:', error);
      }
    }, delay)
  );

  /**
   * save - The function to call when content changes.
   * It takes the full FileNode to ensure consistency in IndexedDB.
   */
  const save = useCallback((file: FileNode) => {
    debouncedSaveRef.current(file);
  }, []);

  return { save };
}
