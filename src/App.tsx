/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CanvasElement,
  GridType,
  BackgroundTheme,
  NoteItem,
  StrokeStyle,
  ToolType,
  Viewport,
  SupportedFontFamily,
  UserProfile,
} from './types';
import { HistoryManager } from './utils/history';
import { getMultiElementBounds, clampZoom } from './utils/canvasMath';
import { applyAutoCapitalization, transcribeInkToText } from './utils/languageEngine';
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas';
import { FloatingToolbar } from './components/Canvas/FloatingToolbar';
import { StylePicker } from './components/Canvas/StylePicker';
import { Minimap } from './components/Canvas/Minimap';
import { TopNavBar } from './components/Header/TopNavBar';
import { NotesSidebar } from './components/Sidebar/NotesSidebar';
import { AIAssistantModal } from './components/AI/AIAssistantModal';
import { ExportModal } from './components/Export/ExportModal';
import { TemplatesModal } from './components/Templates/TemplatesModal';
import { ShortcutsModal } from './components/Shortcuts/ShortcutsModal';
import { AuthModal } from './components/Auth/AuthModal';
import { LanguageToolsModal } from './components/Language/LanguageToolsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Presentation, X } from 'lucide-react';
import { playClickSound, playPlaceSound } from './utils/audioFeedback';

