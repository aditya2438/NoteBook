import React, { useState } from 'react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  RotateCcw,
  Copy,
  FolderOpen,
  FileText,
  X,
  Archive,
} from 'lucide-react';
import { NoteItem } from '../../types';
import { fuzzySearchNotes } from '../../utils/canvasMath';
import { AnimatedLogo } from '../Header/AnimatedLogo';

interface NotesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDuplicateNote: (id: string) => void;
  onDeleteNote: (id: string, permanent?: boolean) => void;
  onRestoreNote: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  isOpen,
  onClose,
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDuplicateNote,
  onDeleteNote,
  onRestoreNote,
  onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showTrash, setShowTrash] = useState(false);

  if (!isOpen) return null;

  // Extract all unique tags
  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags || []))
  );

  const activeNotes = notes.filter((n) => (showTrash ? n.isTrash : !n.isTrash));
  const filteredByTag =
    selectedTag === 'all'
      ? activeNotes
      : activeNotes.filter((n) => n.tags?.includes(selectedTag));

  const searchedNotes = fuzzySearchNotes(filteredByTag, searchQuery);
  const pinnedNotes = searchedNotes.filter((n) => n.isPinned);
  const regularNotes = searchedNotes.filter((n) => !n.isPinned);

  return (
    <aside className="fixed inset-y-0 left-0 w-80 bg-zinc-950/95 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col shadow-2xl transition-all select-none">
      {/* Header with Moving Logo */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <AnimatedLogo size="sm" showTagline={false} />
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Strip: New Note & Trash switch */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <button
          onClick={onCreateNote}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Canvas Note</span>
        </button>

        <button
          onClick={() => setShowTrash(!showTrash)}
          title={showTrash ? 'View Active Notes' : 'View Trash Bin'}
          className={`p-2 rounded-lg border transition-colors ${
            showTrash
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'text-slate-400 hover:text-white border-white/10 hover:bg-white/5'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Instant Search Bar */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes, tags, math equations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tag Filters (Segmented tab style) */}
        {!showTrash && allTags.length > 0 && (
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                selectedTag === 'all'
                  ? 'bg-white text-black font-semibold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {showTrash && (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
            <span>Trash Bin ({activeNotes.length})</span>
            <span className="text-[10px] text-rose-400">Soft-deleted notes</span>
          </div>
        )}

        {/* Pinned Section */}
        {!showTrash && pinnedNotes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-1 mb-2 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              <Pin className="w-3 h-3" />
              <span>Pinned Notes</span>
            </div>
            <div className="space-y-1.5">
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isActive={note.id === activeNoteId}
                  isTrash={false}
                  onSelect={() => onSelectNote(note.id)}
                  onTogglePin={() => onTogglePin(note.id)}
                  onDuplicate={() => onDuplicateNote(note.id)}
                  onDelete={() => onDeleteNote(note.id, false)}
                  onRestore={() => onRestoreNote(note.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Notes Section */}
        <div>
          {!showTrash && pinnedNotes.length > 0 && regularNotes.length > 0 && (
            <div className="px-1 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              All Notes
            </div>
          )}

          <div className="space-y-1.5">
            {regularNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                isTrash={showTrash}
                onSelect={() => onSelectNote(note.id)}
                onTogglePin={() => onTogglePin(note.id)}
                onDuplicate={() => onDuplicateNote(note.id)}
                onDelete={() => onDeleteNote(note.id, showTrash)}
                onRestore={() => onRestoreNote(note.id)}
              />
            ))}
          </div>
        </div>

        {searchedNotes.length === 0 && (
          <div className="text-center py-12 px-4 text-slate-500 text-xs">
            <Archive className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No notes found matching your search</p>
          </div>
        )}
      </div>

      {/* Footer / Account overview */}
      <div className="p-3 border-t border-white/10 text-xs text-slate-500 flex items-center justify-between">
        <span className="font-mono text-[10px]">Nexora Notes v2.4</span>
        <span>AMOLED Canvas</span>
      </div>
    </aside>
  );
};

interface NoteCardProps {
  note: NoteItem;
  isActive: boolean;
  isTrash: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isActive,
  isTrash,
  onSelect,
  onTogglePin,
  onDuplicate,
  onDelete,
  onRestore,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
          <h3 className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
            {note.title}
          </h3>
        </div>

        {/* Hover Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
          {!isTrash ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                className={`p-1 rounded hover:bg-white/10 ${note.isPinned ? 'text-indigo-400' : 'text-slate-400'}`}
              >
                <Pin className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                title="Duplicate note"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Move to trash"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore();
                }}
                title="Restore note"
                className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete permanently"
                className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Clean Unboxed Metadata with · separator (Universal Frontend Design Constitution) */}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
        <span>{note.elements?.length || 0} objects</span>
        <span aria-hidden="true">·</span>
        <span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        {note.tags && note.tags.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 truncate max-w-[120px]">{note.tags.join(', ')}</span>
          </>
        )}
      </div>
    </div>
  );
};
