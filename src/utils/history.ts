import { CanvasElement } from '../types';

export class HistoryManager {
  private undoStack: CanvasElement[][] = [];
  private redoStack: CanvasElement[][] = [];
  private maxDepth = 40;

  constructor(initialState?: CanvasElement[]) {
    if (initialState) {
      this.undoStack.push(this.clone(initialState));
    }
  }

  public push(elements: CanvasElement[]): void {
    // If the top of undoStack matches current, don't duplicate
    if (this.undoStack.length > 0) {
      const top = this.undoStack[this.undoStack.length - 1];
      if (this.isEqual(top, elements)) {
        return;
      }
    }

    this.undoStack.push(this.clone(elements));
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    // Any new change clears redo
    this.redoStack = [];
  }

  public undo(current: CanvasElement[]): CanvasElement[] | null {
    if (this.undoStack.length <= 1) {
      return null;
    }
    // The top of undo stack is current state. Pop it and put into redo stack.
    const present = this.undoStack.pop();
    if (present) {
      this.redoStack.push(present);
    }
    const previous = this.undoStack[this.undoStack.length - 1];
    return previous ? this.clone(previous) : null;
  }

  public redo(): CanvasElement[] | null {
    if (this.redoStack.length === 0) {
      return null;
    }
    const next = this.redoStack.pop();
    if (next) {
      this.undoStack.push(next);
      return this.clone(next);
    }
    return null;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear(initialState?: CanvasElement[]): void {
    this.undoStack = initialState ? [this.clone(initialState)] : [];
    this.redoStack = [];
  }

  private clone(elements: CanvasElement[]): CanvasElement[] {
    return JSON.parse(JSON.stringify(elements));
  }

  private isEqual(a: CanvasElement[], b: CanvasElement[]): boolean {
    if (a.length !== b.length) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
