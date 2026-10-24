import React, { useState } from 'react';
import {
  CanvasElement,
  StrokeStyle,
  SupportedFontFamily,
} from '../../types';
import {
  Copy,
  Trash2,
  Sparkles,
  Bold,
  Italic,
  Layers,
  ChevronDown,
  Type,
  Maximize2,
  Palette,
  Minus,
  Spline,
  GitCommit,
  MoveRight,
  MoveHorizontal,
} from 'lucide-react';
import { playClickSound, playDeleteSound, playPlaceSound } from '../../utils/audioFeedback';

interface StylePickerProps {
  selectedElements: CanvasElement[];
  activeStrokeColor: string;
  onStrokeColorChange: (color: string) => void;
  activeFillColor: string;
  onFillColorChange: (color: string) => void;
  activeStrokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  activeStrokeStyle: StrokeStyle;
  onStrokeStyleChange: (style: StrokeStyle) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleGlow: () => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onChangeFontSize: (size: number) => void;
  onChangeFontFamily: (family: SupportedFontFamily) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  activeFontFamily?: SupportedFontFamily;
  activeFontSize?: number;
  onApplyCapitalization?: (mode: 'sentences' | 'title' | 'characters' | 'words') => void;
  onConvertInkToText?: () => void;
}

export const ALL_FONTS: {
  id: SupportedFontFamily;
  label: string;
  category: 'Sans' | 'Serif' | 'Mono' | 'Hand' | 'Display';
  preview: string;
}[] = [
  { id: 'Inter', label: 'Inter', category: 'Sans', preview: 'Clean modern UI' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta', category: 'Sans', preview: 'Geometric editorial' },
  { id: 'Space Grotesk', label: 'Space Grotesk', category: 'Sans', preview: 'Tech futuristic' },
  { id: 'Outfit', label: 'Outfit', category: 'Sans', preview: 'Warm geometric' },
  { id: 'Montserrat', label: 'Montserrat', category: 'Sans', preview: 'Urban architectural' },
  { id: 'JetBrains Mono', label: 'JetBrains Mono', category: 'Mono', preview: 'Developer monospace' },
  { id: 'Fira Code', label: 'Fira Code', category: 'Mono', preview: 'Ligature code' },
  { id: 'Caveat', label: 'Caveat', category: 'Hand', preview: 'Handwritten notes' },
  { id: 'Kalam', label: 'Kalam', category: 'Hand', preview: 'Chalk & ballpoint' },
  { id: 'Architects Daughter', label: 'Architects', category: 'Hand', preview: 'Blueprint drafts' },
  { id: 'Playfair Display', label: 'Playfair Display', category: 'Serif', preview: 'Luxury editorial' },
  { id: 'Cinzel', label: 'Cinzel', category: 'Serif', preview: 'Classical Roman' },
  { id: 'Merriweather', label: 'Merriweather', category: 'Serif', preview: 'Literary book' },
  { id: 'Roboto Slab', label: 'Roboto Slab', category: 'Serif', preview: 'Modern slab' },
  { id: 'Orbitron', label: 'Orbitron', category: 'Display', preview: 'Cyber sci-fi' },
  { id: 'Syne', label: 'Syne', category: 'Display', preview: 'Artistic avant-garde' },
  { id: 'Bebas Neue', label: 'Bebas Neue', category: 'Display', preview: 'CONDENSED POSTER' },
  { id: 'Oswald', label: 'Oswald', category: 'Display', preview: 'IMPACT HEADLINE' },
  { id: 'Comic Neue', label: 'Comic Neue', category: 'Display', preview: 'Playful cartoon' },
  { id: 'Lobster Two', label: 'Lobster Two', category: 'Display', preview: 'Vintage Script' },
  { id: 'Great Vibes', label: 'Great Vibes', category: 'Hand', preview: 'Calligraphy Cursive' },
  { id: 'Pacifico', label: 'Pacifico', category: 'Hand', preview: 'Retro Brush Hand' },
];

export const StylePicker: React.FC<StylePickerProps> = ({
  selectedElements,
  activeStrokeColor,
  onStrokeColorChange,
  activeFillColor,
  onFillColorChange,
  activeStrokeWidth,
  onStrokeWidthChange,
  activeStrokeStyle,
  onStrokeStyleChange,
  onDuplicate,
  onDelete,
  onToggleGlow,
  onToggleBold,
  onToggleItalic,
  onChangeFontSize,
  onChangeFontFamily,
  onBringForward,
  onSendBackward,
  activeFontFamily = 'Plus Jakarta Sans',
  activeFontSize = 18,
  onApplyCapitalization,
  onConvertInkToText,
}) => {
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [fontCategoryFilter, setFontCategoryFilter] = useState<'All' | 'Sans' | 'Serif' | 'Mono' | 'Hand' | 'Display'>('All');

  const colors = [
    { label: 'Cyan', hex: '#38bdf8' },
    { label: 'Violet', hex: '#a855f7' },
    { label: 'Emerald', hex: '#34d399' },
    { label: 'Amber', hex: '#fbbf24' },
    { label: 'Rose', hex: '#fb7185' },
    { label: 'White', hex: '#ffffff' },
    { label: 'Indigo', hex: '#818cf8' },
    { label: 'Slate', hex: '#64748b' },
  ];

  const fillColors = [
    { label: 'None', hex: 'transparent' },
    { label: 'Indigo', hex: 'rgba(99, 102, 241, 0.25)' },
    { label: 'Cyan', hex: 'rgba(56, 189, 248, 0.25)' },
    { label: 'Purple', hex: 'rgba(168, 85, 247, 0.25)' },
    { label: 'Emerald', hex: 'rgba(52, 211, 153, 0.25)' },
    { label: 'Rose', hex: 'rgba(251, 113, 133, 0.25)' },
    { label: 'Amber', hex: 'rgba(251, 191, 36, 0.25)' },
    { label: 'Dark', hex: '#18181b' },
  ];

  const strokeWidths = [1, 2, 4, 8];
  const strokeStyles: { id: StrokeStyle; label: string }[] = [
    { id: 'solid', label: 'Solid' },
    { id: 'dashed', label: 'Dashed' },
    { id: 'dotted', label: 'Dotted' },
  ];
  const fontSizes = [12, 16, 20, 28, 40, 64];

  const hasGlow = selectedElements.some((el) => el.glow);
  const hasTextElement = selectedElements.some((el) => el.type === 'text' || el.type === 'sticky');
  const hasInkElement = selectedElements.some((el) => el.type === 'pen' || el.type === 'ink');

  const filteredFonts = fontCategoryFilter === 'All'
    ? ALL_FONTS
    : ALL_FONTS.filter((f) => f.category === fontCategoryFilter);

  return (
    <div
      className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-30 flex flex-wrap max-w-[96vw] items-center gap-2 p-2 md:p-2.5 rounded-2xl md:rounded-[22px] bg-black/50 backdrop-blur-3xl border border-white/[0.18] shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] text-xs text-slate-200 transition-all"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Stroke Color Palette */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 shrink-0">
        <span className="text-[11px] text-slate-400 font-medium mr-0.5 hidden sm:inline">Stroke</span>
        {colors.map((c) => (
          <button
            key={c.hex}
            onClick={() => {
              playClickSound();
              onStrokeColorChange(c.hex);
            }}
            title={c.label}
            className={`w-5 h-5 rounded-full border transition-all ${
              activeStrokeColor.toLowerCase() === c.hex.toLowerCase()
                ? 'scale-125 border-white ring-2 ring-indigo-500/60 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                : 'border-white/20 hover:scale-110 opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      {/* Fill Color Palette */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 shrink-0">
        <span className="text-[11px] text-slate-400 font-medium mr-0.5 hidden sm:inline">Fill</span>
        {fillColors.map((c) => (
          <button
            key={c.hex}
            onClick={() => {
              playClickSound();
              onFillColorChange(c.hex);
            }}
            title={c.label}
            className={`w-5 h-5 rounded-full border transition-all relative ${
              activeFillColor === c.hex
                ? 'scale-125 border-white ring-2 ring-cyan-500/60 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                : 'border-white/20 hover:scale-110 opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: c.hex === 'transparent' ? '#0a0d16' : c.hex }}
          >
            {c.hex === 'transparent' && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-mono">/</span>
            )}
          </button>
        ))}
      </div>

      {/* Stroke Thickness */}
      <div className="flex items-center gap-1 pr-2 border-r border-white/10 shrink-0">
        {strokeWidths.map((w) => (
          <button
            key={w}
            onClick={() => {
              playClickSound();
              onStrokeWidthChange(w);
            }}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
              activeStrokeWidth === w
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-sm'
                : 'hover:bg-white/[0.1] text-slate-300'
            }`}
          >
            {w}px
          </button>
        ))}
      </div>

      {/* Line Pattern (Solid / Dashed / Dotted) */}
      <div className="flex items-center gap-1 pr-2 border-r border-white/10 shrink-0">
        {strokeStyles.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              playClickSound();
              onStrokeStyleChange(s.id);
            }}
            className={`px-2 py-0.5 rounded-lg text-[11px] transition-all ${
              activeStrokeStyle === s.id
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-semibold'
                : 'hover:bg-white/[0.1] text-slate-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 20+ Typography Selector */}
      <div className="relative shrink-0">
        <button
          onClick={() => {
            playClickSound();
            setIsFontDropdownOpen(!isFontDropdownOpen);
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 border border-white/15 text-xs transition-all shadow-sm"
          title="Choose from 22 Typography Styles"
        >
          <Type className="w-3.5 h-3.5 text-cyan-400" />
          <span className="max-w-[110px] truncate" style={{ fontFamily: activeFontFamily }}>
            {activeFontFamily}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isFontDropdownOpen && (
          <div className="absolute top-full left-0 mt-2.5 w-72 max-h-80 overflow-hidden flex flex-col rounded-2xl bg-[#090b14]/90 backdrop-blur-3xl border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.8)] z-50 text-slate-200">
            {/* Category Filter Tabs */}
            <div className="p-2 border-b border-white/10 flex items-center gap-1 bg-black/40 overflow-x-auto text-[10px]">
              {(['All', 'Sans', 'Serif', 'Mono', 'Hand', 'Display'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    playClickSound();
                    setFontCategoryFilter(cat);
                  }}
                  className={`px-2 py-0.5 rounded-lg transition-all shrink-0 ${
                    fontCategoryFilter === cat
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable Font List with Live Previews */}
            <div className="p-1.5 overflow-y-auto space-y-0.5 max-h-64">
              {filteredFonts.map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    playClickSound();
                    onChangeFontFamily(font.id);
                    setIsFontDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    activeFontFamily === font.id
                      ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-400/40'
                      : 'hover:bg-white/[0.08] text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold" style={{ fontFamily: font.id }}>
                      {font.label}
                    </span>
                    <span className="text-[10px] text-slate-400">{font.preview}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.08] text-slate-300 font-mono">
                    {font.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Font Size Presets */}
      <div className="flex items-center gap-1 pr-2 border-r border-white/10 shrink-0">
        {fontSizes.map((sz) => (
          <button
            key={sz}
            onClick={() => {
              playClickSound();
              onChangeFontSize(sz);
            }}
            className={`px-1.5 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
              activeFontSize === sz
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-sm'
                : 'hover:bg-white/[0.1] text-slate-300'
            }`}
          >
            {sz}
          </button>
        ))}
      </div>

      {/* Formatting & Glow Controls */}
      <div className="flex items-center gap-1 pr-2 border-r border-white/10 shrink-0">
        <button
          onClick={() => {
            playClickSound();
            onToggleBold();
          }}
          title="Toggle Bold"
          className="p-1.5 rounded-xl hover:bg-white/[0.1] text-slate-300 transition-colors"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            playClickSound();
            onToggleItalic();
          }}
          title="Toggle Italic"
          className="p-1.5 rounded-xl hover:bg-white/[0.1] text-slate-300 transition-colors"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            playClickSound();
            onToggleGlow();
          }}
          title={hasGlow ? 'Glow: Active' : 'Glow: Off'}
          className={`p-1.5 rounded-xl transition-all ${
            hasGlow ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'text-slate-400 hover:bg-white/[0.1]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Autocapitalize Controls (Sentence, Title, UPPERCASE) */}
      {hasTextElement && onApplyCapitalization && (
        <div className="flex items-center gap-1 pr-2 border-r border-white/10 shrink-0">
          <span className="text-[10px] text-slate-400 font-medium mr-0.5">Case</span>
          <button
            onClick={() => {
              playClickSound();
              onApplyCapitalization('sentences');
            }}
            title="Auto-Capitalize: Sentence case"
            className="px-1.5 py-0.5 rounded-lg text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 transition-all"
          >
            Aa
          </button>
          <button
            onClick={() => {
              playClickSound();
              onApplyCapitalization('title');
            }}
            title="Auto-Capitalize: Title Case"
            className="px-1.5 py-0.5 rounded-lg text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 transition-all"
          >
            aA
          </button>
          <button
            onClick={() => {
              playClickSound();
              onApplyCapitalization('characters');
            }}
            title="Auto-Capitalize: UPPERCASE"
            className="px-1.5 py-0.5 rounded-lg text-[11px] font-semibold bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 transition-all"
          >
            AA
          </button>
        </div>
      )}

      {/* Convert Ink / Handwriting to Typed Text Note */}
      {hasInkElement && onConvertInkToText && (
        <div className="flex items-center gap-1 pr-2 border-r border-white/10 shrink-0">
          <button
            onClick={() => {
              playPlaceSound();
              onConvertInkToText();
            }}
            title="Convert Ink / Freehand Drawing into Typed Clean Note"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-500/80 to-cyan-500/80 hover:from-indigo-400 hover:to-cyan-400 text-white font-medium text-[11px] shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Ink to Text</span>
          </button>
        </div>
      )}

      {/* Layer Z-Index & Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => {
            playClickSound();
            onBringForward();
          }}
          title="Bring Forward"
          className="px-2 py-1 rounded-xl text-[11px] hover:bg-white/[0.1] text-slate-300 transition-colors"
        >
          Bring Up
        </button>
        <button
          onClick={() => {
            playClickSound();
            onSendBackward();
          }}
          title="Send Backward"
          className="px-2 py-1 rounded-xl text-[11px] hover:bg-white/[0.1] text-slate-300 transition-colors"
        >
          Send Down
        </button>
        <button
          onClick={() => {
            playPlaceSound();
            onDuplicate();
          }}
          title="Duplicate Element (Ctrl+D)"
          className="p-1.5 rounded-xl hover:bg-indigo-500/20 text-indigo-300 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            playDeleteSound();
            onDelete();
          }}
          title="Delete Selected (Backspace)"
          className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
