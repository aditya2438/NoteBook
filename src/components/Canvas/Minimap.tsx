import React, { useRef, useEffect } from 'react';
import { CanvasElement, Viewport } from '../../types';
import { getMultiElementBounds } from '../../utils/canvasMath';

interface MinimapProps {
  elements: CanvasElement[];
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  elements,
  viewport,
  onViewportChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 160;
    const height = 110;
    canvas.width = width;
    canvas.height = height;

    // AMOLED Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const bounds = getMultiElementBounds(elements);
    const minX = bounds ? Math.min(bounds.minX, -200) : -400;
    const minY = bounds ? Math.min(bounds.minY, -200) : -300;
    const maxX = bounds ? Math.max(bounds.maxX, 800) : 1200;
    const maxY = bounds ? Math.max(bounds.maxY, 600) : 900;

    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const scale = Math.min((width - 20) / worldW, (height - 20) / worldH);

    const toMiniX = (wx: number) => 10 + (wx - minX) * scale;
    const toMiniY = (wy: number) => 10 + (wy - minY) * scale;

    // Draw elements miniature shapes
    for (const el of elements) {
      ctx.fillStyle = el.strokeColor || '#6366f1';
      ctx.globalAlpha = 0.7;

      const mx = toMiniX(el.x);
      const my = toMiniY(el.y);
      const mw = Math.max(el.width * scale, 3);
      const mh = Math.max(el.height * scale, 3);

      if (el.type === 'circle') {
        ctx.beginPath();
        ctx.arc(mx + mw / 2, my + mh / 2, Math.max(mw / 2, 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(mx, my, mw, mh);
      }
    }

    // Draw Viewport Camera Frustum
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const viewWorldX = -viewport.x / viewport.zoom;
    const viewWorldY = -viewport.y / viewport.zoom;
    const viewWorldW = screenW / viewport.zoom;
    const viewWorldH = screenH / viewport.zoom;

    const vx = toMiniX(viewWorldX);
    const vy = toMiniY(viewWorldY);
    const vw = viewWorldW * scale;
    const vh = viewWorldH * scale;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(vx, vy, vw, vh);
    ctx.strokeRect(vx, vy, vw, vh);
  }, [elements, viewport]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const bounds = getMultiElementBounds(elements);
    const minX = bounds ? Math.min(bounds.minX, -200) : -400;
    const minY = bounds ? Math.min(bounds.minY, -200) : -300;
    const maxX = bounds ? Math.max(bounds.maxX, 800) : 1200;
    const maxY = bounds ? Math.max(bounds.maxY, 600) : 900;

    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const scale = Math.min((160 - 20) / worldW, (110 - 20) / worldH);

    const targetWorldX = minX + (clickX - 10) / scale;
    const targetWorldY = minY + (clickY - 10) / scale;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    onViewportChange({
      ...viewport,
      x: screenW / 2 - targetWorldX * viewport.zoom,
      y: screenH / 2 - targetWorldY * viewport.zoom,
    });
  };

  return (
    <div className="absolute bottom-4 right-4 z-20 overflow-hidden rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl p-1.5 flex flex-col gap-1 select-none">
      <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
        <span>RADAR MAP</span>
        <span className="text-indigo-400">{elements.length} items</span>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="rounded-lg cursor-pointer border border-white/5 hover:border-indigo-500/30 transition-colors"
        title="Click to jump viewport"
      />
    </div>
  );
};
