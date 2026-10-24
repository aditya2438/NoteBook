import React, { useState, useEffect, useRef } from 'react';
import {
  Sidebar,
  CheckCircle2,
  RefreshCw,
  Download,
  HelpCircle,
  LayoutTemplate,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Presentation,
  ChevronDown,
  Menu,
  X,
  FileArchive,
  Volume2,
  VolumeX,
  Sparkles,
  Languages,
  MoreHorizontal,
  Keyboard,
} from 'lucide-react';
import { BackgroundTheme } from '../../types';
import { AnimatedLogo } from './AnimatedLogo';
import { isSoundFeedbackEnabled, setSoundFeedbackEnabled, playClickSound } from '../../utils/audioFeedback';

interface TopNavBarProps {
  noteTitle: string;
  onTitleChange: (newTitle: string) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  backgroundTheme: BackgroundTheme;
  onThemeChange: (theme: BackgroundTheme) => void;
  onToggleSidebar: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  onOpenAccount: () => void;
  onOpenLanguage?: () => void;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
}

export const THEME_LIST: { id: BackgroundTheme; label: string; desc: string; preview: string }[] = [
  { id: 'portfolio-cosmos', label: 'Aditya Portfolio Cosmos', desc: 'Obsidian #07070a with lavender & cyan glowing 3D starfield & ambient light', preview: '#07070a' },
  { id: 'space', label: 'Infinite Space (Moving Stars)', desc: 'Deep cosmos with gentle glowing moving stars', preview: '#030712' },
  { id: 'paper', label: 'Real Paper Math Grid', desc: 'Ivory paper, French blue grid, red margin line', preview: '#fbf9f4' },
  { id: 'amoled', label: 'AMOLED Pure Dark', desc: 'Pure #000000 true black for OLED displays', preview: '#000000' },
  { id: 'nebula', label: 'Deep Cosmic Nebula', desc: 'Violet starlight with cosmic energy glow', preview: '#0c0721' },
  { id: 'obsidian', label: 'Obsidian Studio', desc: 'Deep zinc graphite #09090b', preview: '#09090b' },
  { id: 'slate', label: 'Modern Slate', desc: 'Cool dark slate #0f172a', preview: '#0f172a' },
  { id: 'blueprint', label: 'Architect Blueprint', desc: 'Cyan lines on architectural blue #0b2545', preview: '#0b2545' },
  { id: 'chalkboard', label: 'Classroom Chalkboard', desc: 'Classic matte blackboard dark green', preview: '#14281d' },
  { id: 'parchment', label: 'Antique Parchment', desc: 'Warm manuscript cream sepia', preview: '#f4ecd8' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'Electric violet neon night', preview: '#0a0518' },
];

