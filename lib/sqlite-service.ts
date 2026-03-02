import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('yeahmoney_ai.db');

  // Create table for remembering user category preferences
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS category_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT UNIQUE,
      categoryId TEXT NOT NULL
    );
  `);

  return db;
}

export async function savePreference(notes: string, categoryId: string) {
  const database = await getDb();
  const words = notes.toLowerCase().trim().split(/\s+/);

  // Save each meaningful word as a potential trigger for this category
  for (const word of words) {
    if (word.length > 3) {
      await database.runAsync(
        'INSERT OR REPLACE INTO category_memory (keyword, categoryId) VALUES (?, ?)',
        [word, categoryId]
      );
    }
  }
}

export async function getPreference(notes: string): Promise<string | null> {
  const database = await getDb();
  const words = notes.toLowerCase().trim().split(/\s+/);

  for (const word of words) {
    if (word.length > 3) {
      const result = await database.getFirstAsync<{ categoryId: string }>(
        'SELECT categoryId FROM category_memory WHERE keyword = ?',
        [word]
      );
      if (result) return result.categoryId;
    }
  }
  return null;
}
