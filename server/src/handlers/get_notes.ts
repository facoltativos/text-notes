
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type GetNotesInput, type Note } from '../schema';
import { desc, asc } from 'drizzle-orm';

export const getNotes = async (input?: GetNotesInput): Promise<Note[]> => {
  try {
    // Apply default sorting if no input provided
    const sortBy = input?.sortBy || 'updated_desc';
    
    // Build the complete query based on sorting
    let results;
    
    switch (sortBy) {
      case 'title_asc':
        results = await db.select()
          .from(notesTable)
          .orderBy(asc(notesTable.title))
          .execute();
        break;
      case 'title_desc':
        results = await db.select()
          .from(notesTable)
          .orderBy(desc(notesTable.title))
          .execute();
        break;
      case 'created_asc':
        results = await db.select()
          .from(notesTable)
          .orderBy(asc(notesTable.created_at))
          .execute();
        break;
      case 'created_desc':
        results = await db.select()
          .from(notesTable)
          .orderBy(desc(notesTable.created_at))
          .execute();
        break;
      case 'updated_asc':
        results = await db.select()
          .from(notesTable)
          .orderBy(asc(notesTable.updated_at))
          .execute();
        break;
      case 'updated_desc':
      default:
        results = await db.select()
          .from(notesTable)
          .orderBy(desc(notesTable.updated_at))
          .execute();
        break;
    }

    return results;
  } catch (error) {
    console.error('Get notes failed:', error);
    throw error;
  }
};
