
import { type GetNoteInput, type Note } from '../schema';

export declare function getNote(input: GetNoteInput): Promise<Note | null>;
