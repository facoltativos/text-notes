
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<{ title: string; content: string; updated_at: Date }> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    // Update the note
    const result = await db.update(notesTable)
      .set(updateData)
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    // Check if note was found and updated
    if (result.length === 0) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};
