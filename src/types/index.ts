export type ToolType =
  | 'select'
  | 'hand'
  | 'pen'
  | 'ink'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'sticky'
  | 'rect'
  | 'circle'
  | 'diamond'
  | 'star'
  | 'hexagon'
  | 'pentagon'
  | 'speechBubble'
  | 'cylinder'
  | 'cloud'
  | 'heart'
  | 'line'
  | 'arrow'
  | 'curved'
  | 'stepped'
  | 'doubleArrow'
  | 'code'
  | 'laser';

export type GridType =
  | 'math'
  | 'dots'
  | 'cross'
  | 'isometric'
  | 'hex'
  | 'engineering'
  | 'polar'
  | 'cornell'
  | 'ruled'
  | 'music'
  | 'none';

export type BackgroundTheme =
  | 'portfolio-cosmos'
  | 'space'
  | 'nebula'
  | 'amoled'
  | 'obsidian'
  | 'slate'
  | 'paper'
  | 'blueprint'
  | 'chalkboard'
  | 'parchment'
  | 'cyberpunk';

export type SupportedFontFamily =
  | 'Inter'
  | 'Plus Jakarta Sans'
  | 'Space Grotesk'
  | 'Outfit'
  | 'Montserrat'
  | 'JetBrains Mono'
  | 'Fira Code'
  | 'Caveat'
  | 'Kalam'
  | 'Architects Daughter'
  | 'Playfair Display'
  | 'Cinzel'
  | 'Merriweather'
  | 'Roboto Slab'
  | 'Orbitron'
  | 'Syne'
  | 'Bebas Neue'
  | 'Oswald'
  | 'Comic Neue'
  | 'Lobster Two'
  | 'Great Vibes'
  | 'Pacifico';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface BaseElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  glow?: boolean;
  glowColor?: string;
  zIndex: number;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: SupportedFontFamily;
  fontWeight: 'normal' | 'bold' | '600' | '800';
  fontStyle: 'normal' | 'italic';
  underline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  autoCapitalizeMode?: 'none' | 'sentences' | 'words' | 'characters';
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  text: string;
  colorTheme: 'amber' | 'emerald' | 'cyan' | 'purple' | 'rose' | 'slate';
  author?: string;
}

export interface ShapeElement extends BaseElement {
  type:
    | 'rect'
    | 'circle'
    | 'diamond'
    | 'star'
    | 'hexagon'
    | 'pentagon'
    | 'speechBubble'
    | 'cylinder'
    | 'cloud'
    | 'heart';
  borderRadius?: number;
}

export interface LineElement extends BaseElement {
  type: 'line' | 'arrow' | 'curved' | 'stepped' | 'doubleArrow';
  points: [Point, Point];
  controlPoint?: Point;
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface FreehandElement extends BaseElement {
  type: 'pen' | 'highlighter' | 'ink';
  points: Point[];
  isHighlighter?: boolean;
  inkStyle?: 'fountain' | 'calligraphy' | 'quill';
  recognizedText?: string;
}

export interface CollaboratorCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastActive: number;
  currentTool?: string;
  avatarUrl?: string;
  isClicking?: boolean;
}

export interface CodeElement extends BaseElement {
  type: 'code';
  code: string;
  language: string;
  title?: string;
}

export type CanvasElement =
  | TextElement
  | StickyElement
  | ShapeElement
  | LineElement
  | FreehandElement
  | CodeElement;

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface NoteItem {
  id: string;
  userId?: string;
  title: string;
  tags: string[];
  isPinned: boolean;
  isTrash: boolean;
  elements: CanvasElement[];
  viewport: Viewport;
  gridType: GridType;
  backgroundTheme: BackgroundTheme;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  plan: 'pro' | 'enterprise';
  verified?: boolean;
  createdAt: string;
}

export interface SecurityLogItem {
  id: string;
  timestamp: string;
  action: string;
  ip: string;
  device: string;
  status: 'success' | 'warning';
}

export interface AIActionPayload {
  action:
    | 'brainstorm'
    | 'solve-math'
    | 'summarize'
    | 'mindmap'
    | 'clean-notes'
    | 'explain-diagram';
  prompt: string;
  contextText?: string;
  selectedElementsSummary?: string;
}
