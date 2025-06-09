
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Note, CreateNoteInput, SortOrder } from '../../server/src/schema';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [sortBy, setSortBy] = useState<SortOrder>('updated_desc');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-save timer ref - using ReturnType to handle cross-platform compatibility
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state for editing
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');

  // Load notes with memoized function
  const loadNotes = useCallback(async () => {
    try {
      const result = await trpc.getNotes.query({ sortBy });
      setNotes(result);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [sortBy]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Auto-save functionality
  const saveNote = useCallback(async () => {
    if (!selectedNote || !hasUnsavedChanges) return;
    
    try {
      const updatedNote = await trpc.updateNote.mutate({
        id: selectedNote.id,
        title: editingTitle,
        content: editingContent
      });
      
      setNotes((prev: Note[]) => 
        prev.map((note: Note) => note.id === updatedNote.id ? updatedNote : note)
      );
      setSelectedNote(updatedNote);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, [selectedNote, editingTitle, editingContent, hasUnsavedChanges]);

  // Trigger auto-save when content changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        saveNote();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, saveNote]);

  const handleCreateNote = async () => {
    setIsLoading(true);
    try {
      const newNoteData: CreateNoteInput = {
        title: 'New Note',
        content: ''
      };
      const newNote = await trpc.createNote.mutate(newNoteData);
      setNotes((prev: Note[]) => [newNote, ...prev]);
      setSelectedNote(newNote);
      setEditingTitle(newNote.title);
      setEditingContent(newNote.content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await trpc.deleteNote.mutate({ id: noteId });
      setNotes((prev: Note[]) => prev.filter((note: Note) => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setEditingTitle('');
        setEditingContent('');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleSelectNote = (note: Note) => {
    // Save current note if there are unsaved changes
    if (hasUnsavedChanges) {
      saveNote();
    }
    
    setSelectedNote(note);
    setEditingTitle(note.title);
    setEditingContent(note.content);
    setHasUnsavedChanges(false);
  };

  const handleTitleChange = (value: string) => {
    setEditingTitle(value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (value: string) => {
    setEditingContent(value);
    setHasUnsavedChanges(true);
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter((note: Note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-2rem)]">
          {/* Sidebar - Notes List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">📝 Notes</h1>
              <Button 
                onClick={handleCreateNote}
                disabled={isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? '...' : '+ New'}
              </Button>
            </div>

            {/* Search and Sort */}
            <div className="space-y-2">
              <Input
                placeholder="🔍 Search notes..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setSearchQuery(e.target.value)
                }
                className="border-gray-300"
              />
              <Select value={sortBy} onValueChange={(value: SortOrder) => setSortBy(value)}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">Recently Updated</SelectItem>
                  <SelectItem value="updated_asc">Oldest Updated</SelectItem>
                  <SelectItem value="created_desc">Recently Created</SelectItem>
                  <SelectItem value="created_asc">Oldest Created</SelectItem>
                  <SelectItem value="title_asc">Title A-Z</SelectItem>
                  <SelectItem value="title_desc">Title Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes List */}
            <div className="space-y-2 overflow-auto max-h-[calc(100vh-200px)]">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No notes found' : 'No notes yet. Create your first note!'}
                </div>
              ) : (
                filteredNotes.map((note: Note) => (
                  <Card 
                    key={note.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedNote?.id === note.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectNote(note)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium text-gray-900 truncate pr-2">
                          {note.title}
                        </CardTitle>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              🗑️
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{note.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteNote(note.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {note.content || 'No content'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {note.updated_at.toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <Card className="h-full bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Input
                      value={editingTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleTitleChange(e.target.value)
                      }
                      className="text-xl font-bold border-none shadow-none p-0 focus-visible:ring-0"
                      placeholder="Note title..."
                    />
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {hasUnsavedChanges && (
                        <span className="text-yellow-600">● Unsaved</span>
                      )}
                      <span>Auto-save enabled</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Created: {selectedNote.created_at.toLocaleDateString()} • 
                    Updated: {selectedNote.updated_at.toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-140px)]">
                  <Textarea
                    value={editingContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      handleContentChange(e.target.value)
                    }
                    placeholder="Start writing your note..."
                    className="w-full h-full resize-none border-none shadow-none focus-visible:ring-0 text-gray-700"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full bg-white flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">📝</div>
                  <h2 className="text-xl font-medium mb-2">Select a note to start editing</h2>
                  <p className="text-gray-400">Choose a note from the sidebar or create a new one</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
