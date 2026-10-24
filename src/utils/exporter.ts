import { CanvasElement, NoteItem, Viewport } from '../types';
import { getMultiElementBounds } from './canvasMath';

export async function exportCanvasToPng(
  elements: CanvasElement[],
  viewport: Viewport,
  scale = 2,
  includeBackground = true
): Promise<string> {
  const bounds = getMultiElementBounds(elements);
  const width = bounds ? Math.max(bounds.width + 160, 800) : 1200;
  const height = bounds ? Math.max(bounds.height + 160, 800) : 800;
  const offsetX = bounds ? -bounds.minX + 80 : 0;
  const offsetY = bounds ? -bounds.minY + 80 : 0;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  ctx.scale(scale, scale);

  // Background
  if (includeBackground) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Subtle Math Grid
    ctx.lineWidth = 0.5;
    const gridSize = 24;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Major grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    for (let x = 0; x <= width; x += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Draw Elements
  for (const el of elements) {
    ctx.save();
    const x = el.x + offsetX;
    const y = el.y + offsetY;

    ctx.globalAlpha = el.opacity ?? 1;
    ctx.strokeStyle = el.strokeColor || '#ffffff';
    ctx.lineWidth = el.strokeWidth || 2;
    if (el.strokeStyle === 'dashed') ctx.setLineDash([8, 6]);
    if (el.strokeStyle === 'dotted') ctx.setLineDash([3, 3]);

    if (el.glow) {
      ctx.shadowColor = el.glowColor || el.strokeColor || '#6366f1';
      ctx.shadowBlur = 12;
    }

    if (el.type === 'rect') {
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fillRect(x, y, el.width, el.height);
      }
      ctx.strokeRect(x, y, el.width, el.height);
    } else if (el.type === 'circle') {
      const rx = el.width / 2;
      const ry = el.height / 2;
      const cx = x + rx;
      const cy = y + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === 'diamond') {
      const cx = x + el.width / 2;
      const cy = y + el.height / 2;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x + el.width, cy);
      ctx.lineTo(cx, y + el.height);
      ctx.lineTo(x, cy);
      ctx.closePath();
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === 'star') {
      drawStarPath(ctx, x + el.width / 2, y + el.height / 2, 5, el.width / 2, el.width / 4);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === 'hexagon') {
      drawPolygonPath(ctx, x + el.width / 2, y + el.height / 2, 6, Math.min(el.width, el.height) / 2);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === 'pentagon') {
      drawPolygonPath(ctx, x + el.width / 2, y + el.height / 2, 5, Math.min(el.width, el.height) / 2);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === 'speechBubble') {
      drawSpeechBubblePath(ctx, x, y, el.width, el.height);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === 'cylinder') {
      drawCylinderPath(ctx, x, y, el.width, el.height);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === 'cloud') {
      drawCloudPath(ctx, x, y, el.width, el.height);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === 'heart') {
      drawHeartPath(ctx, x, y, el.width, el.height);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (
      el.type === 'line' ||
      el.type === 'arrow' ||
      el.type === 'curved' ||
      el.type === 'stepped' ||
      el.type === 'doubleArrow'
    ) {
      const p1 = { x: el.points[0].x + offsetX, y: el.points[0].y + offsetY };
      const p2 = { x: el.points[1].x + offsetX, y: el.points[1].y + offsetY };
      ctx.beginPath();
      if (el.type === 'curved') {
        const cp = el.controlPoint
          ? { x: el.controlPoint.x + offsetX, y: el.controlPoint.y + offsetY }
          : { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 40 };
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
        drawArrowHead(ctx, p1, p2, el.strokeColor);
      }
      if (el.type === 'doubleArrow' || el.arrowStart) {
        drawArrowHead(ctx, p2, p1, el.strokeColor);
      }
    } else if (el.type === 'pen' || el.type === 'highlighter' || el.type === 'ink') {
      if (el.points && el.points.length > 1) {
        if (el.type === 'highlighter') {
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = Math.max(el.strokeWidth, 16);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(el.points[0].x + offsetX, el.points[0].y + offsetY);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x + offsetX, el.points[i].y + offsetY);
        }
        ctx.stroke();
      }
    } else if (el.type === 'sticky') {
      // Background card
      ctx.fillStyle = getStickyColor(el.colorTheme);
      ctx.strokeStyle = el.strokeColor || '#fbbf24';
      ctx.fillRect(x, y, el.width, el.height);
      ctx.strokeRect(x, y, el.width, el.height);

      // Text inside
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      renderMultilineText(ctx, el.text, x + 16, y + 28, el.width - 32, 20);
    } else if (el.type === 'code') {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.fillRect(x, y, el.width, el.height);
      ctx.strokeRect(x, y, el.width, el.height);

      // Header bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y, el.width, 26);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(el.title || el.language || 'code', x + 10, y + 18);

      // Code content
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px "JetBrains Mono", monospace';
      renderMultilineText(ctx, el.code, x + 12, y + 46, el.width - 24, 18);
    } else if (el.type === 'text') {
      const weight = el.fontWeight === 'bold' ? 'bold ' : '';
      const style = el.fontStyle === 'italic' ? 'italic ' : '';
      ctx.fillStyle = el.strokeColor || '#ffffff';
      ctx.font = `${style}${weight}${el.fontSize || 18}px "${el.fontFamily || 'Plus Jakarta Sans'}", sans-serif`;
      renderMultilineText(ctx, el.text, x, y + (el.fontSize || 18), el.width, (el.fontSize || 18) * 1.35);
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

export function exportCanvasToSvg(
  elements: CanvasElement[],
  includeBackground = true
): string {
  const bounds = getMultiElementBounds(elements);
  const width = bounds ? Math.max(bounds.width + 160, 800) : 1200;
  const height = bounds ? Math.max(bounds.height + 160, 800) : 800;
  const offsetX = bounds ? -bounds.minX + 80 : 0;
  const offsetY = bounds ? -bounds.minY + 80 : 0;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `<defs><style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap');
    text { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style></defs>\n`;

  if (includeBackground) {
    svg += `<rect width="${width}" height="${height}" fill="#000000" />\n`;
    svg += `<pattern id="mathGrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
    </pattern>\n`;
    svg += `<pattern id="mathMajor" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(99,102,241,0.16)" stroke-width="1"/>
    </pattern>\n`;
    svg += `<rect width="${width}" height="${height}" fill="url(#mathGrid)" />\n`;
    svg += `<rect width="${width}" height="${height}" fill="url(#mathMajor)" />\n`;
  }

  for (const el of elements) {
    const x = el.x + offsetX;
    const y = el.y + offsetY;
    const stroke = el.strokeColor || '#ffffff';
    const width_ = el.strokeWidth || 2;
    const opacity = el.opacity ?? 1;

    if (el.type === 'rect') {
      const fill = el.fillColor || 'transparent';
      svg += `<rect x="${x}" y="${y}" width="${el.width}" height="${el.height}" fill="${fill}" stroke="${stroke}" stroke-width="${width_}" opacity="${opacity}" rx="6" />\n`;
    } else if (el.type === 'circle') {
      const cx = x + el.width / 2;
      const cy = y + el.height / 2;
      const rx = el.width / 2;
      const ry = el.height / 2;
      const fill = el.fillColor || 'transparent';
      svg += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width_}" opacity="${opacity}" />\n`;
    } else if (el.type === 'text') {
      const escaped = escapeXml(el.text);
      svg += `<text x="${x}" y="${y + (el.fontSize || 18)}" fill="${stroke}" font-size="${el.fontSize || 18}px" font-family="${el.fontFamily || 'Plus Jakarta Sans'}" opacity="${opacity}">${escaped}</text>\n`;
    } else if (el.type === 'sticky') {
      const bg = getStickyColor(el.colorTheme);
      svg += `<g opacity="${opacity}">
        <rect x="${x}" y="${y}" width="${el.width}" height="${el.height}" fill="${bg}" stroke="${stroke}" stroke-width="${width_}" rx="8" />
        <text x="${x + 14}" y="${y + 24}" fill="#ffffff" font-size="14px">${escapeXml(el.text)}</text>
      </g>\n`;
    } else if (el.type === 'code') {
      svg += `<g opacity="${opacity}">
        <rect x="${x}" y="${y}" width="${el.width}" height="${el.height}" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" rx="6" />
        <rect x="${x}" y="${y}" width="${el.width}" height="26" fill="#1e293b" rx="6" />
        <text x="${x + 10}" y="${y + 18}" fill="#38bdf8" font-size="12px" font-family="JetBrains Mono, monospace">${escapeXml(el.title || el.language || 'code')}</text>
        <text x="${x + 12}" y="${y + 46}" fill="#e2e8f0" font-size="12px" font-family="JetBrains Mono, monospace">${escapeXml(el.code)}</text>
      </g>\n`;
    } else if (el.type === 'diamond') {
      const cx = x + el.width / 2;
      const cy = y + el.height / 2;
      const fill = el.fillColor || 'transparent';
      svg += `<polygon points="${cx},${y} ${x + el.width},${cy} ${cx},${y + el.height} ${x},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${width_}" opacity="${opacity}" />\n`;
    } else if (
      el.type === 'line' ||
      el.type === 'arrow' ||
      el.type === 'curved' ||
      el.type === 'stepped' ||
      el.type === 'doubleArrow'
    ) {
      const p1 = { x: el.points[0].x + offsetX, y: el.points[0].y + offsetY };
      const p2 = { x: el.points[1].x + offsetX, y: el.points[1].y + offsetY };
      if (el.type === 'curved') {
        const cp = el.controlPoint
          ? { x: el.controlPoint.x + offsetX, y: el.controlPoint.y + offsetY }
          : { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 40 };
        svg += `<path d="M ${p1.x} ${p1.y} Q ${cp.x} ${cp.y} ${p2.x} ${p2.y}" fill="none" stroke="${stroke}" stroke-width="${width_}" opacity="${opacity}" />\n`;
      } else if (el.type === 'stepped') {
        const midX = (p1.x + p2.x) / 2;
        svg += `<path d="M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}" fill="none" stroke="${stroke}" stroke-width="${width_}" opacity="${opacity}" />\n`;
      } else {
        svg += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${stroke}" stroke-width="${width_}" opacity="${opacity}" />\n`;
      }
    } else if (el.type === 'pen' || el.type === 'highlighter' || el.type === 'ink') {
      if (el.points && el.points.length > 1) {
        const d = el.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + offsetX} ${p.y + offsetY}`)
          .join(' ');
        const effOpacity = el.type === 'highlighter' ? 0.35 : opacity;
        const effWidth = el.type === 'highlighter' ? Math.max(width_, 16) : width_;
        svg += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${effWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${effOpacity}" />\n`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

function getStickyColor(theme?: string): string {
  switch (theme) {
    case 'emerald':
      return '#064e3b';
    case 'cyan':
      return '#083344';
    case 'purple':
      return '#3b0764';
    case 'rose':
      return '#4c0519';
    case 'amber':
    default:
      return '#451a03';
  }
}

function renderMultilineText(
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
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
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

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string
) {
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

function drawStarPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number
) {
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

function drawPolygonPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sides: number,
  r: number
) {
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

function drawSpeechBubblePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const r = 12;
  const bubbleH = h * 0.8;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + bubbleH - r);
  ctx.quadraticCurveTo(x + w, y + bubbleH, x + w - r, y + bubbleH);
  ctx.lineTo(x + 40, y + bubbleH);
  ctx.lineTo(x + 15, y + h);
  ctx.lineTo(x + 25, y + bubbleH);
  ctx.lineTo(x + r, y + bubbleH);
  ctx.quadraticCurveTo(x, y + bubbleH, x, y + bubbleH - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCylinderPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
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

function drawCloudPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.beginPath();
  const rx = w / 6;
  ctx.moveTo(x + rx * 2, y + h * 0.7);
  ctx.arc(x + rx * 1.5, y + h * 0.6, rx * 1.2, Math.PI * 0.8, Math.PI * 1.8);
  ctx.arc(x + rx * 3, y + h * 0.4, rx * 1.5, Math.PI * 1.1, Math.PI * 1.9);
  ctx.arc(x + rx * 4.5, y + h * 0.55, rx * 1.3, Math.PI * 1.3, Math.PI * 0.2);
  ctx.arc(x + rx * 3.5, y + h * 0.75, rx * 1.2, 0, Math.PI * 0.9);
  ctx.closePath();
}

function drawHeartPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const topCurveHeight = h * 0.3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y + (h + topCurveHeight) / 2, x + w / 2, y + (h + topCurveHeight) / 1.4, x + w / 2, y + h);
  ctx.bezierCurveTo(x + w / 2, y + (h + topCurveHeight) / 1.4, x + w, y + (h + topCurveHeight) / 2, x + w, y + topCurveHeight);
  ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + topCurveHeight);
  ctx.closePath();
}
