
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // Insert note record
    const result = await db.insert(notesTable)
      .values({
        title: input.title,
        content: input.content // This will use the default "" from Zod if not provided
      })
      .returning()
      .execute();

    const note = result[0];
    return note;
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
