import { CanvasElement, NoteItem, Point, Viewport } from '../types';

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: Viewport
): Point {
  return {
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: Viewport
): Point {
  return {
    x: worldX * viewport.zoom + viewport.x,
    y: worldY * viewport.zoom + viewport.y,
  };
}

export function snapToGrid(val: number, gridSize = 24, enabled = true): number {
  if (!enabled || gridSize <= 0) return val;
  return Math.round(val / gridSize) * gridSize;
}

export function snapPoint(
  pt: Point,
  gridSize = 24,
  enabled = true
): Point {
  return {
    x: snapToGrid(pt.x, gridSize, enabled),
    y: snapToGrid(pt.y, gridSize, enabled),
    pressure: pt.pressure,
  };
}

export function clampZoom(zoom: number, min = 0.1, max = 5.0): number {
  return Math.max(min, Math.min(max, Math.round(zoom * 100) / 100));
}

export function getElementBounds(el: CanvasElement): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (el.type === 'pen' || el.type === 'highlighter' || el.type === 'ink') {
    if (!el.points || el.points.length === 0) {
      return {
        minX: el.x,
        minY: el.y,
        maxX: el.x + el.width,
        maxY: el.y + el.height,
        width: Math.max(el.width, 10),
        height: Math.max(el.height, 10),
      };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of el.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = el.strokeWidth || 4;
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: Math.max(20, maxX - minX + pad * 2),
      height: Math.max(20, maxY - minY + pad * 2),
    };
  }

  if (
    el.type === 'line' ||
    el.type === 'arrow' ||
    el.type === 'curved' ||
    el.type === 'stepped' ||
    el.type === 'doubleArrow'
  ) {
    const p1 = el.points[0];
    const p2 = el.points[1];
    let minX = Math.min(p1.x, p2.x);
    let minY = Math.min(p1.y, p2.y);
    let maxX = Math.max(p1.x, p2.x);
    let maxY = Math.max(p1.y, p2.y);
    if (el.controlPoint) {
      minX = Math.min(minX, el.controlPoint.x);
      minY = Math.min(minY, el.controlPoint.y);
      maxX = Math.max(maxX, el.controlPoint.x);
      maxY = Math.max(maxY, el.controlPoint.y);
    }
    const pad = 12;
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: Math.max(20, maxX - minX + pad * 2),
      height: Math.max(20, maxY - minY + pad * 2),
    };
  }

  return {
    minX: el.x,
    minY: el.y,
    maxX: el.x + el.width,
    maxY: el.y + el.height,
    width: el.width,
    height: el.height,
  };
}

export function getMultiElementBounds(elements: CanvasElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} | null {
  if (elements.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const b = getElementBounds(el);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function isPointInElement(pt: Point, el: CanvasElement): boolean {
  const b = getElementBounds(el);
  const pad = 6;
  if (
    pt.x < b.minX - pad ||
    pt.x > b.maxX + pad ||
    pt.y < b.minY - pad ||
    pt.y > b.maxY + pad
  ) {
    return false;
  }

  if (el.type === 'circle') {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const rx = el.width / 2;
    const ry = el.height / 2;
    if (rx <= 0 || ry <= 0) return false;
    const norm = Math.pow((pt.x - cx) / rx, 2) + Math.pow((pt.y - cy) / ry, 2);
    return norm <= 1.05;
  }

  if (
    el.type === 'line' ||
    el.type === 'arrow' ||
    el.type === 'curved' ||
    el.type === 'stepped' ||
    el.type === 'doubleArrow'
  ) {
    const p1 = el.points[0];
    const p2 = el.points[1];
    const dist = distanceToSegment(pt, p1, p2);
    return dist <= Math.max(el.strokeWidth * 2, 10);
  }

  return true;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2);
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

export function isElementIntersectingBox(
  el: CanvasElement,
  box: { x: number; y: number; width: number; height: number }
): boolean {
  const elBounds = getElementBounds(el);
  const boxMinX = Math.min(box.x, box.x + box.width);
  const boxMaxX = Math.max(box.x, box.x + box.width);
  const boxMinY = Math.min(box.y, box.y + box.height);
  const boxMaxY = Math.max(box.y, box.y + box.height);

  return !(
    elBounds.maxX < boxMinX ||
    elBounds.minX > boxMaxX ||
    elBounds.maxY < boxMinY ||
    elBounds.minY > boxMaxY
  );
}

export function fuzzySearchNotes(notes: NoteItem[], query: string): NoteItem[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return notes;

  return notes.filter((note) => {
    if (note.title.toLowerCase().includes(cleanQ)) return true;
    if (note.tags.some((t) => t.toLowerCase().includes(cleanQ))) return true;

    // Check inner text or sticky notes or code
    for (const el of note.elements) {
      if (el.type === 'text' && el.text.toLowerCase().includes(cleanQ)) return true;
      if (el.type === 'sticky' && el.text.toLowerCase().includes(cleanQ)) return true;
      if (el.type === 'code' && (el.code.toLowerCase().includes(cleanQ) || (el.title && el.title.toLowerCase().includes(cleanQ)))) return true;
    }
    return false;
  });
}

export function generateId(prefix = 'el'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
