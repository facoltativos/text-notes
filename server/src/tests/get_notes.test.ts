
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type GetNotesInput } from '../schema';
import { getNotes } from '../handlers/get_notes';
import { eq } from 'drizzle-orm';

describe('getNotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no notes exist', async () => {
    const result = await getNotes();
    expect(result).toEqual([]);
  });

  it('should return all notes with default sorting (updated_desc)', async () => {
    // Create test notes
    await db.insert(notesTable).values([
      { title: 'First Note', content: 'First content' },
      { title: 'Second Note', content: 'Second content' }
    ]);

    const result = await getNotes();
    
    expect(result).toHaveLength(2);
    expect(result[0].title).toBeDefined();
    expect(result[0].content).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should sort by title ascending', async () => {
    await db.insert(notesTable).values([
      { title: 'Zebra Note', content: 'Z content' },
      { title: 'Alpha Note', content: 'A content' },
      { title: 'Beta Note', content: 'B content' }
    ]);

    const input: GetNotesInput = { sortBy: 'title_asc' };
    const result = await getNotes(input);
    
    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Alpha Note');
    expect(result[1].title).toEqual('Beta Note');
    expect(result[2].title).toEqual('Zebra Note');
  });

  it('should sort by title descending', async () => {
    await db.insert(notesTable).values([
      { title: 'Alpha Note', content: 'A content' },
      { title: 'Zebra Note', content: 'Z content' },
      { title: 'Beta Note', content: 'B content' }
    ]);

    const input: GetNotesInput = { sortBy: 'title_desc' };
    const result = await getNotes(input);
    
    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Zebra Note');
    expect(result[1].title).toEqual('Beta Note');
    expect(result[2].title).toEqual('Alpha Note');
  });

  it('should sort by created date ascending', async () => {
    // Insert notes with small delays to ensure different timestamps
    await db.insert(notesTable).values({ title: 'First Note', content: 'First' });
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(notesTable).values({ title: 'Second Note', content: 'Second' });
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(notesTable).values({ title: 'Third Note', content: 'Third' });

    const input: GetNotesInput = { sortBy: 'created_asc' };
    const result = await getNotes(input);
    
    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('First Note');
    expect(result[1].title).toEqual('Second Note');
    expect(result[2].title).toEqual('Third Note');
  });

  it('should sort by created date descending', async () => {
    // Insert notes with small delays to ensure different timestamps
    await db.insert(notesTable).values({ title: 'First Note', content: 'First' });
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(notesTable).values({ title: 'Second Note', content: 'Second' });
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(notesTable).values({ title: 'Third Note', content: 'Third' });

    const input: GetNotesInput = { sortBy: 'created_desc' };
    const result = await getNotes(input);
    
    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Third Note');
    expect(result[1].title).toEqual('Second Note');
    expect(result[2].title).toEqual('First Note');
  });

  it('should sort by updated date ascending', async () => {
    // Create notes first
    const notes = await db.insert(notesTable).values([
      { title: 'Note 1', content: 'Content 1' },
      { title: 'Note 2', content: 'Content 2' },
      { title: 'Note 3', content: 'Content 3' }
    ]).returning();

    // Update them in reverse order with delays to control updated_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.update(notesTable)
      .set({ content: 'Updated Content 3' })
      .where(eq(notesTable.id, notes[2].id));

    await new Promise(resolve => setTimeout(resolve, 10));
    await db.update(notesTable)
      .set({ content: 'Updated Content 2' })
      .where(eq(notesTable.id, notes[1].id));

    await new Promise(resolve => setTimeout(resolve, 10));
    await db.update(notesTable)
      .set({ content: 'Updated Content 1' })
      .where(eq(notesTable.id, notes[0].id));

    const input: GetNotesInput = { sortBy: 'updated_asc' };
    const result = await getNotes(input);
    
    expect(result).toHaveLength(3);
    // Should be ordered by updated_at ascending (oldest update first)
    expect(result[0].title).toEqual('Note 3');
    expect(result[1].title).toEqual('Note 2');
    expect(result[2].title).toEqual('Note 1');
  });

  it('should handle undefined input with default sorting', async () => {
    await db.insert(notesTable).values([
      { title: 'Test Note 1', content: 'Content 1' },
      { title: 'Test Note 2', content: 'Content 2' }
    ]);

    const result = await getNotes(undefined);
    
    expect(result).toHaveLength(2);
    // Should use default sorting (updated_desc)
    expect(result[0].title).toBeDefined();
    expect(result[1].title).toBeDefined();
  });
});