export const TopNavBar: React.FC<TopNavBarProps> = ({
  noteTitle,
  onTitleChange,
  saveStatus,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  backgroundTheme,
  onThemeChange,
  onToggleSidebar,
  onOpenTemplates,
  onOpenExport,
  onOpenShortcuts,
  onOpenAccount,
  onOpenLanguage,
  isPresentationMode = false,
  onTogglePresentationMode,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(noteTitle);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundActive, setSoundActive] = useState(isSoundFeedbackEnabled());

  const themeRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleFinishTitle = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(noteTitle);
    }
  };

  const handleDownloadZip = () => {
    playClickSound();
    const link = document.createElement('a');
    link.href = '/api/download/project-zip';
    link.download = 'notebook-source.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentThemeObj = THEME_LIST.find((t) => t.id === backgroundTheme) || THEME_LIST[0];

  return (
    <header className="h-14 w-full bg-[#05060d]/85 backdrop-blur-3xl border-b border-white/[0.12] px-2.5 sm:px-4 md:px-5 flex items-center justify-between gap-2 z-40 select-none shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Zone 1: Brand & Document Title */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <button
          onClick={() => {
            playClickSound();
            onToggleSidebar();
          }}
          title="Toggle Notes Sidebar (Ctrl+B)"
          className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-xl transition-all shadow-sm shrink-0"
        >
          <Sidebar className="w-4 h-4" />
        </button>

        {/* Master Logo */}
        <div className="pr-1 sm:pr-2 border-r border-white/10 shrink-0">
          <AnimatedLogo size="sm" showTagline={false} />
        </div>

        {/* Document Title Pill */}
        {isEditingTitle ? (
          <input
            autoFocus
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleFinishTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishTitle();
              if (e.key === 'Escape') {
                setIsEditingTitle(false);
                setTempTitle(noteTitle);
              }
            }}
            className="px-2.5 py-1 text-xs font-semibold bg-white/[0.15] backdrop-blur-xl text-white rounded-xl border border-cyan-400 focus:outline-none max-w-[120px] sm:max-w-[180px] shadow-inner"
          />
        ) : (
          <button
            onClick={() => {
              playClickSound();
              setTempTitle(noteTitle);
              setIsEditingTitle(true);
            }}
            title="Click to rename document"
            className="text-xs font-semibold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-xl transition-all truncate max-w-[100px] sm:max-w-[150px] md:max-w-[180px]"
          >
            {noteTitle}
          </button>
        )}

        {/* Sync Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-mono text-slate-300 shrink-0">
          {saveStatus === 'saving' ? (
            <>
              <RefreshCw className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
              <span className="text-cyan-300 hidden md:inline">Syncing</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="text-emerald-400 hidden md:inline">Saved</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-400 hidden md:inline">Unsaved</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Desktop Action Bar (Guaranteed Never to Clip) */}
      <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
        {/* Background Theme Switcher */}
        <div className="relative shrink-0" ref={themeRef}>
          <button
            onClick={() => {
              playClickSound();
              setIsThemeMenuOpen(!isThemeMenuOpen);
              setIsMoreMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs text-slate-200 transition-all shadow-sm"
            title="Switch Background Theme"
          >
            <div
              className="w-3 h-3 rounded-full border border-white/40 shadow-sm shrink-0"
              style={{ backgroundColor: currentThemeObj.preview }}
            />
            <span className="truncate max-w-[90px] xl:max-w-[120px] font-medium text-[11px] xl:text-xs">
              {currentThemeObj.label}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-[#090b14]/95 backdrop-blur-3xl border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.8)] z-50 space-y-1 max-h-80 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Background Theme
              </div>
              {THEME_LIST.map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    playClickSound();
                    onThemeChange(th.id);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                    backgroundTheme === th.id
                      ? 'bg-gradient-to-r from-indigo-600/40 to-cyan-600/40 text-cyan-200 border border-cyan-400/50 shadow-sm'
                      : 'text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0 shadow-sm"
                    style={{ backgroundColor: th.preview }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs">{th.label}</span>
                    <span className="text-[10px] text-slate-400 truncate">{th.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compact Zoom Controls */}
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-xl bg-white/[0.06] border border-white/15 backdrop-blur-2xl shadow-sm shrink-0">
          <button
            onClick={() => {
              playClickSound();
              onZoomOut();
            }}
            title="Zoom Out (-)"
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              playClickSound();
              onZoomReset();
            }}
            title="Reset Zoom to 100%"
            className="px-1 text-[11px] font-mono font-bold text-cyan-300 hover:underline"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => {
              playClickSound();
              onZoomIn();
            }}
            title="Zoom In (+)"
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Tactile Audio Switch */}
        <button
          onClick={() => {
            const next = !soundActive;
            setSoundActive(next);
            setSoundFeedbackEnabled(next);
            if (next) playClickSound();
          }}
          title={soundActive ? 'Tactile Audio: ON' : 'Tactile Audio: MUTED'}
          className={`p-1.5 rounded-xl border transition-all shrink-0 ${
            soundActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-white/[0.05] text-slate-400 border-white/15 hover:text-white'
          }`}
        >
          {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Secondary Pro Tools: Expanded on 2XL, Collapsed on standard screens */}
        <div className="hidden 2xl:flex items-center gap-1.5">
          {onTogglePresentationMode && (
            <button
              onClick={() => {
                playClickSound();
                onTogglePresentationMode();
              }}
              title="Zen Stage (Distraction-Free Canvas)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition-all ${
                isPresentationMode
                  ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border-white/15'
              }`}
            >
              <Presentation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zen Stage</span>
            </button>
          )}

          {onOpenLanguage && (
            <button
              onClick={() => {
                playClickSound();
                onOpenLanguage();
              }}
              title="Trilingual Translator & Spell Check"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition-all"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span>Translate</span>
            </button>
          )}

          <button
            onClick={() => {
              playClickSound();
              onOpenTemplates();
            }}
            title="Starter Templates Gallery"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/15 text-xs transition-all"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
            <span>Templates</span>
          </button>
        </div>

        {/* More Options Dropdown (...) for Screen Adaptability */}
        <div className="relative shrink-0" ref={moreRef}>
          <button
            onClick={() => {
              playClickSound();
              setIsMoreMenuOpen(!isMoreMenuOpen);
              setIsThemeMenuOpen(false);
            }}
            title="More Canvas Tools & Options"
            className={`p-1.5 rounded-xl border transition-all ${
              isMoreMenuOpen
                ? 'bg-white/20 text-white border-white/40'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border-white/15'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMoreMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 p-2 rounded-2xl bg-[#090b14]/95 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                Workspace Tools
              </div>

              {onOpenLanguage && (
                <button
                  onClick={() => {
                    playClickSound();
                    setIsMoreMenuOpen(false);
                    onOpenLanguage();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Languages className="w-4 h-4 text-indigo-400" />
                  <span>Translate & Spell Check</span>
                </button>
              )}

              <button
                onClick={() => {
                  playClickSound();
                  setIsMoreMenuOpen(false);
                  onOpenTemplates();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-all"
              >
                <LayoutTemplate className="w-4 h-4 text-purple-400" />
                <span>Starter Templates</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setIsMoreMenuOpen(false);
                  onOpenShortcuts();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-all"
              >
                <Keyboard className="w-4 h-4 text-amber-400" />
                <span>Keyboard Shortcuts</span>
              </button>

              {onTogglePresentationMode && (
                <button
                  onClick={() => {
                    playClickSound();
                    setIsMoreMenuOpen(false);
                    onTogglePresentationMode();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Presentation className="w-4 h-4 text-cyan-400" />
                  <span>{isPresentationMode ? 'Exit Zen Stage' : 'Enter Zen Stage (Focus)'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  toggleFullscreen();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-all"
              >
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Window'}</span>
              </button>
            </div>
          )}
        </div>

        {/* PRIMARY ACTION 1: Cloud Account & OTP (Always Visible) */}
        <button
          onClick={() => {
            playClickSound();
            onOpenAccount();
          }}
          title="Account, OTP & Cloud Database"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 hover:text-white border border-cyan-500/30 text-xs font-medium transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline text-xs">Account</span>
        </button>

        {/* PRIMARY ACTION 2: High-Res Export (Always Visible) */}
        <button
          onClick={() => {
            playClickSound();
            onOpenExport();
          }}
          title="Export Canvas to PNG, SVG, PDF or JSON"
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {/* PRIMARY ACTION 3: Download Complete Source Code ZIP (Always Visible) */}
        <button
          onClick={handleDownloadZip}
          title="Download Complete Clean Project ZIP archive"
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all shrink-0 cursor-pointer"
        >
          <FileArchive className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>

      {/* Zone 3: Mobile & Tablet Hamburger Toggle */}
      <div className="flex lg:hidden items-center gap-1.5">
        <button
          onClick={() => {
            playClickSound();
            onOpenExport();
          }}
          title="Export Canvas"
          className="p-1.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold shadow-md"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDownloadZip}
          title="Download Project ZIP"
          className="p-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md"
        >
          <FileArchive className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            playClickSound();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
          className="p-1.5 rounded-xl bg-white/[0.08] text-white border border-white/15"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Glassmorphic Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#070913]/95 backdrop-blur-3xl border-b border-white/15 p-4 z-50 flex flex-col gap-3 shadow-2xl lg:hidden max-h-[85vh] overflow-y-auto">
          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                playClickSound();
                setIsMobileMenuOpen(false);
                onOpenExport();
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-xs font-semibold shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Export Canvas</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleDownloadZip();
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-md"
            >
              <FileArchive className="w-4 h-4" />
              <span>Download ZIP</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                playClickSound();
                setIsMobileMenuOpen(false);
                onOpenAccount();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-200 text-xs font-medium"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Account & OTP</span>
            </button>

            {onOpenLanguage && (
              <button
                onClick={() => {
                  playClickSound();
                  setIsMobileMenuOpen(false);
                  onOpenLanguage();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-200 text-xs font-medium"
              >
                <Languages className="w-4 h-4 text-indigo-400" />
                <span>Translate & Spell</span>
              </button>
            )}

            <button
              onClick={() => {
                playClickSound();
                setIsMobileMenuOpen(false);
                onOpenTemplates();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-200 text-xs font-medium"
            >
              <LayoutTemplate className="w-4 h-4 text-purple-400" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setIsMobileMenuOpen(false);
                onOpenShortcuts();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-200 text-xs font-medium"
            >
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>Shortcuts</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Background Themes
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_LIST.slice(0, 6).map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    playClickSound();
                    onThemeChange(th.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left ${
                    backgroundTheme === th.id
                      ? 'border-cyan-400 bg-cyan-600/30 text-white'
                      : 'border-white/10 bg-white/[0.04] text-slate-300'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                    style={{ backgroundColor: th.preview }}
                  />
                  <span className="truncate">{th.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
