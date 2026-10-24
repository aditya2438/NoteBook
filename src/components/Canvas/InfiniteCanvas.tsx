import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import {
  CanvasElement,
  GridType,
  BackgroundTheme,
  Point,
  ToolType,
  Viewport,
  TextElement,
  StickyElement,
  CodeElement,
  ShapeElement,
  LineElement,
  SupportedFontFamily,
} from '../../types';
import {
  screenToWorld,
  worldToScreen,
  snapPoint,
  clampZoom,
  isPointInElement,
  getElementBounds,
  isElementIntersectingBox,
  generateId,
} from '../../utils/canvasMath';
import { playPlaceSound, playSnapSound, playDeleteSound } from '../../utils/audioFeedback';

interface InfiniteCanvasProps {
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[], recordHistory?: boolean) => void;
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  gridType: GridType;
  backgroundTheme: BackgroundTheme;
  snapEnabled: boolean;
  activeStrokeColor: string;
  activeFillColor: string;
  activeStrokeWidth: number;
  activeFontSize: number;
  activeFontFamily: SupportedFontFamily;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSaveTrigger: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onFitToContent?: () => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface StarParticle {
  x: number;
  y: number;
  z: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  vx: number;
  vy: number;
  color: string;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  elements,
  onElementsChange,
  activeTool,
  onToolChange,
  selectedIds,
  onSelectionChange,
  viewport,
  onViewportChange,
  gridType,
  backgroundTheme,
  snapEnabled,
  activeStrokeColor,
  activeFillColor,
  activeStrokeWidth,
  activeFontSize,
  activeFontFamily,
  onUndo,
  onRedo,
  onSaveTrigger,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToContent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Drawing & Creation State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dragCurrentPoint, setDragCurrentPoint] = useState<Point | null>(null);

  // Marquee Selection Box
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Moving elements
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [elementDragStart, setElementDragStart] = useState<Point | null>(null);

  // Resizing element via 8 handles
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeInitialElement, setResizeInitialElement] = useState<CanvasElement | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState<Point | null>(null);

  // In-line Text Editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Laser Pointer sparks
  const [laserPoints, setLaserPoints] = useState<{ x: number; y: number; time: number }[]>([]);

  // Coordinate HUD display & mouse tracking for parallax
  const [mouseCoord, setMouseCoord] = useState<Point>({ x: 0, y: 0 });
  const mouseScreenRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Multi-Touch Pinch-to-Zoom & Pan Tracking
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; zoom: number; midX: number; midY: number; vpX: number; vpY: number } | null>(null);

  // Portfolio & Space Starfield Particles
  const starsRef = useRef<StarParticle[]>([]);

  // Initialize Particles (3D starfield with lavender/cyan halos inspired by Aditya's portfolio)
  useEffect(() => {
    const starColors = [
      '#ffffff',
      '#d8b4fe', // portfolio soft lavender
      '#64e5ff', // portfolio cyan glow
      '#c084fc', // purple violet
      '#93c5fd', // soft blue
      '#f472b6', // rose
    ];
    const stars: StarParticle[] = [];
    const count = 240;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 3200,
        y: (Math.random() - 0.5) * 2200,
        z: Math.random() * 1000 + 100,
        r: 0.8 + Math.random() * 2.2,
        baseAlpha: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 0.6 + Math.random() * 2.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
    starsRef.current = stars;
  }, []);

  // 1. DEDICATED BACKGROUND ANIMATION LOOP
  // Runs independently on bgCanvasRef at 60 FPS — NEVER clashes with elements or tools!
  useEffect(() => {
    const isAnimatedTheme =
      backgroundTheme === 'portfolio-cosmos' ||
      backgroundTheme === 'space' ||
      backgroundTheme === 'nebula';

    let animId: number;

    const renderBg = () => {
      const bgCanvas = bgCanvasRef.current;
      if (!bgCanvas) return;
      const ctx = bgCanvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = bgCanvas.width / dpr;
      const height = bgCanvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // --- THEME 1: Aditya Portfolio Cosmos (Obsidian #07070a with 3 Ambient Radial Glows & 3D Starfield) ---
      if (backgroundTheme === 'portfolio-cosmos') {
        // Base obsidian
        ctx.fillStyle = '#07070a';
        ctx.fillRect(0, 0, width, height);

        // Ambient Glow 1: Top Center Violet/Indigo
        const glow1 = ctx.createRadialGradient(width * 0.5, 0, 0, width * 0.5, 0, Math.max(width, height) * 0.6);
        glow1.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
        glow1.addColorStop(0.5, 'rgba(139, 92, 246, 0.08)');
        glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, width, height);

        // Ambient Glow 2: Bottom-Right Purple/Violet
        const glow2 = ctx.createRadialGradient(width * 0.85, height * 0.65, 0, width * 0.85, height * 0.65, Math.max(width, height) * 0.55);
        glow2.addColorStop(0, 'rgba(168, 85, 247, 0.14)');
        glow2.addColorStop(0.6, 'rgba(139, 92, 246, 0.06)');
        glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, width, height);

        // Ambient Glow 3: Bottom-Left Cyan
        const glow3 = ctx.createRadialGradient(width * 0.15, height * 0.8, 0, width * 0.15, height * 0.8, Math.max(width, height) * 0.5);
        glow3.addColorStop(0, 'rgba(100, 229, 255, 0.13)');
        glow3.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
        glow3.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow3;
        ctx.fillRect(0, 0, width, height);

        // Starfield Particles with 3D Parallax & Radial Lavender/Cyan Texture
        const now = performance.now() * 0.001;
        const centerX = width / 2;
        const centerY = height / 2;
        const mouseParallaxX = (mouseScreenRef.current.x - centerX) * 0.035;
        const mouseParallaxY = (mouseScreenRef.current.y - centerY) * 0.035;

        for (const star of starsRef.current) {
          star.x += star.vx;
          star.y += star.vy;
          if (star.x > 1600) star.x = -1600;
          if (star.x < -1600) star.x = 1600;
          if (star.y > 1100) star.y = -1100;
          if (star.y < -1100) star.y = 1100;

          // Parallax projection
          const k = 600 / (star.z || 600);
          const px = centerX + star.x * k + mouseParallaxX * k;
          const py = centerY + star.y * k + mouseParallaxY * k;

          if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

          const alpha = Math.max(0.1, Math.min(0.95, star.baseAlpha + Math.sin(now * star.twinkleSpeed + star.twinkleOffset) * 0.35));
          const rad = Math.max(0.8, star.r * k);

          // Draw Glowing Star Halo (like in portfolio Three.js texture)
          const grad = ctx.createRadialGradient(px, py, 0, px, py, rad * 3.5);
          grad.addColorStop(0, 'rgba(255, 255, 255, ' + alpha + ')');
          grad.addColorStop(0.35, 'rgba(216, 180, 254, ' + (alpha * 0.8) + ')');
          grad.addColorStop(0.7, 'rgba(100, 229, 255, ' + (alpha * 0.35) + ')');
          grad.addColorStop(1, 'rgba(100, 229, 255, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, rad * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (backgroundTheme === 'space') {
        const grad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, Math.max(width, height) * 0.85);
        grad.addColorStop(0, '#050917');
        grad.addColorStop(0.65, '#02040b');
        grad.addColorStop(1, '#010206');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const now = performance.now() * 0.001;
        for (const s of starsRef.current) {
          s.x = (s.x + s.vx + width) % width;
          s.y = (s.y + s.vy + height) % height;
          const alpha = Math.max(0.15, Math.min(0.85, s.baseAlpha + Math.sin(now * s.twinkleSpeed + s.twinkleOffset) * 0.3));
          ctx.fillStyle = s.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(Math.abs(s.x) % width, Math.abs(s.y) % height, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (backgroundTheme === 'nebula') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0c0721');
        grad.addColorStop(0.5, '#130a33');
        grad.addColorStop(1, '#050210');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const now = performance.now() * 0.001;
        for (const s of starsRef.current) {
          const alpha = Math.max(0.18, Math.min(0.9, s.baseAlpha + Math.sin(now * s.twinkleSpeed + s.twinkleOffset) * 0.3));
          ctx.fillStyle = s.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(Math.abs(s.x) % width, Math.abs(s.y) % height, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        const bgColors: Record<BackgroundTheme, string> = {
          'portfolio-cosmos': '#07070a',
          space: '#020308',
          nebula: '#0a0518',
          amoled: '#000000',
          obsidian: '#09090b',
          slate: '#0f172a',
          paper: '#fbf9f4',
          blueprint: '#0b2545',
          chalkboard: '#14281d',
          parchment: '#f4ecd8',
          cyberpunk: '#0a0518',
        };
        ctx.fillStyle = bgColors[backgroundTheme] || '#000000';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();

      if (isAnimatedTheme) {
        animId = requestAnimationFrame(renderBg);
      }
    };

    renderBg();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [backgroundTheme]);

  // 2. RESIZE OBSERVER: Synchronize canvas buffer dimensions with container
  // Only updates width/height when container actually resizes, completely eliminating GPU buffer allocation thrashing!
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      if (bgCanvasRef.current) {
        bgCanvasRef.current.width = Math.round(rect.width * dpr);
        bgCanvasRef.current.height = Math.round(rect.height * dpr);
        bgCanvasRef.current.style.width = `${rect.width}px`;
        bgCanvasRef.current.style.height = `${rect.height}px`;
      }

      if (canvasRef.current) {
        canvasRef.current.width = Math.round(rect.width * dpr);
        canvasRef.current.height = Math.round(rect.height * dpr);
        canvasRef.current.style.width = `${rect.width}px`;
        canvasRef.current.style.height = `${rect.height}px`;
      }

      drawMainCanvas();
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Clean Laser points
  useEffect(() => {
    if (laserPoints.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserPoints((prev) => prev.filter((p) => now - p.time < 700));
    }, 40);
    return () => clearInterval(interval);
  }, [laserPoints]);

  // 3. MAIN FOREGROUND CANVAS RENDERER
  const drawMainCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Render Infinite Grid (Math, Dots, Isometric, etc.)
    if (gridType !== 'none') {
      drawGrid(ctx, width, height, viewport, gridType, backgroundTheme);
    }

    // World Space Transform
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Render All Persistent Elements
    for (const el of elements) {
      if (el.id === editingTextId) continue;
      renderElement(ctx, el, selectedIds.includes(el.id), backgroundTheme);
    }

    // Render Interactive Resize Handles for Single Selected Element
    if (selectedIds.length === 1 && activeTool === 'select') {
      const selectedEl = elements.find((e) => e.id === selectedIds[0]);
      if (selectedEl && selectedEl.type !== 'pen' && selectedEl.type !== 'highlighter' && selectedEl.type !== 'ink') {
        renderResizeHandles(ctx, selectedEl, viewport.zoom);
      }
    }

    // Render In-Progress Freehand Stroke
    if (isDrawing && (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'ink') && currentPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = activeStrokeColor;
      ctx.lineWidth = activeTool === 'highlighter' ? 18 : activeTool === 'ink' ? Math.max(activeStrokeWidth * 1.5, 3) : activeStrokeWidth;
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.35 : 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeTool === 'ink') {
        for (let i = 1; i < currentPath.length; i++) {
          const p1 = currentPath[i - 1];
          const p2 = currentPath[i];
          const pr = p2.pressure || 0.6;
          ctx.lineWidth = Math.max(1.5, activeStrokeWidth * pr * 1.6);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (isDrawing && dragStartPoint && dragCurrentPoint) {
      // Live Shape Preview
      renderShapePreview(
        ctx,
        activeTool,
        dragStartPoint,
        dragCurrentPoint,
        activeStrokeColor,
        activeFillColor,
        activeStrokeWidth
      );
    }

    // Marquee Selection Box
    if (selectionBox) {
      ctx.save();
      const p1 = screenToWorld(selectionBox.startX, selectionBox.startY, viewport);
      const p2 = screenToWorld(selectionBox.currentX, selectionBox.currentY, viewport);
      const bx = Math.min(p1.x, p2.x);
      const by = Math.min(p1.y, p2.y);
      const bw = Math.abs(p1.x - p2.x);
      const bh = Math.abs(p1.y - p2.y);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1 / viewport.zoom;
      ctx.setLineDash([4 / viewport.zoom, 4 / viewport.zoom]);
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
    }

    // Laser pointer
    if (laserPoints.length > 1) {
      ctx.save();
      const now = Date.now();
      for (let i = 1; i < laserPoints.length; i++) {
        const pt = laserPoints[i];
        const age = now - pt.time;
        const opacity = Math.max(0, 1 - age / 700);
        ctx.strokeStyle = `rgba(244, 63, 94, ${opacity})`;
        ctx.lineWidth = (6 * opacity) / viewport.zoom;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(laserPoints[i - 1].x, laserPoints[i - 1].y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }, [
    elements,
    selectedIds,
    viewport,
    gridType,
    backgroundTheme,
    activeTool,
    isDrawing,
    currentPath,
    dragStartPoint,
    dragCurrentPoint,
    selectionBox,
    laserPoints,
    editingTextId,
    activeStrokeColor,
    activeFillColor,
    activeStrokeWidth,
  ]);

  useEffect(() => {
    drawMainCanvas();
  }, [drawMainCanvas]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveTrigger();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        onRedo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedIds.length > 0) duplicateSelected();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onSelectionChange(elements.map((el) => el.id));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          playDeleteSound();
          onElementsChange(elements.filter((el) => !selectedIds.includes(el.id)), true);
          onSelectionChange([]);
        }
        return;
      }

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomAroundCenter(1.15);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomAroundCenter(0.85);
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        onViewportChange({ ...viewport, zoom: 1.0 });
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          onToolChange('select');
          break;
        case 'h':
          onToolChange('hand');
          break;
        case 'p':
          onToolChange('pen');
          break;
        case 'i':
          onToolChange('ink');
          break;
        case 'e':
          onToolChange('eraser');
          break;
        case 't':
          onToolChange('text');
          break;
        case 's':
          onToolChange('sticky');
          break;
        case 'r':
          onToolChange('rect');
          break;
        case 'c':
          onToolChange('circle');
          break;
        case 'a':
          onToolChange('arrow');
          break;
        case 'l':
          onToolChange('line');
          break;
        case 'x':
          onToolChange('code');
          break;
        case 'z':
          if (!e.ctrlKey && !e.metaKey) onToolChange('laser');
          break;
        case 'escape':
          onSelectionChange([]);
          setEditingTextId(null);
          onToolChange('select');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [elements, selectedIds, viewport, onSaveTrigger, onUndo, onRedo, onToolChange, onSelectionChange, onElementsChange]);

  const duplicateSelected = () => {
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    if (selected.length === 0) return;

    const duplicates = selected.map((el) => {
      const clone = JSON.parse(JSON.stringify(el));
      clone.id = generateId('dupe');
      clone.x += 30;
      clone.y += 30;
      if (clone.points) {
        clone.points = clone.points.map((p: Point) => ({ x: p.x + 30, y: p.y + 30, pressure: p.pressure }));
      }
      return clone;
    });

    onElementsChange([...elements, ...duplicates], true);
    onSelectionChange(duplicates.map((d) => d.id));
  };

  const zoomAroundCenter = (factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newZoom = clampZoom(viewport.zoom * factor);
    const newX = centerX - (centerX - viewport.x) * (newZoom / viewport.zoom);
    const newY = centerY - (centerY - viewport.y) * (newZoom / viewport.zoom);

    onViewportChange({ x: newX, y: newY, zoom: newZoom });
  };

  // Wheel Zoom & Pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey || isSpacePressed) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = clampZoom(viewport.zoom * zoomFactor);
      const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
      const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);
      onViewportChange({ x: newX, y: newY, zoom: newZoom });
    } else {
      onViewportChange({
        ...viewport,
        x: viewport.x - e.deltaX,
        y: viewport.y - e.deltaY,
      });
    }
  };

  // Pointer Down: Handles drawing, moving, panning, resize handles, and click-to-place
  const handlePointerDown = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch Pinch Zoom
    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;

      pinchStartRef.current = {
        dist,
        zoom: viewport.zoom,
        midX,
        midY,
        vpX: viewport.x,
        vpY: viewport.y,
      };

      setIsDrawing(false);
      setIsDraggingElements(false);
      setActiveResizeHandle(null);
      setDragStartPoint(null);
      setDragCurrentPoint(null);
      return;
    }

    if (activePointersRef.current.size > 2) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPt = screenToWorld(screenX, screenY, viewport);
    const snappedPt = snapPoint(worldPt, 24, snapEnabled);

    // Pan
    if (e.button === 1 || isSpacePressed || activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    // Laser
    if (activeTool === 'laser') {
      setLaserPoints([{ ...worldPt, time: Date.now() }]);
      return;
    }

    // Eraser
    if (activeTool === 'eraser') {
      eraseAtPoint(worldPt);
      return;
    }

    // Select Tool: Check 8-direction resize handles first if 1 element is selected
    if (activeTool === 'select' && selectedIds.length === 1) {
      const selectedEl = elements.find((el) => el.id === selectedIds[0]);
      if (selectedEl && selectedEl.type !== 'pen' && selectedEl.type !== 'highlighter' && selectedEl.type !== 'ink') {
        const handle = getHitResizeHandle(worldPt, selectedEl, viewport.zoom);
        if (handle) {
          setActiveResizeHandle(handle);
          setResizeInitialElement(JSON.parse(JSON.stringify(selectedEl)));
          setResizeStartPoint(worldPt);
          return;
        }
      }
    }

    // Select Tool: Hit testing elements
    if (activeTool === 'select') {
      const hit = [...elements].reverse().find((el) => isPointInElement(worldPt, el));

      if (hit) {
        if (e.shiftKey) {
          if (selectedIds.includes(hit.id)) {
            onSelectionChange(selectedIds.filter((id) => id !== hit.id));
          } else {
            onSelectionChange([...selectedIds, hit.id]);
          }
        } else {
          if (!selectedIds.includes(hit.id)) {
            onSelectionChange([hit.id]);
          }
        }
        setIsDraggingElements(true);
        setElementDragStart(snappedPt);
      } else {
        if (!e.shiftKey) {
          onSelectionChange([]);
        }
        setSelectionBox({
          startX: screenX,
          startY: screenY,
          currentX: screenX,
          currentY: screenY,
        });
      }
      return;
    }

    // Text Tool Click
    if (activeTool === 'text') {
      const newText: TextElement = {
        id: generateId('txt'),
        type: 'text',
        x: snappedPt.x,
        y: snappedPt.y,
        width: 240,
        height: 60,
        text: 'Type note here...',
        fontSize: activeFontSize,
        fontFamily: activeFontFamily,
        fontWeight: 'normal',
        fontStyle: 'normal',
        strokeColor: activeStrokeColor,
        strokeWidth: 1,
        strokeStyle: 'solid',
        opacity: 1,
        zIndex: elements.length + 1,
      };
      playPlaceSound();
      onElementsChange([...elements, newText], true);
      onSelectionChange([newText.id]);
      setEditingTextId(newText.id);
      setEditingContent(newText.text);
      onToolChange('select');
      return;
    }

    // Sticky Memo Click
    if (activeTool === 'sticky') {
      const themes: StickyElement['colorTheme'][] = ['amber', 'emerald', 'cyan', 'purple', 'rose'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      const newSticky: StickyElement = {
        id: generateId('stk'),
        type: 'sticky',
        x: snappedPt.x,
        y: snappedPt.y,
        width: 180,
        height: 180,
        text: 'Write memo...',
        colorTheme: randomTheme,
        strokeColor: '#ca8a04',
        strokeWidth: 1,
        strokeStyle: 'solid',
        opacity: 1,
        zIndex: elements.length + 1,
      };
      playPlaceSound();
      onElementsChange([...elements, newSticky], true);
      onSelectionChange([newSticky.id]);
      setEditingTextId(newSticky.id);
      setEditingContent(newSticky.text);
      onToolChange('select');
      return;
    }

    // Code Snippet Tool Click
    if (activeTool === 'code') {
      const newCode: CodeElement = {
        id: generateId('code'),
        type: 'code',
        x: snappedPt.x,
        y: snappedPt.y,
        width: 320,
        height: 160,
        code: '// Write code snippet\nfunction calculate() {\n  return 42;\n}',
        language: 'typescript',
        title: 'snippet.ts',
        strokeColor: '#38bdf8',
        strokeWidth: 1,
        strokeStyle: 'solid',
        opacity: 1,
        zIndex: elements.length + 1,
      };
      playPlaceSound();
      onElementsChange([...elements, newCode], true);
      onSelectionChange([newCode.id]);
      onToolChange('select');
      return;
    }

    // Freehand Pen / Highlighter / Calligraphy Ink
    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'ink') {
      setIsDrawing(true);
      setCurrentPath([{ ...worldPt, pressure: e.pressure || 0.5 }]);
      return;
    }

    // All Shapes and Lines
    setIsDrawing(true);
    setDragStartPoint(snappedPt);
    setDragCurrentPoint(snappedPt);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    mouseScreenRef.current = { x: screenX, y: screenY };

    // Pinch Zoom + Pan
    if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const currDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const currMidX = (pts[0].x + pts[1].x) / 2;
      const currMidY = (pts[0].y + pts[1].y) / 2;

      const scale = currDist / pinchStartRef.current.dist;
      const targetZoom = clampZoom(pinchStartRef.current.zoom * scale);

      const dx = currMidX - pinchStartRef.current.midX;
      const dy = currMidY - pinchStartRef.current.midY;

      onViewportChange({
        x: pinchStartRef.current.vpX + dx,
        y: pinchStartRef.current.vpY + dy,
        zoom: targetZoom,
      });
      return;
    }

    const worldPt = screenToWorld(screenX, screenY, viewport);
    setMouseCoord(worldPt);

    // Panning
    if (isPanning) {
      onViewportChange({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Laser
    if (activeTool === 'laser' && (e.buttons === 1 || activePointersRef.current.size > 0)) {
      setLaserPoints((prev) => [...prev, { ...worldPt, time: Date.now() }]);
      return;
    }

    // Eraser dragging
    if (activeTool === 'eraser' && e.buttons === 1) {
      eraseAtPoint(worldPt);
      return;
    }

    // Active Resizing Handle Drag
    if (activeResizeHandle && resizeInitialElement && resizeStartPoint) {
      const dx = worldPt.x - resizeStartPoint.x;
      const dy = worldPt.y - resizeStartPoint.y;
      const init = resizeInitialElement;

      let newX = init.x;
      let newY = init.y;
      let newW = init.width;
      let newH = init.height;

      switch (activeResizeHandle) {
        case 'se':
          newW = Math.max(20, init.width + dx);
          newH = Math.max(20, init.height + dy);
          break;
        case 'e':
          newW = Math.max(20, init.width + dx);
          break;
        case 's':
          newH = Math.max(20, init.height + dy);
          break;
        case 'ne':
          newW = Math.max(20, init.width + dx);
          newH = Math.max(20, init.height - dy);
          newY = init.y + init.height - newH;
          break;
        case 'n':
          newH = Math.max(20, init.height - dy);
          newY = init.y + init.height - newH;
          break;
        case 'nw':
          newW = Math.max(20, init.width - dx);
          newH = Math.max(20, init.height - dy);
          newX = init.x + init.width - newW;
          newY = init.y + init.height - newH;
          break;
        case 'w':
          newW = Math.max(20, init.width - dx);
          newX = init.x + init.width - newW;
          break;
        case 'sw':
          newW = Math.max(20, init.width - dx);
          newH = Math.max(20, init.height + dy);
          newX = init.x + init.width - newW;
          break;
      }

      onElementsChange(
        elements.map((el) => {
          if (el.id === init.id) {
            return { ...el, x: newX, y: newY, width: newW, height: newH };
          }
          return el;
        }),
        false
      );
      return;
    }

    // Moving elements
    if (isDraggingElements && elementDragStart) {
      const snappedPt = snapPoint(worldPt, 24, snapEnabled);
      const dx = snappedPt.x - elementDragStart.x;
      const dy = snappedPt.y - elementDragStart.y;

      if (dx !== 0 || dy !== 0) {
        onElementsChange(
          elements.map((el) => {
            if (selectedIds.includes(el.id)) {
              if ('points' in el && Array.isArray((el as any).points)) {
                return {
                  ...el,
                  x: el.x + dx,
                  y: el.y + dy,
                  points: (el as any).points.map((p: Point) => ({ ...p, x: p.x + dx, y: p.y + dy })),
                } as CanvasElement;
              }
              return { ...el, x: el.x + dx, y: el.y + dy };
            }
            return el;
          }),
          false
        );
        setElementDragStart(snappedPt);
      }
      return;
    }

    // Selection box marquee
    if (selectionBox) {
      setSelectionBox({
        ...selectionBox,
        currentX: screenX,
        currentY: screenY,
      });

      const p1 = screenToWorld(selectionBox.startX, selectionBox.startY, viewport);
      const p2 = worldPt;
      const box = {
        x: Math.min(p1.x, p2.x),
        y: Math.min(p1.y, p2.y),
        width: Math.abs(p1.x - p2.x),
        height: Math.abs(p1.y - p2.y),
      };

      const matched = elements.filter((el) => isElementIntersectingBox(el, box)).map((el) => el.id);
      onSelectionChange(matched);
      return;
    }

    // Freehand drawing
    if (isDrawing && (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'ink')) {
      setCurrentPath((prev) => [...prev, { ...worldPt, pressure: e.pressure || 0.5 }]);
      return;
    }

    // Shape / Line drag preview
    if (isDrawing && dragStartPoint) {
      const snappedPt = snapPoint(worldPt, 24, snapEnabled);
      setDragCurrentPoint(snappedPt);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (activeResizeHandle) {
      setActiveResizeHandle(null);
      setResizeInitialElement(null);
      setResizeStartPoint(null);
      return;
    }

    if (isDraggingElements) {
      setIsDraggingElements(false);
      setElementDragStart(null);
      return;
    }

    if (selectionBox) {
      setSelectionBox(null);
      return;
    }

    if (isDrawing) {
      // Freehand Pen / Highlighter / Ink complete
      if ((activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'ink') && currentPath.length > 1) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const p of currentPath) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }

        const isInk = activeTool === 'ink';
        const isHl = activeTool === 'highlighter';

        const newElement: CanvasElement = {
          id: generateId(isHl ? 'hl' : isInk ? 'ink' : 'pen'),
          type: activeTool,
          x: minX,
          y: minY,
          width: Math.max(maxX - minX, 10),
          height: Math.max(maxY - minY, 10),
          points: currentPath,
          strokeColor: activeStrokeColor,
          strokeWidth: isHl ? 18 : isInk ? Math.max(activeStrokeWidth * 1.5, 3) : activeStrokeWidth,
          strokeStyle: 'solid',
          opacity: isHl ? 0.35 : 1,
          isHighlighter: isHl,
          inkStyle: isInk ? 'fountain' : undefined,
          zIndex: elements.length + 1,
        };

        playPlaceSound();
        onElementsChange([...elements, newElement], true);
        onSelectionChange([newElement.id]);
        setCurrentPath([]);
      } else if (dragStartPoint) {
        // Shapes or Lines: Handle both DRAG-TO-SIZE and CLICK-TO-PLACE
        const start = dragStartPoint;
        const curr = dragCurrentPoint || dragStartPoint;
        const dragDist = Math.hypot(curr.x - start.x, curr.y - start.y);

        const isShape = [
          'rect',
          'circle',
          'diamond',
          'star',
          'hexagon',
          'pentagon',
          'speechBubble',
          'cylinder',
          'cloud',
          'heart',
        ].includes(activeTool);

        const isLine = ['line', 'arrow', 'curved', 'stepped', 'doubleArrow'].includes(activeTool);

        let newElement: CanvasElement | null = null;

        if (isShape) {
          // If clicked or dragged very little (< 12px), use standard beautiful dimensions centered on click!
          let x = Math.min(start.x, curr.x);
          let y = Math.min(start.y, curr.y);
          let width = Math.abs(start.x - curr.x);
          let height = Math.abs(start.y - curr.y);

          if (dragDist < 12) {
            const defaultSizes: Record<string, { w: number; h: number }> = {
              rect: { w: 160, h: 100 },
              circle: { w: 120, h: 120 },
              diamond: { w: 130, h: 130 },
              star: { w: 130, h: 130 },
              hexagon: { w: 130, h: 130 },
              pentagon: { w: 130, h: 130 },
              speechBubble: { w: 160, h: 110 },
              cylinder: { w: 130, h: 140 },
              cloud: { w: 160, h: 110 },
              heart: { w: 130, h: 130 },
            };
            const def = defaultSizes[activeTool] || { w: 140, h: 100 };
            width = def.w;
            height = def.h;
            x = start.x - width / 2;
            y = start.y - height / 2;
          } else {
            width = Math.max(width, 24);
            height = Math.max(height, 24);
          }

          newElement = {
            id: generateId('shp'),
            type: activeTool as ShapeElement['type'],
            x,
            y,
            width,
            height,
            strokeColor: activeStrokeColor,
            fillColor: activeFillColor,
            strokeWidth: activeStrokeWidth,
            strokeStyle: 'solid',
            opacity: 1,
            zIndex: elements.length + 1,
          };
        } else if (isLine) {
          let p1 = start;
          let p2 = curr;

          if (dragDist < 12) {
            p2 = { x: start.x + 140, y: start.y };
          }

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          newElement = {
            id: generateId('line'),
            type: activeTool as LineElement['type'],
            x: Math.min(p1.x, p2.x),
            y: Math.min(p1.y, p2.y),
            width: Math.max(Math.abs(dx), 24),
            height: Math.max(Math.abs(dy), 24),
            points: [p1, p2],
            controlPoint: { x: midX, y: midY - Math.min(Math.abs(dx) * 0.4, 50) },
            strokeColor: activeStrokeColor,
            strokeWidth: activeStrokeWidth,
            strokeStyle: 'solid',
            opacity: 1,
            arrowStart: activeTool === 'doubleArrow',
            arrowEnd: activeTool === 'arrow' || activeTool === 'doubleArrow',
            zIndex: elements.length + 1,
          };
        }

        if (newElement) {
          playPlaceSound();
          onElementsChange([...elements, newElement], true);
          onSelectionChange([newElement.id]);
          onToolChange('select');
        }
      }

      setIsDrawing(false);
      setDragStartPoint(null);
      setDragCurrentPoint(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPt = screenToWorld(screenX, screenY, viewport);

    const hit = [...elements].reverse().find((el) => isPointInElement(worldPt, el));
    if (hit && (hit.type === 'text' || hit.type === 'sticky' || hit.type === 'code')) {
      setEditingTextId(hit.id);
      if (hit.type === 'text' || hit.type === 'sticky') {
        setEditingContent(hit.text);
      } else if (hit.type === 'code') {
        setEditingContent(hit.code);
      }
    }
  };

  const eraseAtPoint = (pt: Point) => {
    const hitIndex = elements.findIndex((el) => isPointInElement(pt, el));
    if (hitIndex !== -1) {
      playDeleteSound();
      const updated = [...elements];
      updated.splice(hitIndex, 1);
      onElementsChange(updated, true);
    }
  };

  const finishEditingText = () => {
    if (!editingTextId) return;

    onElementsChange(
      elements.map((el) => {
        if (el.id === editingTextId) {
          if (el.type === 'text' || el.type === 'sticky') {
            return { ...el, text: editingContent };
          }
          if (el.type === 'code') {
            return { ...el, code: editingContent };
          }
        }
        return el;
      }),
      true
    );

    setEditingTextId(null);
    setEditingContent('');
  };

  const editingElement = elements.find((el) => el.id === editingTextId);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none touch-none cursor-crosshair"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      style={{
        cursor:
          isPanning || isSpacePressed || activeTool === 'hand'
            ? 'grab'
            : activeTool === 'select'
            ? 'default'
            : activeTool === 'eraser'
            ? 'cell'
            : 'crosshair',
      }}
    >
      {/* 1. Background Theme Canvas (Moving Stars, Cosmic Gradients, Twinkling Halos) */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

      {/* 2. Main High-Performance Foreground Canvas (Math Grid, Shapes, Lines, Text, Tools) */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

      {/* Floating Coordinate & Interactive Zoom Buttons in Bottom-Left */}
      <div
        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 select-none"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Coordinate pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-400 shadow-xl">
          <span className="text-cyan-400">X: {Math.round(mouseCoord.x)}</span>
          <span className="text-cyan-400">Y: {Math.round(mouseCoord.y)}</span>
          <span className="text-slate-600">|</span>
          <span className="capitalize text-slate-300">{gridType}</span>
        </div>

        {/* Interactive Zoom Buttons Widget */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl bg-black/85 backdrop-blur-xl border border-white/10 shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onZoomOut) onZoomOut();
              else onViewportChange({ ...viewport, zoom: Math.max(0.1, Math.round(viewport.zoom * 0.85 * 100) / 100) });
            }}
            title="Zoom Out (-) [Click or Key -]"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onZoomReset) onZoomReset();
              else onViewportChange({ ...viewport, zoom: 1.0 });
            }}
            title="Reset Zoom to 100% [Click or Key 0]"
            className="px-2 py-1 rounded-lg text-xs font-mono font-semibold text-cyan-400 hover:bg-white/10 transition-colors"
          >
            {Math.round(viewport.zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onZoomIn) onZoomIn();
              else onViewportChange({ ...viewport, zoom: Math.min(5.0, Math.round(viewport.zoom * 1.15 * 100) / 100) });
            }}
            title="Zoom In (+) [Click or Key +]"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {onFitToContent && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFitToContent();
              }}
              title="Fit to Screen [Frame All Elements]"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Text / Note Editor Overlay */}
      {editingElement && (
        <div
          className="absolute z-30"
          style={{
            left: `${editingElement.x * viewport.zoom + viewport.x}px`,
            top: `${editingElement.y * viewport.zoom + viewport.y}px`,
            width: `${Math.max(editingElement.width * viewport.zoom, 220)}px`,
          }}
        >
          <textarea
            autoFocus
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck={true}
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            onBlur={finishEditingText}
            onKeyDown={(e) => {
              if (e.key === 'Escape') finishEditingText();
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) finishEditingText();
            }}
            className="w-full min-h-[90px] p-3 text-sm rounded-xl bg-black/95 text-white border-2 border-cyan-400 shadow-2xl focus:outline-none resize"
            style={{
              fontSize: `${Math.max((editingElement as any).fontSize || 16, 14)}px`,
              fontFamily: (editingElement as any).fontFamily || 'Plus Jakarta Sans',
            }}
          />
          <div className="text-[10px] text-slate-400 mt-1 flex justify-between bg-black/80 px-2 py-0.5 rounded">
            <span>Press Ctrl+Enter to save</span>
            <span>Esc to exit</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Canvas Helper: High-Contrast Infinite Grid Supporting 11 Modes
function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: Viewport,
  gridType: GridType,
  backgroundTheme: BackgroundTheme = 'amoled'
) {
  const zoom = viewport.zoom;
  const baseSize = 24 * zoom;
  if (baseSize < 5) return;

  const startX = (viewport.x % baseSize) - baseSize;
  const startY = (viewport.y % baseSize) - baseSize;

  ctx.save();

  const isPaper = backgroundTheme === 'paper' || backgroundTheme === 'parchment';
  const isBlueprint = backgroundTheme === 'blueprint';
  const isChalkboard = backgroundTheme === 'chalkboard';

  // 1. Math Grid (French & English 5mm Graph Paper with Major 5x5 Lines & Red Margin Line)
  if (gridType === 'math' || gridType === 'engineering') {
    // Fine Grid Lines (High Contrast & Crisp)
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = isPaper
      ? 'rgba(37, 99, 235, 0.22)'
      : isBlueprint
      ? 'rgba(56, 189, 248, 0.22)'
      : isChalkboard
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(56, 189, 248, 0.15)'; // Highly visible cyan on dark AMOLED / Cosmos

    ctx.beginPath();
    for (let x = startX; x <= width + baseSize; x += baseSize) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = startY; y <= height + baseSize; y += baseSize) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();

    // Major 5x5 Block Lines (Heavy Contrast Accent Lines)
    const majorSize = baseSize * 5;
    const majorStartX = (viewport.x % majorSize) - majorSize;
    const majorStartY = (viewport.y % majorSize) - majorSize;

    ctx.lineWidth = 1.3;
    ctx.strokeStyle = isPaper
      ? 'rgba(29, 78, 216, 0.45)'
      : isBlueprint
      ? 'rgba(56, 189, 248, 0.45)'
      : 'rgba(99, 102, 241, 0.38)';

    ctx.beginPath();
    for (let x = majorStartX; x <= width + majorSize; x += majorSize) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = majorStartY; y <= height + majorSize; y += majorSize) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();

    // Vertical Red Margin Rule (Classic French / Math graph paper margin line!)
    const marginScreenX = Math.round(viewport.x + 90 * zoom) + 0.5;
    if (marginScreenX >= 0 && marginScreenX <= width) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isPaper ? 'rgba(239, 68, 68, 0.75)' : 'rgba(244, 63, 94, 0.65)';
      ctx.beginPath();
      ctx.moveTo(marginScreenX, 0);
      ctx.lineTo(marginScreenX, height);
      ctx.stroke();
    }
  } else if (gridType === 'dots') {
    ctx.fillStyle = isPaper
      ? 'rgba(15, 23, 42, 0.45)'
      : isBlueprint
      ? 'rgba(56, 189, 248, 0.45)'
      : 'rgba(255, 255, 255, 0.28)';

    for (let x = startX; x <= width + baseSize; x += baseSize) {
      for (let y = startY; y <= height + baseSize; y += baseSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridType === 'cross') {
    ctx.strokeStyle = isPaper ? 'rgba(37, 99, 235, 0.38)' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    const tick = 4;
    ctx.beginPath();
    for (let x = startX; x <= width + baseSize; x += baseSize) {
      for (let y = startY; y <= height + baseSize; y += baseSize) {
        ctx.moveTo(x - tick, y);
        ctx.lineTo(x + tick, y);
        ctx.moveTo(x, y - tick);
        ctx.lineTo(x, y + tick);
      }
    }
    ctx.stroke();
  } else if (gridType === 'isometric') {
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = isPaper ? 'rgba(37, 99, 235, 0.2)' : 'rgba(99, 102, 241, 0.22)';
    const isoSize = baseSize * 1.5;
    ctx.beginPath();
    for (let x = -width; x <= width * 2; x += isoSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height * Math.tan(Math.PI / 6), height);
      ctx.moveTo(x, 0);
      ctx.lineTo(x - height * Math.tan(Math.PI / 6), height);
    }
    for (let y = startY; y <= height + isoSize; y += isoSize * 0.866) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();
  } else if (gridType === 'hex') {
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = isPaper ? 'rgba(37, 99, 235, 0.24)' : 'rgba(56, 189, 248, 0.22)';
    const r = baseSize * 0.8;
    const hexH = r * Math.sqrt(3);
    for (let x = startX; x <= width + r * 3; x += r * 3) {
      for (let y = startY; y <= height + hexH; y += hexH) {
        drawHexagonPath(ctx, x, y, r);
        drawHexagonPath(ctx, x + r * 1.5, y + hexH / 2, r);
      }
    }
    ctx.stroke();
  } else if (gridType === 'polar') {
    const cx = viewport.x;
    const cy = viewport.y;
    ctx.strokeStyle = isPaper ? 'rgba(37, 99, 235, 0.28)' : 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    const maxR = Math.hypot(width, height) * 1.5;
    for (let rad = baseSize * 2; rad <= maxR; rad += baseSize * 2) {
      ctx.moveTo(cx + rad, cy);
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
    }
    ctx.stroke();
  } else if (gridType === 'cornell') {
    const cueX = Math.round(viewport.x + 240 * zoom);
    const summaryY = Math.round(viewport.y + 700 * zoom);

    ctx.lineWidth = 1.4;
    ctx.strokeStyle = isPaper ? 'rgba(29, 78, 216, 0.55)' : 'rgba(99, 102, 241, 0.55)';

    ctx.beginPath();
    if (cueX >= 0 && cueX <= width) {
      ctx.moveTo(cueX, 0);
      ctx.lineTo(cueX, height);
    }
    if (summaryY >= 0 && summaryY <= height) {
      ctx.moveTo(0, summaryY);
      ctx.lineTo(width, summaryY);
    }
    ctx.stroke();

    ctx.lineWidth = 0.7;
    ctx.strokeStyle = isPaper ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    for (let y = startY; y <= height + baseSize; y += baseSize * 1.2) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();
  } else if (gridType === 'ruled') {
    ctx.lineWidth = 0.85;
    ctx.strokeStyle = isPaper ? 'rgba(37, 99, 235, 0.28)' : 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    for (let y = startY; y <= height + baseSize; y += baseSize * 1.2) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();

    // Red Margin Line
    const marginScreenX = Math.round(viewport.x + 90 * zoom) + 0.5;
    if (marginScreenX >= 0 && marginScreenX <= width) {
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = isPaper ? 'rgba(239, 68, 68, 0.7)' : 'rgba(244, 63, 94, 0.6)';
      ctx.beginPath();
      ctx.moveTo(marginScreenX, 0);
      ctx.lineTo(marginScreenX, height);
      ctx.stroke();
    }
  } else if (gridType === 'music') {
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = isPaper ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.25)';
    const staveGap = 8 * zoom;
    const systemGap = 48 * zoom;
    const totalStaveHeight = staveGap * 4;

    for (let sysY = startY; sysY <= height + systemGap; sysY += totalStaveHeight + systemGap) {
      ctx.beginPath();
      for (let line = 0; line < 5; line++) {
        const y = Math.round(sysY + line * staveGap) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      ctx.lineWidth = 1.1;
      ctx.beginPath();
      const measureWidth = 140 * zoom;
      for (let barX = startX; barX <= width + measureWidth; barX += measureWidth) {
        ctx.moveTo(Math.round(barX) + 0.5, Math.round(sysY) + 0.5);
        ctx.lineTo(Math.round(barX) + 0.5, Math.round(sysY + totalStaveHeight) + 0.5);
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawHexagonPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.moveTo(x + r, y);
  for (let i = 1; i <= 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
  }
}

// 8-Direction Resize Handle Utilities
function getResizeHandlePoints(el: CanvasElement) {
  const b = getElementBounds(el);
  const midX = (b.minX + b.maxX) / 2;
  const midY = (b.minY + b.maxY) / 2;
  return {
    nw: { x: b.minX, y: b.minY },
    n: { x: midX, y: b.minY },
    ne: { x: b.maxX, y: b.minY },
    e: { x: b.maxX, y: midY },
    se: { x: b.maxX, y: b.maxY },
    s: { x: midX, y: b.maxY },
    sw: { x: b.minX, y: b.maxY },
    w: { x: b.minX, y: midY },
  };
}

function getHitResizeHandle(worldPt: Point, el: CanvasElement, zoom: number): ResizeHandle | null {
  const handles = getResizeHandlePoints(el);
  const hitRadius = 9 / zoom;
  for (const [key, pt] of Object.entries(handles)) {
    if (Math.hypot(worldPt.x - pt.x, worldPt.y - pt.y) <= hitRadius) {
      return key as ResizeHandle;
    }
  }
  return null;
}

function renderResizeHandles(ctx: CanvasRenderingContext2D, el: CanvasElement, zoom: number) {
  const handles = getResizeHandlePoints(el);
  const size = 8 / zoom;

  ctx.save();
  for (const pt of Object.values(handles)) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.6 / zoom;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4 / zoom;
    ctx.fillRect(pt.x - size / 2, pt.y - size / 2, size, size);
    ctx.strokeRect(pt.x - size / 2, pt.y - size / 2, size, size);
  }
  ctx.restore();
}

// Canvas Helper: Render Individual Element
function renderElement(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isSelected: boolean,
  backgroundTheme: BackgroundTheme = 'amoled'
) {
  const isPaper = backgroundTheme === 'paper' || backgroundTheme === 'parchment';
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;

  let effectiveStroke = el.strokeColor || (isPaper ? '#0f172a' : '#ffffff');
  if (isPaper && (effectiveStroke.toLowerCase() === '#ffffff' || effectiveStroke.toLowerCase() === '#fff')) {
    effectiveStroke = '#0f172a';
  }

  ctx.strokeStyle = effectiveStroke;
  ctx.lineWidth = el.strokeWidth || 2;

  if (el.strokeStyle === 'dashed') ctx.setLineDash([8, 6]);
  if (el.strokeStyle === 'dotted') ctx.setLineDash([3, 3]);

  if (el.glow && !isPaper) {
    ctx.shadowColor = el.glowColor || el.strokeColor || '#6366f1';
    ctx.shadowBlur = 14;
  }

  // --- 1. SHAPES ---
  if (el.type === 'rect') {
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fillRect(el.x, el.y, el.width, el.height);
    }
    ctx.strokeRect(el.x, el.y, el.width, el.height);
  } else if (el.type === 'circle') {
    const rx = el.width / 2;
    const ry = el.height / 2;
    const cx = el.x + rx;
    const cy = el.y + ry;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  } else if (el.type === 'diamond') {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.beginPath();
    ctx.moveTo(cx, el.y);
    ctx.lineTo(el.x + el.width, cy);
    ctx.lineTo(cx, el.y + el.height);
    ctx.lineTo(el.x, cy);
    ctx.closePath();
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  } else if (el.type === 'star') {
    drawStarPath(ctx, el.x + el.width / 2, el.y + el.height / 2, 5, el.width / 2, el.width / 4);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  } else if (el.type === 'hexagon') {
    drawPolygonPath(ctx, el.x + el.width / 2, el.y + el.height / 2, 6, Math.min(el.width, el.height) / 2);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  } else if (el.type === 'pentagon') {
    drawPolygonPath(ctx, el.x + el.width / 2, el.y + el.height / 2, 5, Math.min(el.width, el.height) / 2);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  } else if (el.type === 'speechBubble') {
    drawSpeechBubblePath(ctx, el.x, el.y, el.width, el.height);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  } else if (el.type === 'cylinder') {
    drawCylinderPath(ctx, el.x, el.y, el.width, el.height);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  } else if (el.type === 'cloud') {
    drawCloudPath(ctx, el.x, el.y, el.width, el.height);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  } else if (el.type === 'heart') {
    drawHeartPath(ctx, el.x, el.y, el.width, el.height);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }

  // --- 2. LINES & CONNECTORS ---
  else if (
    el.type === 'line' ||
    el.type === 'arrow' ||
    el.type === 'curved' ||
    el.type === 'stepped' ||
    el.type === 'doubleArrow'
  ) {
    const p1 = el.points[0];
    const p2 = el.points[1];

    ctx.beginPath();
    if (el.type === 'curved') {
      const cp = el.controlPoint || {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2 - 40,
      };
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y);
    } else if (el.type === 'stepped') {
      const midX = (p1.x + p2.x) / 2;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(midX, p1.y);
      ctx.lineTo(midX, p2.y);
      ctx.lineTo(p2.x, p2.y);
    } else {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    if (el.type === 'arrow' || el.arrowEnd || el.type === 'doubleArrow') {
      drawArrowHead(ctx, p1, p2, effectiveStroke);
    }
    if (el.type === 'doubleArrow' || el.arrowStart) {
      drawArrowHead(ctx, p2, p1, effectiveStroke);
    }
  }

  // --- 3. FREEHAND PEN / HIGHLIGHTER / CALLIGRAPHY INK ---
  else if (el.type === 'pen' || el.type === 'highlighter' || el.type === 'ink') {
    if (el.points && el.points.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'ink') {
        for (let i = 1; i < el.points.length; i++) {
          const prev = el.points[i - 1];
          const curr = el.points[i];
          const pressure = curr.pressure || 0.6;
          ctx.lineWidth = Math.max(1.5, (el.strokeWidth || 3) * pressure * 1.5);
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      }
    }
  }

  // --- 4. STICKY NOTE ---
  else if (el.type === 'sticky') {
    const paperThemes: Record<string, { bg: string; text: string; header: string; stroke: string }> = {
      amber: { bg: '#fef08a', text: '#713f12', header: '#fde047', stroke: '#ca8a04' },
      emerald: { bg: '#bbf7d0', text: '#14532d', header: '#86efac', stroke: '#16a34a' },
      cyan: { bg: '#bae6fd', text: '#0c4a6e', header: '#7dd3fc', stroke: '#0284c7' },
      purple: { bg: '#e9d5ff', text: '#581c87', header: '#d8b4fe', stroke: '#9333ea' },
      rose: { bg: '#fecdd3', text: '#881337', header: '#fda4af', stroke: '#e11d48' },
      slate: { bg: '#e2e8f0', text: '#1e293b', header: '#cbd5e1', stroke: '#64748b' },
    };
    const theme = paperThemes[el.colorTheme] || paperThemes.amber;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = isPaper ? theme.bg : '#1e1b4b';
    ctx.fillRect(el.x, el.y, el.width, el.height);

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = theme.stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(el.x, el.y, el.width, el.height);

    // Header adhesive tape strip
    ctx.fillStyle = theme.header;
    ctx.fillRect(el.x, el.y, el.width, 22);

    ctx.fillStyle = isPaper ? theme.text : '#f8fafc';
    ctx.font = '14px "Caveat", "Plus Jakarta Sans", sans-serif';
    renderMultiline(ctx, el.text, el.x + 14, el.y + 44, el.width - 28, 20);
  }

  // --- 5. CODE BLOCK ---
  else if (el.type === 'code') {
    ctx.fillStyle = isPaper ? '#ffffff' : '#09090b';
    ctx.fillRect(el.x, el.y, el.width, el.height);
    ctx.strokeStyle = isPaper ? '#cbd5e1' : '#27272a';
    ctx.strokeRect(el.x, el.y, el.width, el.height);

    ctx.fillStyle = isPaper ? '#f1f5f9' : '#18181b';
    ctx.fillRect(el.x, el.y, el.width, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(el.title || el.language || 'snippet', el.x + 12, el.y + 19);

    ctx.fillStyle = isPaper ? '#0f172a' : '#e2e8f0';
    ctx.font = '13px "JetBrains Mono", monospace';
    renderMultiline(ctx, el.code, el.x + 12, el.y + 50, el.width - 24, 18);
  }

  // --- 6. RICH TEXT ---
  else if (el.type === 'text') {
    const weight = el.fontWeight === 'bold' || el.fontWeight === '800' ? 'bold ' : '';
    const style = el.fontStyle === 'italic' ? 'italic ' : '';
    let textColor = el.strokeColor || (isPaper ? '#0f172a' : '#ffffff');
    if (isPaper && (textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === '#fff')) {
      textColor = '#0f172a';
    }
    ctx.fillStyle = textColor;
    ctx.font = `${style}${weight}${el.fontSize || 18}px "${el.fontFamily || 'Plus Jakarta Sans'}", sans-serif`;
    renderMultiline(ctx, el.text, el.x, el.y + (el.fontSize || 18), el.width, (el.fontSize || 18) * 1.35);
  }

  // Draw Selection Bounding Box & Halo if Selected
  if (isSelected) {
    const bounds = getElementBounds(el);
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -((Date.now() * 0.015) % 11);
    ctx.strokeRect(bounds.minX - 5, bounds.minY - 5, bounds.width + 10, bounds.height + 10);
    ctx.restore();
  }

  ctx.restore();
}

// Shape Drawing Helper Routines
function drawArrowHead(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLength = 14;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStarPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerR;
    let y = cy + Math.sin(rot) * outerR;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerR;
    y = cy + Math.sin(rot) * innerR;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

function drawPolygonPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, sides: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawSpeechBubblePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 12;
  const bubbleH = h * 0.8;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + bubbleH - r);
  ctx.quadraticCurveTo(x + w, y + bubbleH, x + w - r, y + bubbleH);
  // Tail
  ctx.lineTo(x + 40, y + bubbleH);
  ctx.lineTo(x + 15, y + h);
  ctx.lineTo(x + 25, y + bubbleH);
  ctx.lineTo(x + r, y + bubbleH);
  ctx.quadraticCurveTo(x, y + bubbleH, x, y + bubbleH - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCylinderPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const rx = w / 2;
  const ry = Math.min(18, h * 0.2);
  const cx = x + rx;
  ctx.beginPath();
  ctx.ellipse(cx, y + h - ry, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(x, y + ry);
  ctx.ellipse(cx, y + ry, rx, ry, 0, Math.PI, 0);
  ctx.lineTo(x + w, y + h - ry);
  ctx.moveTo(cx + rx, y + ry);
  ctx.ellipse(cx, y + ry, rx, ry, 0, 0, Math.PI * 2);
}

function drawCloudPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  const rx = w / 6;
  ctx.moveTo(x + rx * 2, y + h * 0.7);
  ctx.arc(x + rx * 1.5, y + h * 0.6, rx * 1.2, Math.PI * 0.8, Math.PI * 1.8);
  ctx.arc(x + rx * 3, y + h * 0.4, rx * 1.5, Math.PI * 1.1, Math.PI * 1.9);
  ctx.arc(x + rx * 4.5, y + h * 0.55, rx * 1.3, Math.PI * 1.3, Math.PI * 0.2);
  ctx.arc(x + rx * 3.5, y + h * 0.75, rx * 1.2, 0, Math.PI * 0.9);
  ctx.closePath();
}

function drawHeartPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const topCurveHeight = h * 0.3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y + (h + topCurveHeight) / 2, x + w / 2, y + (h + topCurveHeight) / 1.4, x + w / 2, y + h);
  ctx.bezierCurveTo(x + w / 2, y + (h + topCurveHeight) / 1.4, x + w, y + (h + topCurveHeight) / 2, x + w, y + topCurveHeight);
  ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + topCurveHeight);
  ctx.closePath();
}

