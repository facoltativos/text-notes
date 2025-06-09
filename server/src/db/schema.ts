
import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const notesTable = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Note = typeof notesTable.$inferSelect;
export type NewNote = typeof notesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { notes: notesTable };
