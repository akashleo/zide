import Dexie, { Table } from 'dexie';
import { FileNode } from './fs';

/**
 * Dexie Database setup for the IDE.
 * Named "ai-ide" as requested.
 */
export class AIIDEDatabase extends Dexie {
  files!: Table<FileNode>;

  constructor() {
    super('ai-ide');
    this.version(1).stores({
      // id is primary key, others are indexed for performance
      files: 'id, parentId, type, updatedAt'
    });
  }
}

export const db = new AIIDEDatabase();

/**
 * Database access layer.
 * Keeps logic separate from the raw Dexie instance.
 */
export const dbService = {
  async getAllFiles(): Promise<FileNode[]> {
    return db.files.toArray();
  },

  async getFileById(id: string): Promise<FileNode | undefined> {
    return db.files.get(id);
  },

  async bulkInsertFiles(files: FileNode[]): Promise<void> {
    await db.files.bulkAdd(files);
  },

  async upsertFile(file: FileNode): Promise<void> {
    await db.files.put(file);
  },

  async deleteFile(id: string): Promise<void> {
    await db.files.delete(id);
  },

  async deleteFilesByParent(parentId: string | null): Promise<void> {
    if (parentId === null) {
      // Logic for deleting root level nodes if needed, 
      // but usually we filter by a specific parentId.
      await db.files.where('parentId').equals('null').delete();
    } else {
      await db.files.where('parentId').equals(parentId).delete();
    }
  }
};
