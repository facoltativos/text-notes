
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type GetNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const getNote = async (input: GetNoteInput): Promise<Note | null> => {
  try {
    const result = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, input.id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Note retrieval failed:', error);
    throw error;
  }
};