function renderShapePreview(
  ctx: CanvasRenderingContext2D,
  tool: ToolType,
  start: Point,
  curr: Point,
  strokeColor: string,
  fillColor: string,
  strokeWidth: number
) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidth;

  const minX = Math.min(start.x, curr.x);
  const minY = Math.min(start.y, curr.y);
  const w = Math.max(Math.abs(start.x - curr.x), 5);
  const h = Math.max(Math.abs(start.y - curr.y), 5);

  if (tool === 'rect') {
    if (fillColor && fillColor !== 'transparent') ctx.fillRect(minX, minY, w, h);
    ctx.strokeRect(minX, minY, w, h);
  } else if (tool === 'circle') {
    ctx.beginPath();
    ctx.ellipse(minX + w / 2, minY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(minX + w / 2, minY);
    ctx.lineTo(minX + w, minY + h / 2);
    ctx.lineTo(minX + w / 2, minY + h);
    ctx.lineTo(minX, minY + h / 2);
    ctx.closePath();
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'star') {
    drawStarPath(ctx, minX + w / 2, minY + h / 2, 5, w / 2, w / 4);
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'hexagon') {
    drawPolygonPath(ctx, minX + w / 2, minY + h / 2, 6, Math.min(w, h) / 2);
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'pentagon') {
    drawPolygonPath(ctx, minX + w / 2, minY + h / 2, 5, Math.min(w, h) / 2);
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'speechBubble') {
    drawSpeechBubblePath(ctx, minX, minY, w, h);
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'cylinder') {
    drawCylinderPath(ctx, minX, minY, w, h);
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'cloud') {
    drawCloudPath(ctx, minX, minY, w, h);
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'heart') {
    drawHeartPath(ctx, minX, minY, w, h);
    if (fillColor && fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (tool === 'line' || tool === 'arrow' || tool === 'doubleArrow' || tool === 'curved' || tool === 'stepped') {
    ctx.beginPath();
    if (tool === 'curved') {
      const cp = { x: (start.x + curr.x) / 2, y: (start.y + curr.y) / 2 - 40 };
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(cp.x, cp.y, curr.x, curr.y);
    } else if (tool === 'stepped') {
      const midX = (start.x + curr.x) / 2;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(midX, start.y);
      ctx.lineTo(midX, curr.y);
      ctx.lineTo(curr.x, curr.y);
    } else {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(curr.x, curr.y);
    }
    ctx.stroke();

    if (tool === 'arrow' || tool === 'doubleArrow') {
      drawArrowHead(ctx, start, curr, strokeColor);
    }
    if (tool === 'doubleArrow') {
      drawArrowHead(ctx, curr, start, strokeColor);
    }
  }

  ctx.restore();
}

function renderMultiline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const lines = text.split('\n');
  let currentY = y;
  for (const line of lines) {
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && currentLine) {
        ctx.fillText(currentLine, x, currentY);
        currentLine = word;
        currentY += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      ctx.fillText(currentLine, x, currentY);
      currentY += lineHeight;
    }
  }
}
