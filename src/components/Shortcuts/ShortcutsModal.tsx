import React, { useState } from 'react';
import { X, Keyboard, Search } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Canvas Navigation & Viewport',
      shortcuts: [
        { keys: ['Space', '+', 'Drag'], desc: 'Pan canvas smoothly in any direction' },
        { keys: ['Middle Click', '+', 'Drag'], desc: 'Pan canvas freely' },
        { keys: ['Wheel / Pinch'], desc: 'Smooth zoom in / zoom out (10% to 500%)' },
        { keys: ['+'], desc: 'Zoom in viewport' },
        { keys: ['-'], desc: 'Zoom out viewport' },
        { keys: ['0'], desc: 'Reset zoom to 100% and center' },
      ],
    },
    {
      category: 'Creation & Drawing Tools',
      shortcuts: [
        { keys: ['V'], desc: 'Select & Transform tool' },
        { keys: ['H'], desc: 'Hand / Pan tool' },
        { keys: ['P'], desc: 'Pencil / Freehand stroke' },
        { keys: ['E'], desc: 'Eraser tool' },
        { keys: ['T'], desc: 'Rich Text block' },
        { keys: ['S'], desc: 'Sticky note card' },
        { keys: ['R'], desc: 'Rectangle shape' },
        { keys: ['C'], desc: 'Circle / Oval shape' },
        { keys: ['A'], desc: 'Directional Arrow' },
        { keys: ['L'], desc: 'Straight Line' },
        { keys: ['X'], desc: 'Code Snippet block' },
        { keys: ['Z'], desc: 'Laser presentation pointer' },
      ],
    },
    {
      category: 'Selection & History Safety',
      shortcuts: [
        { keys: ['Ctrl / Cmd', '+', 'Z'], desc: 'Undo last mutation' },
        { keys: ['Ctrl / Cmd', '+', 'Y'], desc: 'Redo previously undone action' },
        { keys: ['Ctrl / Cmd', '+', 'S'], desc: 'Save changes (intercepts page save)' },
        { keys: ['Ctrl / Cmd', '+', 'D'], desc: 'Duplicate selected elements' },
        { keys: ['Ctrl / Cmd', '+', 'A'], desc: 'Select all elements on canvas' },
        { keys: ['Delete / Backspace'], desc: 'Delete selected element(s)' },
        { keys: ['Escape'], desc: 'Deselect all or return to Select tool' },
        { keys: ['Ctrl / Cmd', '+', 'B'], desc: 'Toggle notes sidebar drawer' },
      ],
    },
  ];

  const filtered = shortcutGroups
    .map((g) => ({
      ...g,
      shortcuts: g.shortcuts.filter(
        (s) =>
          s.desc.toLowerCase().includes(search.toLowerCase()) ||
          s.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((g) => g.shortcuts.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Keyboard Shortcuts & Hotkeys</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10 bg-white/[0.01]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {filtered.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs"
                  >
                    <span className="text-slate-300">{s.desc}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[11px] text-white shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
