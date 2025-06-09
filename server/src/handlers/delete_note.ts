
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type DeleteNoteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteNote = async (input: DeleteNoteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the note by id
    const result = await db.delete(notesTable)
      .where(eq(notesTable.id, input.id))
      .execute();

    // Check if any rows were affected (note existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Note deletion failed:', error);
    throw error;
  }
};
