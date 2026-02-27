'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  GripVertical,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, searchNotes } from '@/lib/db';
import { Button, Input, Card, useToast, Dialog } from '@/components/shared';
import { useUser } from '@/lib/context';
import { cn, debounce, formatDate } from '@/lib/utils';
import type { NoteDocument, NoteFolder } from '@/types';

export function NotesTab() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [selectedNote, setSelectedNote] = useState<NoteDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NoteDocument[]>([]);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const notes = useLiveQuery(
    () => user ? db.notes.where('userId').equals(user.id).toArray() : [],
    [user]
  );

  const folders = useLiveQuery(
    () => user ? db.folders.where('userId').equals(user.id).toArray() : [],
    [user]
  );

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (!user || !query) {
        setSearchResults([]);
        return;
      }
      const results = await searchNotes(user.id, query);
      setSearchResults(results);
    }, 300),
    [user]
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  const createNote = async () => {
    if (!user) return;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const note: NoteDocument = {
      id,
      userId: user.id,
      title: 'Untitled Note',
      content: '',
      createdAt: now,
      updatedAt: now,
      folderId: null,
      order: notes?.length || 0,
    };
    await db.notes.put(note);
    setSelectedNote(note);
    showToast('Note created', 'success');
  };

  const createFolder = async () => {
    if (!user || !newFolderName) return;
    const folder: NoteFolder = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: newFolderName,
      parentId: null,
      order: folders?.length || 0,
      createdAt: new Date().toISOString(),
    };
    await db.folders.put(folder);
    setNewFolderName('');
    setShowNewFolderDialog(false);
    showToast('Folder created', 'success');
  };

  const updateNote = async (note: NoteDocument) => {
    await db.notes.put({ ...note, updatedAt: new Date().toISOString() });
  };

  const deleteNote = async (id: string) => {
    await db.notes.delete(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
    showToast('Note deleted', 'success');
  };

  const displayNotes = searchQuery ? searchResults : notes || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-1 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button size="sm" onClick={createNote}>
            <Plus className="w-4 h-4 mr-1" />
            Note
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowNewFolderDialog(true)}>
            <Folder className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto space-y-1">
          {folders?.map(folder => (
            <FolderItem key={folder.id} folder={folder} notes={notes || []} onSelect={setSelectedNote} selectedId={selectedNote?.id} onDelete={deleteNote} />
          ))}
          {displayNotes.filter(n => !n.folderId).map(note => (
            <NoteItem key={note.id} note={note} onSelect={() => setSelectedNote(note)} isSelected={selectedNote?.id === note.id} onDelete={deleteNote} />
          ))}
          {displayNotes.length === 0 && (
            <p className="text-center text-foreground-muted py-8">
              {searchQuery ? 'No notes found' : 'No notes yet. Create one!'}
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedNote ? (
          <NoteEditor note={selectedNote} onUpdate={updateNote} />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <p className="text-foreground-muted">Select a note to edit</p>
          </Card>
        )}
      </div>

      <Dialog open={showNewFolderDialog} onClose={() => setShowNewFolderDialog(false)} title="New Folder">
        <div className="space-y-4">
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createFolder()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNewFolderDialog(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function FolderItem({ folder, notes, onSelect, selectedId, onDelete }: { folder: NoteFolder; notes: NoteDocument[]; onSelect: (note: NoteDocument) => void; selectedId?: string; onDelete: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const folderNotes = notes.filter(n => n.folderId === folder.id);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-glass-highlight transition-colors text-left"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Folder className="w-4 h-4 text-warning" />
        <span className="flex-1 text-sm font-medium">{folder.name}</span>
        <span className="text-xs text-foreground-muted">{folderNotes.length}</span>
      </button>
      {isOpen && (
        <div className="ml-6 space-y-1">
          {folderNotes.map(note => (
            <NoteItem key={note.id} note={note} onSelect={() => onSelect(note)} isSelected={selectedId === note.id} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteItem({ note, onSelect, isSelected, onDelete }: { note: NoteDocument; onSelect: () => void; isSelected: boolean; onDelete: (id: string) => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left',
          isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-glass-highlight'
        )}
      >
        <FileText className="w-4 h-4" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{note.title}</p>
          <p className="text-xs text-foreground-muted truncate">{formatDate(note.updatedAt)}</p>
        </div>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onDelete(note.id); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>
    </div>
  );
}

function NoteEditor({ note, onUpdate }: { note: NoteDocument; onUpdate: (note: NoteDocument) => void }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showPreview, setShowPreview] = useState(true);

  const debouncedUpdate = useCallback(
    debounce((updated: NoteDocument) => onUpdate(updated), 500),
    [onUpdate]
  );

  useEffect(() => {
    if (title !== note.title || content !== note.content) {
      debouncedUpdate({ ...note, title, content });
    }
  }, [title, content, note, debouncedUpdate]);

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 text-xl font-semibold bg-transparent border-none outline-none"
          placeholder="Note title..."
        />
        <Button
          variant={showPreview ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </Button>
      </div>
      <div className={cn('flex-1 min-h-0', showPreview ? 'grid grid-cols-2 gap-4' : '')}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className={cn(
            'w-full h-full resize-none bg-transparent border-none outline-none font-mono text-sm',
            showPreview && 'border-r border-glass-border pr-4'
          )}
          placeholder="Write your note in Markdown..."
        />
        {showPreview && (
          <div className="overflow-auto prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*No content*'}</ReactMarkdown>
          </div>
        )}
      </div>
    </Card>
  );
}
