import React, { useState, useEffect, useRef } from 'react';
import {
  MousePointer2,
  Hand,
  Pen,
  Highlighter,
  Eraser,
  Type,
  StickyNote,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  Code,
  Sparkles,
  Undo2,
  Redo2,
  Magnet,
  Grid,
  Zap,
  Shapes,
  Diamond,
  Star,
  Hexagon,
  MessageSquare,
  Database,
  Cloud,
  Heart,
  Spline,
  GitCommit,
  MoveHorizontal,
  ChevronDown,
  Pentagon as PentagonIcon,
  Feather,
} from 'lucide-react';
import { ToolType, GridType } from '../../types';
import { playClickSound, playSnapSound } from '../../utils/audioFeedback';

interface FloatingToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  gridType: GridType;
  onSelectGridType?: (type: GridType) => void;
  onToggleGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenAI: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  activeTool,
  onToolChange,
  snapEnabled,
  onToggleSnap,
  gridType,
  onSelectGridType,
  onToggleGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenAI,
}) => {
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const [isLineMenuOpen, setIsLineMenuOpen] = useState(false);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const lineMenuRef = useRef<HTMLDivElement>(null);
  const gridMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setIsShapeMenuOpen(false);
        setIsLineMenuOpen(false);
        setIsGridMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  // Primary Drawing & Creation Tools
  const primaryTools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select (V)', icon: <MousePointer2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'V' },
    { id: 'hand', label: 'Pan Canvas (H / Space)', icon: <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'H' },
    { id: 'pen', label: 'Pen / Stylus (P)', icon: <Pen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'P' },
    { id: 'ink', label: 'Calligraphy Ink (I)', icon: <Feather className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'I' },
    { id: 'highlighter', label: 'Highlighter (Shift+P)', icon: <Highlighter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'Shift+P' },
    { id: 'eraser', label: 'Eraser (E)', icon: <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'E' },
    { id: 'text', label: 'Rich Typography (T)', icon: <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'T' },
    { id: 'sticky', label: 'Sticky Memo (S)', icon: <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'S' },
    { id: 'code', label: 'Code Snippet (X)', icon: <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'X' },
    { id: 'laser', label: 'Laser Pointer (Z)', icon: <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, shortcut: 'Z' },
  ];

  // Geometric Shapes
  const shapeOptions: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'rect', label: 'Rectangle', icon: <Square className="w-4 h-4" /> },
    { id: 'circle', label: 'Circle / Oval', icon: <Circle className="w-4 h-4" /> },
    { id: 'diamond', label: 'Rhombus Decision', icon: <Diamond className="w-4 h-4" /> },
    { id: 'star', label: '5-Point Star', icon: <Star className="w-4 h-4" /> },
    { id: 'hexagon', label: 'Hexagon', icon: <Hexagon className="w-4 h-4" /> },
    { id: 'pentagon', label: 'Pentagon', icon: <PentagonIcon className="w-4 h-4" /> },
    { id: 'speechBubble', label: 'Speech Callout', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'cylinder', label: 'Database Cylinder', icon: <Database className="w-4 h-4" /> },
    { id: 'cloud', label: 'Brainstorm Cloud', icon: <Cloud className="w-4 h-4" /> },
    { id: 'heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
  ];

  // Connectors & Directional Arrows
  const lineOptions: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'line', label: 'Straight Line', icon: <Minus className="w-4 h-4" /> },
    { id: 'arrow', label: 'Directional Arrow', icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'curved', label: 'Curved Arc', icon: <Spline className="w-4 h-4" /> },
    { id: 'stepped', label: 'Orthogonal Elbow', icon: <GitCommit className="w-4 h-4" /> },
    { id: 'doubleArrow', label: 'Bidirectional Arrow', icon: <MoveHorizontal className="w-4 h-4" /> },
  ];

  // Grid Presets
  const gridOptions: { id: GridType; label: string; desc: string }[] = [
    { id: 'math', label: 'Math Paper Grid', desc: '5mm sub-grid with 25mm major squares' },
    { id: 'dots', label: 'Dot Matrix Grid', desc: 'Minimal bullet dots' },
    { id: 'cross', label: 'Blueprint Cross', desc: 'Coordinate tick marks' },
    { id: 'isometric', label: 'Isometric 3D', desc: '30° isometric triangular grid' },
    { id: 'hex', label: 'Hex Honeycomb', desc: 'Hexagonal lattice' },
    { id: 'engineering', label: 'Millimetric Graph', desc: 'Engineering precision graph' },
    { id: 'polar', label: 'Polar Radar', desc: 'Concentric circles & rays' },
    { id: 'cornell', label: 'Cornell Notes', desc: 'Cue column & summary area' },
    { id: 'ruled', label: 'Ruled Notebook', desc: 'Standard notebook horizontal lines' },
    { id: 'music', label: 'Music Staves', desc: '5-line musical staff sheet' },
    { id: 'none', label: 'Pure Dark Blank', desc: 'Clean background without lines' },
  ];

  const isShapeActive = shapeOptions.some((s) => s.id === activeTool);
  const isLineActive = lineOptions.some((l) => l.id === activeTool);

  const activeShapeIcon = shapeOptions.find((s) => s.id === activeTool)?.icon || <Shapes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
  const activeLineIcon = lineOptions.find((l) => l.id === activeTool)?.icon || <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;

  const selectTool = (t: ToolType) => {
    playClickSound();
    onToolChange(t);
    setIsShapeMenuOpen(false);
    setIsLineMenuOpen(false);
    setIsGridMenuOpen(false);
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 sm:gap-1 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-[#090b14]/90 backdrop-blur-3xl border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.2)] select-none max-w-[96vw]"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Primary Tools */}
      <div className="flex items-center gap-0.5">
        {primaryTools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => selectTool(t.id)}
              title={`${t.label} [${t.shortcut}]`}
              className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(56,189,248,0.4)] scale-105 border border-white/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.1]'
              }`}
            >
              {t.icon}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 bg-white rounded-full shadow-[0_0_4px_#ffffff]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="w-[1px] h-5 bg-white/15 mx-0.5 shrink-0" />

      {/* Shapes Dropdown Menu */}
      <div className="relative shrink-0" ref={shapeMenuRef}>
        <button
          onClick={() => {
            playClickSound();
            setIsShapeMenuOpen(!isShapeMenuOpen);
            setIsLineMenuOpen(false);
            setIsGridMenuOpen(false);
          }}
          title="Geometric Shapes (Box, Circle, Star, Diamond, etc.)"
          className={`flex items-center gap-0.5 px-1.5 sm:px-2 h-7 sm:h-8 rounded-xl transition-all ${
            isShapeActive
              ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(56,189,248,0.4)] border border-white/30'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.1]'
          }`}
        >
          {activeShapeIcon}
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isShapeMenuOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-2 rounded-2xl bg-[#090b14]/95 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 grid grid-cols-2 gap-1.5">
            <div className="col-span-2 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
              Shapes Library
            </div>
            {shapeOptions.map((shp) => (
              <button
                key={shp.id}
                onClick={() => selectTool(shp.id)}
                className={`flex items-center gap-2 p-1.5 rounded-xl text-left text-xs transition-all ${
                  activeTool === shp.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.1]'
                }`}
              >
                {shp.icon}
                <span className="truncate">{shp.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Connectors & Lines Dropdown Menu */}
      <div className="relative shrink-0" ref={lineMenuRef}>
        <button
          onClick={() => {
            playClickSound();
            setIsLineMenuOpen(!isLineMenuOpen);
            setIsShapeMenuOpen(false);
            setIsGridMenuOpen(false);
          }}
          title="Connectors & Directional Arrows"
          className={`flex items-center gap-0.5 px-1.5 sm:px-2 h-7 sm:h-8 rounded-xl transition-all ${
            isLineActive
              ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(56,189,248,0.4)] border border-white/30'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.1]'
          }`}
        >
          {activeLineIcon}
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isLineMenuOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 p-2 rounded-2xl bg-[#090b14]/95 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 space-y-1">
            <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
              Connectors & Lines
            </div>
            {lineOptions.map((line) => (
              <button
                key={line.id}
                onClick={() => selectTool(line.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs transition-all ${
                  activeTool === line.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.1]'
                }`}
              >
                {line.icon}
                <span>{line.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-white/15 mx-0.5 shrink-0" />

      {/* Grid Style Selector */}
      <div className="relative shrink-0" ref={gridMenuRef}>
        <button
          onClick={() => {
            playClickSound();
            setIsGridMenuOpen(!isGridMenuOpen);
            setIsShapeMenuOpen(false);
            setIsLineMenuOpen(false);
          }}
          title={`Canvas Grid: ${gridType}`}
          className="flex items-center gap-1 px-1.5 sm:px-2 h-7 sm:h-8 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.1] transition-all"
        >
          <Grid className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-mono capitalize hidden md:inline">{gridType}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isGridMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 p-2 rounded-2xl bg-[#090b14]/95 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 max-h-80 overflow-y-auto space-y-1">
            <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 border-b border-white/10 uppercase tracking-wider">
              Canvas Grid Style
            </div>
            {gridOptions.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  playClickSound();
                  if (onSelectGridType) onSelectGridType(g.id);
                  else onToggleGrid();
                  setIsGridMenuOpen(false);
                }}
                className={`w-full flex flex-col items-start px-2.5 py-1.5 rounded-xl text-left transition-all ${
                  gridType === g.id
                    ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <span className="text-xs font-semibold">{g.label}</span>
                <span className="text-[10px] text-slate-400">{g.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Magnet Snapping Toggle */}
      <button
        onClick={() => {
          playSnapSound();
          onToggleSnap();
        }}
        title={snapEnabled ? 'Magnet Snapping: ON' : 'Magnet Snapping: OFF'}
        className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all shrink-0 ${
          snapEnabled
            ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.1]'
        }`}
      >
        <Magnet className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-5 bg-white/15 mx-0.5 shrink-0" />

      {/* History (Undo / Redo) */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => {
            playClickSound();
            onUndo();
          }}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${
            canUndo
              ? 'text-slate-300 hover:text-white hover:bg-white/[0.1]'
              : 'text-slate-600 cursor-not-allowed opacity-30'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            playClickSound();
            onRedo();
          }}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all ${
            canRedo
              ? 'text-slate-300 hover:text-white hover:bg-white/[0.1]'
              : 'text-slate-600 cursor-not-allowed opacity-30'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-[1px] h-5 bg-white/15 mx-0.5 shrink-0" />

      {/* AI Assistant Button (Guaranteed Never to Clip) */}
      <button
        onClick={() => {
          playClickSound();
          onOpenAI();
        }}
        title="Nexora AI Assistant (Calculus solver, Mind maps & Brainstorming)"
        className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl bg-gradient-to-r from-purple-500/90 via-indigo-600/90 to-cyan-500/90 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-semibold backdrop-blur-xl border border-white/25 shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all shrink-0 cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
        <span className="font-mono text-xs whitespace-nowrap">AI Assist</span>
      </button>
    </div>
  );
};
