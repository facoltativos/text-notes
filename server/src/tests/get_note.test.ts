
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type GetNoteInput } from '../schema';
import { getNote } from '../handlers/get_note';

describe('getNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a note when it exists', async () => {
    // Create a test note
    const testNote = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'This is a test note content'
      })
      .returning()
      .execute();

    const noteId = testNote[0].id;
    const input: GetNoteInput = { id: noteId };

    const result = await getNote(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(noteId);
    expect(result!.title).toEqual('Test Note');
    expect(result!.content).toEqual('This is a test note content');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when note does not exist', async () => {
    const input: GetNoteInput = { id: 999 };

    const result = await getNote(input);

    expect(result).toBeNull();
  });

  it('should return correct note when multiple notes exist', async () => {
    // Create multiple test notes
    const notes = await db.insert(notesTable)
      .values([
        { title: 'First Note', content: 'First content' },
        { title: 'Second Note', content: 'Second content' },
        { title: 'Third Note', content: 'Third content' }
      ])
      .returning()
      .execute();

    const targetNote = notes[1]; // Get the second note
    const input: GetNoteInput = { id: targetNote.id };

    const result = await getNote(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetNote.id);
    expect(result!.title).toEqual('Second Note');
    expect(result!.content).toEqual('Second content');
  });
});