function MainApp() {
  // Global Notes & Active Document State
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Active Canvas Document State (Defaulting to Aditya Portfolio Cosmos theme with 3D starfield!)
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 180, y: 120, zoom: 1.0 });
  const [gridType, setGridType] = useState<GridType>('math');
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>('portfolio-cosmos');

  // Canvas Tool & Selection State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);

  // Active Styling Properties
  const [activeStrokeColor, setActiveStrokeColor] = useState<string>('#38bdf8');
  const [activeFillColor, setActiveFillColor] = useState<string>('transparent');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState<number>(2);
  const [activeStrokeStyle, setActiveStrokeStyle] = useState<StrokeStyle>('solid');
  const [activeFontSize, setActiveFontSize] = useState<number>(18);
  const [activeFontFamily, setActiveFontFamily] = useState<SupportedFontFamily>('Plus Jakarta Sans');

  // TV / Presentation Mode
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // History Manager
  const historyRef = useRef<HistoryManager>(new HistoryManager());
  const [, setHistoryTick] = useState(0);

  // Modals Visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Debounced Autosave Timer Ref
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Load: Fetch current user and notes from API
  useEffect(() => {
    // 1. Check logged-in user session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    // 2. Fetch notes
    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.notes && data.notes.length > 0) {
          setNotes(data.notes);
          const first = data.notes[0];
          setActiveNoteId(first.id);
          setElements(first.elements || []);
          if (first.viewport) setViewport(first.viewport);
          if (first.gridType) setGridType(first.gridType);
          if (first.backgroundTheme) setBackgroundTheme(first.backgroundTheme);
          historyRef.current.clear(first.elements || []);
          setHistoryTick((t) => t + 1);
        }
      })
      .catch((err) => {
        console.warn('API notes load failed, initializing default workspace:', err);
      });
  }, []);

  // Switch workspace to logged in user's cloud notes
  const handleUserChange = async (user: UserProfile) => {
    setCurrentUser(user);
    try {
      const res = await fetch(`/api/notes?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (data.success && data.notes && data.notes.length > 0) {
        setNotes(data.notes);
        const first = data.notes[0];
        setActiveNoteId(first.id);
        setElements(first.elements || []);
        if (first.viewport) setViewport(first.viewport);
        if (first.gridType) setGridType(first.gridType);
        if (first.backgroundTheme) setBackgroundTheme(first.backgroundTheme);
        historyRef.current.clear(first.elements || []);
        setHistoryTick((t) => t + 1);
      }
    } catch (err) {
      console.warn('Failed to switch user notes:', err);
    }
  };

  // Direct 1-Click Insertion of Translated Text or Spell-Checked Memo to Canvas
  const handleInsertTranslatedText = (text: string, type: 'text' | 'sticky') => {
    playPlaceSound();
    const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const canvasHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const centerX = Math.round((-viewport.x + canvasWidth / 2) / viewport.zoom);
    const centerY = Math.round((-viewport.y + canvasHeight / 2) / viewport.zoom);

    const newElement: CanvasElement =
      type === 'sticky'
        ? {
            id: `sticky_lang_${Date.now()}`,
            type: 'sticky',
            x: centerX - 120,
            y: centerY - 80,
            width: 250,
            height: 160,
            text,
            colorTheme: 'cyan',
            strokeColor: '#06b6d4',
            strokeWidth: 1,
            strokeStyle: 'solid',
            opacity: 0.95,
            zIndex: elements.length + 1,
          }
        : {
            id: `text_lang_${Date.now()}`,
            type: 'text',
            x: centerX - 160,
            y: centerY - 40,
            width: 320,
            height: 90,
            text,
            fontSize: 20,
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: 'normal',
            fontStyle: 'normal',
            strokeColor: '#38bdf8',
            strokeWidth: 1,
            strokeStyle: 'solid',
            opacity: 1,
            zIndex: elements.length + 1,
          };

    const nextElements = [...elements, newElement];
    handleElementsChange(nextElements, true);
    setSelectedIds([newElement.id]);
    setIsLanguageModalOpen(false);
  };

  // Text Auto-Capitalization Transformation (Sentence, Title, UPPERCASE, etc.)
  const handleApplyCapitalization = (mode: 'sentences' | 'title' | 'characters' | 'words') => {
    if (selectedIds.length === 0) return;
    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id) && (el.type === 'text' || el.type === 'sticky')) {
        const transformed = applyAutoCapitalization(el.text, mode);
        return { ...el, text: transformed };
      }
      return el;
    });
    handleElementsChange(updated as CanvasElement[], true);
  };

  // Ink to Text Handwriting Recognition & Conversion
  const handleConvertInkToText = () => {
    const selectedFreehand = elements.find(
      (el) => selectedIds.includes(el.id) && (el.type === 'pen' || el.type === 'ink')
    );
    if (!selectedFreehand || !('points' in selectedFreehand)) return;

    const points = (selectedFreehand as any).points || [];
    const textOutput = transcribeInkToText(points.length, {
      width: selectedFreehand.width,
      height: selectedFreehand.height,
    });

    const newTextElement: CanvasElement = {
      id: `text_converted_${Date.now()}`,
      type: 'text',
      x: selectedFreehand.x,
      y: selectedFreehand.y,
      width: Math.max(selectedFreehand.width, 240),
      height: Math.max(selectedFreehand.height, 50),
      text: textOutput,
      fontSize: 20,
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 'normal',
      fontStyle: 'normal',
      strokeColor: selectedFreehand.strokeColor || '#38bdf8',
      strokeWidth: 1,
      strokeStyle: 'solid',
      opacity: 1,
      zIndex: elements.length + 1,
    };

    const nextEls = elements.filter((el) => el.id !== selectedFreehand.id).concat(newTextElement);
    handleElementsChange(nextEls, true);
    setSelectedIds([newTextElement.id]);
  };

  // Sync active note elements when activeNoteId changes
  const handleSelectNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    setActiveNoteId(id);
    setElements(target.elements || []);
    if (target.viewport) setViewport(target.viewport);
    if (target.gridType) setGridType(target.gridType);
    if (target.backgroundTheme) setBackgroundTheme(target.backgroundTheme);
    setSelectedIds([]);
    historyRef.current.clear(target.elements || []);
    setHistoryTick((t) => t + 1);
    setSaveStatus('saved');
  };

  // Debounced Cloud Autosave
  const triggerAutosave = useCallback(
    (updatedElements: CanvasElement[], updatedViewport: Viewport, currentNoteId: string) => {
      setSaveStatus('unsaved');
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          const currentNote = notes.find((n) => n.id === currentNoteId);
          if (currentNote) {
            const payload = {
              ...currentNote,
              elements: updatedElements,
              viewport: updatedViewport,
              gridType,
              backgroundTheme,
            };

            await fetch(`/api/notes/${currentNoteId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            setNotes((prev) =>
              prev.map((n) => (n.id === currentNoteId ? { ...n, ...payload, updatedAt: new Date().toISOString() } : n))
            );
          }
          setSaveStatus('saved');
        } catch (e) {
          console.error('Autosave error:', e);
          setSaveStatus('unsaved');
        }
      }, 1200);
    },
    [notes, gridType, backgroundTheme]
  );

  // Handle Canvas Elements Mutation
  const handleElementsChange = (newElements: CanvasElement[], recordHistory = true) => {
    setElements(newElements);
    if (recordHistory) {
      historyRef.current.push(newElements);
      setHistoryTick((t) => t + 1);
    }
    triggerAutosave(newElements, viewport, activeNoteId);
  };

  // Handle Viewport Changes
  const handleViewportChange = (newViewport: Viewport) => {
    setViewport(newViewport);
    triggerAutosave(elements, newViewport, activeNoteId);
  };

  // History Operations
  const handleUndo = () => {
    const prev = historyRef.current.undo(elements);
    if (prev) {
      setElements(prev);
      setHistoryTick((t) => t + 1);
      triggerAutosave(prev, viewport, activeNoteId);
    }
  };

  const handleRedo = () => {
    const next = historyRef.current.redo();
    if (next) {
      setElements(next);
      setHistoryTick((t) => t + 1);
      triggerAutosave(next, viewport, activeNoteId);
    }
  };

  // Document Operations
  const handleCreateNewNote = async () => {
    const newNotePayload = {
      title: 'New Canvas Draft',
      gridType: 'math',
      backgroundTheme: 'space',
      tags: ['Ideas'],
      viewport: { x: 180, y: 120, zoom: 1.0 },
      elements: [],
    };

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotePayload),
      });
      const data = await res.json();
      if (data.success && data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setActiveNoteId(data.note.id);
        setElements([]);
        setViewport(data.note.viewport);
        setGridType(data.note.gridType);
        setBackgroundTheme(data.note.backgroundTheme);
        setSelectedIds([]);
        historyRef.current.clear([]);
        setHistoryTick((t) => t + 1);
      }
    } catch (e) {
      console.error('Create note failed:', e);
    }
  };

  const handleDeleteNote = async (id: string, permanent = false) => {
    try {
      await fetch(`/api/notes/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
      if (permanent) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isTrash: true } : n)));
      }

      if (id === activeNoteId) {
        const remaining = notes.filter((n) => n.id !== id && !n.isTrash);
        if (remaining.length > 0) {
          handleSelectNote(remaining[0].id);
        } else {
          handleCreateNewNote();
        }
      }
    } catch (e) {
      console.error('Delete note failed:', e);
    }
  };

  const handleDuplicateNote = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const copyPayload = {
      title: `${target.title} (Copy)`,
      elements: target.elements || [],
      viewport: target.viewport || { x: 180, y: 120, zoom: 1.0 },
      gridType: target.gridType || 'math',
      backgroundTheme: target.backgroundTheme || 'space',
      tags: [...(target.tags || []), 'Copy'],
    };
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyPayload),
      });
      const data = await res.json();
      if (data.success && data.note) {
        setNotes((prev) => [data.note, ...prev]);
        handleSelectNote(data.note.id);
      }
    } catch (e) {
      console.error('Duplicate note failed:', e);
    }
  };

  const handleRestoreNote = async (id: string) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrash: false }),
      });
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isTrash: false } : n)));
    } catch (e) {
      console.error('Restore note failed:', e);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setNotes((prev) => prev.map((n) => (n.id === activeNoteId ? { ...n, title: newTitle } : n)));
    triggerAutosave(elements, viewport, activeNoteId);
  };

  const handleTogglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  const handleCycleGrid = () => {
    const cycle: GridType[] = ['math', 'dots', 'cross', 'isometric', 'hex', 'engineering', 'polar', 'cornell', 'ruled', 'music', 'none'];
    const nextIdx = (cycle.indexOf(gridType) + 1) % cycle.length;
    setGridType(cycle[nextIdx]);
  };

  // Zoom Helpers
  const handleZoomIn = () => {
    setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom * 1.15) }));
  };

  const handleZoomOut = () => {
    setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom * 0.85) }));
  };

  const handleZoomReset = () => {
    setViewport((v) => ({ ...v, zoom: 1.0 }));
  };

  const handleFitToContent = useCallback(() => {
    if (elements.length === 0) return;
    const bounds = getMultiElementBounds(elements);
    if (!bounds) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight - 56;
    const padding = 120;

    const scaleX = (canvasWidth - padding) / Math.max(bounds.width, 100);
    const scaleY = (canvasHeight - padding) / Math.max(bounds.height, 100);
    const targetZoom = clampZoom(Math.min(scaleX, scaleY, 1.5), 0.2, 3.0);

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    const newX = canvasWidth / 2 - centerX * targetZoom;
    const newY = canvasHeight / 2 - centerY * targetZoom;

    setViewport({
      x: Math.round(newX),
      y: Math.round(newY),
      zoom: Math.round(targetZoom * 100) / 100,
    });
  }, [elements]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || {
    id: 'draft',
    title: 'Nexora Infinite Studio',
    tags: ['Workspace'],
    isPinned: false,
    isTrash: false,
    elements: [],
    viewport,
    gridType,
    backgroundTheme,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));

  const updateSelectedStyle = (updates: Partial<CanvasElement>) => {
    if (selectedIds.length === 0) return;
    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        return { ...el, ...updates } as CanvasElement;
      }
      return el;
    });
    handleElementsChange(updated, true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-black text-slate-100 select-none font-sans">
      {/* Subtle Glowing Background Ambient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-15"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-15"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Bar Navigation (Hidden in Presentation Mode) */}
      {!isPresentationMode && (
        <TopNavBar
          noteTitle={activeNote.title}
          onTitleChange={handleTitleChange}
          saveStatus={saveStatus}
          zoom={viewport.zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          backgroundTheme={backgroundTheme}
          onThemeChange={(theme) => setBackgroundTheme(theme)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenTemplates={() => setIsTemplatesModalOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenAccount={() => setIsAuthModalOpen(true)}
          onOpenLanguage={() => setIsLanguageModalOpen(true)}
          isPresentationMode={isPresentationMode}
          onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
        />
      )}

      {/* Floating Presentation Mode Exit Button */}
      {isPresentationMode && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <button
            onClick={() => {
              playClickSound();
              setIsPresentationMode(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/20 text-white text-xs font-semibold shadow-2xl hover:bg-white/10 transition-all cursor-pointer"
          >
            <Presentation className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exit Zen Stage</span>
            <X className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      )}

      {/* Main Canvas Workspace */}
      <div className={`relative flex-1 w-full ${isPresentationMode ? 'h-full' : 'h-[calc(100vh-56px)]'} z-10`}>
        <InfiniteCanvas
          elements={elements}
          onElementsChange={handleElementsChange}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          viewport={viewport}
          onViewportChange={handleViewportChange}
          gridType={gridType}
          backgroundTheme={backgroundTheme}
          snapEnabled={snapEnabled}
          activeStrokeColor={activeStrokeColor}
          activeFillColor={activeFillColor}
          activeStrokeWidth={activeStrokeWidth}
          activeFontSize={activeFontSize}
          activeFontFamily={activeFontFamily}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyRef.current.canUndo()}
          canRedo={historyRef.current.canRedo()}
          onSaveTrigger={() => triggerAutosave(elements, viewport, activeNoteId)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onFitToContent={handleFitToContent}
        />

        {/* Floating Toolbar (Hidden in Presentation Mode) */}
        {!isPresentationMode && (
          <FloatingToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            snapEnabled={snapEnabled}
            onToggleSnap={() => setSnapEnabled(!snapEnabled)}
            gridType={gridType}
            onSelectGridType={(type) => setGridType(type)}
            onToggleGrid={handleCycleGrid}
            canUndo={historyRef.current.canUndo()}
            canRedo={historyRef.current.canRedo()}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onOpenAI={() => setIsAIModalOpen(true)}
          />
        )}

        {/* Contextual Style Picker */}
        {!isPresentationMode && selectedIds.length > 0 && (
          <StylePicker
            selectedElements={selectedElements}
            activeStrokeColor={activeStrokeColor}
            onStrokeColorChange={(color) => {
              setActiveStrokeColor(color);
              updateSelectedStyle({ strokeColor: color });
            }}
            activeFillColor={activeFillColor}
            onFillColorChange={(fill) => {
              setActiveFillColor(fill);
              updateSelectedStyle({ fillColor: fill });
            }}
            activeStrokeWidth={activeStrokeWidth}
            onStrokeWidthChange={(width) => {
              setActiveStrokeWidth(width);
              updateSelectedStyle({ strokeWidth: width });
            }}
            activeStrokeStyle={activeStrokeStyle}
            onStrokeStyleChange={(style) => {
              setActiveStrokeStyle(style);
              updateSelectedStyle({ strokeStyle: style });
            }}
            onDuplicate={() => {
              const duplicates = selectedElements.map((el) => {
                const clone = JSON.parse(JSON.stringify(el));
                clone.id = `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                clone.x += 30;
                clone.y += 30;
                return clone;
              });
              handleElementsChange([...elements, ...duplicates], true);
              setSelectedIds(duplicates.map((d) => d.id));
            }}
            onDelete={() => {
              handleElementsChange(
                elements.filter((el) => !selectedIds.includes(el.id)),
                true
              );
              setSelectedIds([]);
            }}
            onToggleGlow={() => {
              const anyGlow = selectedElements.some((el) => el.glow);
              updateSelectedStyle({ glow: !anyGlow, glowColor: activeStrokeColor });
            }}
            onToggleBold={() => {
              const el = selectedElements.find((e) => e.type === 'text') as any;
              const nextWeight = el?.fontWeight === 'bold' ? 'normal' : 'bold';
              updateSelectedStyle({ fontWeight: nextWeight } as any);
            }}
            onToggleItalic={() => {
              const el = selectedElements.find((e) => e.type === 'text') as any;
              const nextStyle = el?.fontStyle === 'italic' ? 'normal' : 'italic';
              updateSelectedStyle({ fontStyle: nextStyle } as any);
            }}
            onChangeFontSize={(size) => {
              setActiveFontSize(size);
              updateSelectedStyle({ fontSize: size } as any);
            }}
            onChangeFontFamily={(family) => {
              setActiveFontFamily(family);
              updateSelectedStyle({ fontFamily: family } as any);
            }}
            onBringForward={() => {
              const maxZ = Math.max(...elements.map((e) => e.zIndex || 1));
              updateSelectedStyle({ zIndex: maxZ + 1 });
            }}
            onSendBackward={() => {
              const minZ = Math.min(...elements.map((e) => e.zIndex || 1));
              updateSelectedStyle({ zIndex: Math.max(1, minZ - 1) });
            }}
            activeFontFamily={activeFontFamily}
            activeFontSize={activeFontSize}
            onApplyCapitalization={handleApplyCapitalization}
            onConvertInkToText={handleConvertInkToText}
          />
        )}

        {/* Live Minimap Radar Navigator (Hidden in Presentation Mode) */}
        {!isPresentationMode && (
          <Minimap
            elements={elements}
            viewport={viewport}
            onViewportChange={handleViewportChange}
          />
        )}
      </div>

      {/* Sidebar Library Drawer */}
      <NotesSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        notes={notes}
        activeNoteId={activeNoteId}
        onSelectNote={(id) => {
          handleSelectNote(id);
          setIsSidebarOpen(false);
        }}
        onCreateNote={handleCreateNewNote}
        onDuplicateNote={handleDuplicateNote}
        onDeleteNote={handleDeleteNote}
        onRestoreNote={handleRestoreNote}
        onTogglePin={handleTogglePin}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        currentElementsSummary={`${elements.length} elements on canvas (${elements.map((e) => e.type).slice(0, 5).join(', ')})`}
        onAddElementsToCanvas={(newEls: CanvasElement[]) => {
          handleElementsChange([...elements, ...newEls], true);
          setSelectedIds(newEls.map((e) => e.id));
        }}
      />

      {/* Export Blueprint Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        elements={elements}
        viewport={viewport}
        activeNote={activeNote}
        onImportNote={(noteData) => {
          if (noteData.elements) handleElementsChange(noteData.elements, true);
          if (noteData.title) handleTitleChange(noteData.title);
          if (noteData.gridType) setGridType(noteData.gridType);
          if (noteData.backgroundTheme) setBackgroundTheme(noteData.backgroundTheme);
        }}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onLoadTemplate={(_name: string, newElements: CanvasElement[]) => {
          handleElementsChange(newElements, true);
          handleFitToContent();
        }}
      />

      {/* Keyboard Shortcuts Cheatsheet */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Profile & Security Management Modal (OTP + Cloud Account) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUserChange={handleUserChange}
      />

      {/* Trilingual Translation & Spell Check Suite (English, Hindi, Hinglish) */}
      <LanguageToolsModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onInsertToCanvas={handleInsertTranslatedText}
        selectedText={
          selectedElements.find((e) => e.type === 'text' || e.type === 'sticky')?.text || ''
        }
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
