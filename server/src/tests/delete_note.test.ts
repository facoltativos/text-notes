
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type DeleteNoteInput } from '../schema';
import { deleteNote } from '../handlers/delete_note';
import { eq } from 'drizzle-orm';

describe('deleteNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing note', async () => {
    // Create a test note first
    const insertResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'This is a test note'
      })
      .returning()
      .execute();

    const noteId = insertResult[0].id;

    // Delete the note
    const deleteInput: DeleteNoteInput = { id: noteId };
    const result = await deleteNote(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify note is actually deleted from database
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();

    expect(notes).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent note', async () => {
    const deleteInput: DeleteNoteInput = { id: 999 };
    const result = await deleteNote(deleteInput);

    // Should return false since no note was deleted
    expect(result.success).toBe(false);
  });

  it('should not affect other notes when deleting', async () => {
    // Create two test notes
    const insertResult = await db.insert(notesTable)
      .values([
        { title: 'Note 1', content: 'Content 1' },
        { title: 'Note 2', content: 'Content 2' }
      ])
      .returning()
      .execute();

    const note1Id = insertResult[0].id;
    const note2Id = insertResult[1].id;

    // Delete first note
    const deleteInput: DeleteNoteInput = { id: note1Id };
    const result = await deleteNote(deleteInput);

    expect(result.success).toBe(true);

    // Verify first note is deleted
    const deletedNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note1Id))
      .execute();

    expect(deletedNotes).toHaveLength(0);

    // Verify second note still exists
    const remainingNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note2Id))
      .execute();

    expect(remainingNotes).toHaveLength(1);
    expect(remainingNotes[0].title).toEqual('Note 2');
  });
});
