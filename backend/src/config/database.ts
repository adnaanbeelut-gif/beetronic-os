import Database from 'better-sqlite3';
import path from 'path';
import type BetterSqlite3 from 'better-sqlite3';
import { initializeDatabase } from './sqlite-init';

const dbPath = path.join(process.cwd(), 'beetronic.db');
const db: BetterSqlite3.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

initializeDatabase();

export default db;

export const query = (text: string, params?: unknown[]) => {
  try {
    // Convert PostgreSQL syntax to SQLite
    let sqliteText = text
      .replace(/\$(\d+)/g, '?')
      .replace(/CURRENT_TIMESTAMP/g, "datetime('now')")
      .replace(/gen_random_uuid\(\)/g, "LOWER(HEX(RANDOMBLOB(16)))")
      .replace(/ON DELETE CASCADE/gi, 'ON DELETE CASCADE')
      .replace(/ON DELETE RESTRICT/gi, 'ON DELETE RESTRICT')
      .replace(/ON DELETE SET NULL/gi, 'ON DELETE SET NULL');

    // Handle INSERT ... RETURNING
    if (sqliteText.includes('RETURNING')) {
      const [beforeReturning, returningClause] = sqliteText.split('RETURNING');
      const columns = returningClause.trim().split(',').map((col: string) => col.trim());

      // Execute insert
      const stmt = db.prepare(beforeReturning.trim());
      stmt.run(...(params || []));

      // For INSERT, get the last row
      if (beforeReturning.includes('INSERT')) {
        // Extract table name and columns to query back
        const tableMatch = beforeReturning.match(/INSERT INTO (\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          const query = `SELECT ${columns.join(', ')} FROM ${tableName} ORDER BY ROWID DESC LIMIT 1`;
          const result = db.prepare(query).all();
          return { rows: result, rowCount: 1 };
        }
      }

      return { rows: [], rowCount: 0 };
    }

    // Regular SELECT/UPDATE/DELETE
    if (sqliteText.trim().toUpperCase().startsWith('SELECT')) {
      const rows = db.prepare(sqliteText).all(...(params || []));
      return { rows, rowCount: rows.length };
    } else {
      const stmt = db.prepare(sqliteText);
      const info = stmt.run(...(params || []));
      return { rows: [], rowCount: info.changes };
    }
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};
