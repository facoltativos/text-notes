
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq } from 'drizzle-orm';

describe('updateNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update note title only', async () => {
    // Create a test note directly in database
    const insertResult = await db.insert(notesTable)
      .values({
        title: 'Original Title',
        content: 'Original content'
      })
      .returning()
      .execute();
    
    const createdNote = insertResult[0];

    // Update only the title
    const updateInput: UpdateNoteInput = {
      id: createdNote.id,
      title: 'Updated Title'
    };

    const result = await updateNote(updateInput);

    // Verify the title was updated
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Original content');
    expect(result.id).toEqual(createdNote.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdNote.updated_at).toBe(true);
  });

  it('should update note content only', async () => {
    // Create a test note directly in database
    const insertResult = await db.insert(notesTable)
      .values({
        title: 'Original Title',
        content: 'Original content'
      })
      .returning()
      .execute();
    
    const createdNote = insertResult[0];

    // Update only the content
    const updateInput: UpdateNoteInput = {
      id: createdNote.id,
      content: 'Updated content'
    };

    const result = await updateNote(updateInput);

    // Verify the content was updated
    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Updated content');
    expect(result.id).toEqual(createdNote.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdNote.updated_at).toBe(true);
  });

  it('should update both title and content', async () => {
    // Create a test note directly in database
    const insertResult = await db.insert(notesTable)
      .values({
        title: 'Original Title',
        content: 'Original content'
      })
      .returning()
      .execute();
    
    const createdNote = insertResult[0];

    // Update both title and content
    const updateInput: UpdateNoteInput = {
      id: createdNote.id,
      title: 'Updated Title',
      content: 'Updated content'
    };

    const result = await updateNote(updateInput);

    // Verify both fields were updated
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content');
    expect(result.id).toEqual(createdNote.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdNote.updated_at).toBe(true);
  });

  it('should save updated note to database', async () => {
    // Create a test note directly in database
    const insertResult = await db.insert(notesTable)
      .values({
        title: 'Original Title',
        content: 'Original content'
      })
      .returning()
      .execute();
    
    const createdNote = insertResult[0];

    // Update the note
    const updateInput: UpdateNoteInput = {
      id: createdNote.id,
      title: 'Updated Title',
      content: 'Updated content'
    };

    const result = await updateNote(updateInput);

    // Query the database to verify the changes were persisted
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Updated Title');
    expect(notes[0].content).toEqual('Updated content');
    expect(notes[0].updated_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at > createdNote.updated_at).toBe(true);
  });

  it('should throw error when note does not exist', async () => {
    const updateInput: UpdateNoteInput = {
      id: 999,
      title: 'Updated Title'
    };

    await expect(updateNote(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update with empty content', async () => {
    // Create a test note directly in database
    const insertResult = await db.insert(notesTable)
      .values({
        title: 'Original Title',
        content: 'Original content'
      })
      .returning()
      .execute();
    
    const createdNote = insertResult[0];

    // Update with empty content
    const updateInput: UpdateNoteInput = {
      id: createdNote.id,
      content: ''
    };

    const result = await updateNote(updateInput);

    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('');
    expect(result.id).toEqual(createdNote.id);
  });
});
