import React, { useState, useEffect } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundActive, setSoundActive] = useState(isSoundFeedbackEnabled());

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
    link.download = 'auranotes-pro.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentThemeObj = THEME_LIST.find((t) => t.id === backgroundTheme) || THEME_LIST[0];

  return (
    <header className="h-14 w-full bg-black/40 backdrop-blur-3xl border-b border-white/[0.12] px-3 md:px-5 flex items-center justify-between gap-3 md:gap-6 z-40 select-none shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Zone 1: Brand & Document Navigation */}
      <div className="flex items-center gap-2 md:gap-3.5 shrink-0">
        <button
          onClick={() => {
            playClickSound();
            onToggleSidebar();
          }}
          title="Toggle Notes Sidebar (Cmd+B)"
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-xl transition-all shadow-sm"
        >
          <Sidebar className="w-4 h-4" />
        </button>

        {/* Master Kinetic Animated Logo */}
        <div className="pr-2 md:pr-3 border-r border-white/10">
          <AnimatedLogo size="md" showTagline={false} />
        </div>

        {/* Liquid Glass Document Title Pill */}
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
            className="px-3 py-1.5 text-xs font-semibold bg-white/[0.12] backdrop-blur-xl text-white rounded-xl border border-cyan-400 focus:outline-none max-w-[140px] sm:max-w-[240px] shadow-inner"
          />
        ) : (
          <button
            onClick={() => {
              playClickSound();
              setTempTitle(noteTitle);
              setIsEditingTitle(true);
            }}
            title="Click to rename document"
            className="text-xs font-semibold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-xl transition-all truncate max-w-[130px] sm:max-w-[220px]"
          >
            {noteTitle}
          </button>
        )}

        {/* iOS Dynamic Island Style Sync Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl text-[11px] font-mono text-slate-300 shadow-sm">
          {saveStatus === 'saving' ? (
            <>
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
              <span className="text-cyan-300">Syncing...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-emerald-400 font-medium">Cloud Saved</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-400">Unsaved</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation & Pro Tools (macOS Glassmorphic Bar) */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        {/* Real Paper vs Space vs Dark Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              playClickSound();
              setIsThemeMenuOpen(!isThemeMenuOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 backdrop-blur-2xl text-xs text-slate-200 transition-all shadow-sm"
            title="Switch Canvas Background Theme (Space, Paper, Dark, etc.)"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm shrink-0"
              style={{ backgroundColor: currentThemeObj.preview }}
            />
            <span className="truncate max-w-[130px] font-medium">{currentThemeObj.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-[#090b14]/90 backdrop-blur-3xl border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Theme & Paper Mode
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
                    className="w-4 h-4 rounded-full border border-white/40 shrink-0 shadow-sm"
                    style={{ backgroundColor: th.preview }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold">{th.label}</span>
                    <span className="text-[10px] text-slate-400 truncate">{th.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mac Style Glass Zoom Controls */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/[0.07] border border-white/15 backdrop-blur-2xl shadow-sm">
          <button
            onClick={() => {
              playClickSound();
              onZoomOut();
            }}
            title="Zoom Out (-)"
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              playClickSound();
              onZoomReset();
            }}
            title="Reset Zoom to 100%"
            className="px-2 text-xs font-mono font-bold text-cyan-300 hover:underline"
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
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tactile Audio Feedback Switch */}
        <button
          onClick={() => {
            const next = !soundActive;
            setSoundActive(next);
            setSoundFeedbackEnabled(next);
            if (next) playClickSound();
          }}
          title={soundActive ? 'Tactile Audio Feedback: ON' : 'Tactile Audio Feedback: MUTED'}
          className={`p-2 rounded-xl border backdrop-blur-xl transition-all shadow-sm ${
            soundActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-white/[0.06] text-slate-400 border-white/15 hover:text-white hover:bg-white/10'
          }`}
        >
          {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* TV Presentation Mode Toggle */}
        {onTogglePresentationMode && (
          <button
            onClick={() => {
              playClickSound();
              onTogglePresentationMode();
            }}
            title={isPresentationMode ? 'Exit Zen Stage' : 'Zen Stage (Distraction-Free Canvas Focus)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-xl text-xs font-medium transition-all shadow-sm ${
              isPresentationMode
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/[0.07] hover:bg-white/[0.14] text-slate-300 border-white/15'
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Zen Stage</span>
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F11 / TV / Big Screen)'}
          className="p-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-slate-300 border border-white/15 backdrop-blur-2xl transition-all shadow-sm"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Trilingual Translation & Spell Check Suite */}
        {onOpenLanguage && (
          <button
            onClick={() => {
              playClickSound();
              onOpenLanguage();
            }}
            title="Trilingual Translator & Spell Check (English, Hindi, Hinglish)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border border-indigo-500/30 backdrop-blur-2xl text-xs font-medium transition-all shadow-sm"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Translate & Spell</span>
            <span className="inline xl:hidden">Translate</span>
          </button>
        )}

        {/* Cloud Account & Security Modal */}
        <button
          onClick={() => {
            playClickSound();
            onOpenAccount();
          }}
          title="Cloud Account, OTP Verification & Security"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 hover:text-white border border-cyan-500/30 backdrop-blur-2xl text-xs font-medium transition-all shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">Account & OTP</span>
          <span className="inline xl:hidden">Account</span>
        </button>

        {/* Template Gallery */}
        <button
          onClick={() => {
            playClickSound();
            onOpenTemplates();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-slate-300 hover:text-white border border-white/15 backdrop-blur-2xl text-xs transition-all shadow-sm"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden xl:inline">Templates</span>
        </button>

        {/* Export Modal */}
        <button
          onClick={() => {
            playClickSound();
            onOpenExport();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-slate-300 hover:text-white border border-white/15 backdrop-blur-2xl text-xs transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export</span>
        </button>

        {/* One-Click Direct Project ZIP Download */}
        <button
          onClick={handleDownloadZip}
          title="Download Complete Project ZIP folder"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/90 to-teal-500/90 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-semibold backdrop-blur-xl border border-white/20 shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition-all"
        >
          <FileArchive className="w-3.5 h-3.5" />
          <span>Get ZIP</span>
        </button>
      </div>

      {/* Zone 3: Mobile & Tablet Quick Actions */}
      <div className="flex lg:hidden items-center gap-2">
        <button
          onClick={handleDownloadZip}
          title="Download Project ZIP"
          className="p-2 rounded-xl bg-emerald-600/90 text-white text-xs font-semibold shadow-md border border-white/20 backdrop-blur-xl"
        >
          <FileArchive className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            playClickSound();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
          className="p-2 rounded-xl bg-white/[0.08] text-white border border-white/15 backdrop-blur-xl"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Glassmorphic Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#070913]/90 backdrop-blur-3xl border-b border-white/15 p-4 z-50 flex flex-col gap-3.5 shadow-2xl lg:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Canvas Themes</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  playClickSound();
                  onThemeChange(backgroundTheme === 'space' ? 'paper' : 'space');
                }}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-medium shadow-sm"
              >
                {backgroundTheme === 'space' ? 'Switch to Paper Grid' : 'Switch to Space'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {THEME_LIST.slice(0, 4).map((th) => (
              <button
                key={th.id}
                onClick={() => {
                  playClickSound();
                  onThemeChange(th.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left backdrop-blur-xl ${
                  backgroundTheme === th.id
                    ? 'border-cyan-400 bg-cyan-600/30 text-white shadow-sm'
                    : 'border-white/10 bg-white/[0.05] text-slate-300'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: th.preview }} />
                <span className="truncate font-medium">{th.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Mobile Pro Tools Row */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            {onOpenLanguage && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenLanguage();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 backdrop-blur-xl"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Translate & Spell</span>
              </button>
            )}

            <button
              onClick={() => {
                playClickSound();
                onOpenAccount();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-cyan-500/20 text-cyan-200 text-xs font-medium border border-cyan-500/30 backdrop-blur-xl"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Account & OTP</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                onOpenTemplates();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.08] text-slate-300 text-xs border border-white/10 backdrop-blur-xl"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => {
                const next = !soundActive;
                setSoundActive(next);
                setSoundFeedbackEnabled(next);
                if (next) playClickSound();
              }}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.08] text-slate-300 text-xs border border-white/10 backdrop-blur-xl"
            >
              {soundActive ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundActive ? 'Sound: On' : 'Sound: Off'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClickSound();
                  onZoomOut();
                }}
                className="p-2 rounded-xl bg-white/[0.08] text-white border border-white/10"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-bold text-cyan-300">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => {
                  playClickSound();
                  onZoomIn();
                }}
                className="p-2 rounded-xl bg-white/[0.08] text-white border border-white/10"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClickSound();
                  onOpenExport();
                  setIsMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.08] text-xs text-white border border-white/10"
              >
                Export
              </button>
              <button
                onClick={() => {
                  handleDownloadZip();
                  setIsMobileMenuOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-xs text-white font-semibold shadow-md"
              >
                Download ZIP
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
