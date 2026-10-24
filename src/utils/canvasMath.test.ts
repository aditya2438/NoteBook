import test from 'node:test';
import assert from 'node:assert/strict';
import {
  screenToWorld,
  worldToScreen,
  snapToGrid,
  snapPoint,
  clampZoom,
  getElementBounds,
  isPointInElement,
  isElementIntersectingBox,
  fuzzySearchNotes,
} from './canvasMath';
import { NoteItem, CanvasElement } from '../types';
import { HistoryManager } from './history';

test('screenToWorld and worldToScreen invert each other', () => {
  const viewport = { x: 120, y: -45, zoom: 1.5 };
  const screenPt = { x: 300, y: 400 };

  const worldPt = screenToWorld(screenPt.x, screenPt.y, viewport);
  const backToScreen = worldToScreen(worldPt.x, worldPt.y, viewport);

  assert.ok(Math.abs(backToScreen.x - screenPt.x) < 0.0001);
  assert.ok(Math.abs(backToScreen.y - screenPt.y) < 0.0001);
});

test('snapToGrid correctly snaps to grid size when enabled', () => {
  assert.equal(snapToGrid(25, 24, true), 24);
  assert.equal(snapToGrid(37, 24, true), 48);
  assert.equal(snapToGrid(25, 24, false), 25);
  assert.deepEqual(snapPoint({ x: 26, y: 71 }, 20, true), {
    x: 20,
    y: 80,
    pressure: undefined,
  });
});

test('clampZoom respects min and max limits', () => {
  assert.equal(clampZoom(0.05, 0.1, 5.0), 0.1);
  assert.equal(clampZoom(10.0, 0.1, 5.0), 5.0);
  assert.equal(clampZoom(1.234, 0.1, 5.0), 1.23);
});

test('getElementBounds calculates rectangle and circle dimensions', () => {
  const rect: CanvasElement = {
    id: '1',
    type: 'rect',
    x: 50,
    y: 100,
    width: 200,
    height: 150,
    strokeColor: '#fff',
    strokeWidth: 2,
    strokeStyle: 'solid',
    opacity: 1,
    zIndex: 1,
  };
  const bounds = getElementBounds(rect);
  assert.equal(bounds.minX, 50);
  assert.equal(bounds.minY, 100);
  assert.equal(bounds.maxX, 250);
  assert.equal(bounds.maxY, 250);
});

test('isPointInElement accurately detects hits inside shape', () => {
  const rect: CanvasElement = {
    id: '1',
    type: 'rect',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    strokeColor: '#fff',
    strokeWidth: 2,
    strokeStyle: 'solid',
    opacity: 1,
    zIndex: 1,
  };

  assert.equal(isPointInElement({ x: 150, y: 150 }, rect), true);
  assert.equal(isPointInElement({ x: 500, y: 500 }, rect), false);
});

test('isElementIntersectingBox detects marquee selection', () => {
  const rect: CanvasElement = {
    id: '1',
    type: 'rect',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    strokeColor: '#fff',
    strokeWidth: 2,
    strokeStyle: 'solid',
    opacity: 1,
    zIndex: 1,
  };

  const selBox = { x: 50, y: 50, width: 80, height: 80 };
  assert.equal(isElementIntersectingBox(rect, selBox), true);

  const farBox = { x: 300, y: 300, width: 50, height: 50 };
  assert.equal(isElementIntersectingBox(rect, farBox), false);
});

test('fuzzySearchNotes searches titles, tags, and canvas text contents', () => {
  const notes: NoteItem[] = [
    {
      id: 'n1',
      title: 'Euler Equation Proof',
      tags: ['math', 'physics'],
      isPinned: true,
      isTrash: false,
      elements: [
        {
          id: 't1',
          type: 'text',
          text: 'e^(i*pi) + 1 = 0',
          fontSize: 18,
          fontFamily: 'JetBrains Mono',
          fontWeight: 'normal',
          fontStyle: 'normal',
          x: 0,
          y: 0,
          width: 100,
          height: 30,
          strokeColor: '#fff',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 1,
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
      gridType: 'math',
      backgroundTheme: 'amoled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'n2',
      title: 'Project Roadmap Miro Style',
      tags: ['design', 'planning'],
      isPinned: false,
      isTrash: false,
      elements: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      gridType: 'math',
      backgroundTheme: 'amoled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  assert.equal(fuzzySearchNotes(notes, 'euler').length, 1);
  assert.equal(fuzzySearchNotes(notes, 'math').length, 1);
  assert.equal(fuzzySearchNotes(notes, 'pi').length, 1);
  assert.equal(fuzzySearchNotes(notes, 'miro').length, 1);
  assert.equal(fuzzySearchNotes(notes, 'quantum').length, 0);
});

test('HistoryManager pushes snapshots and supports undo and redo', () => {
  const el1: CanvasElement = {
    id: 'e1',
    type: 'rect',
    x: 10,
    y: 10,
    width: 50,
    height: 50,
    strokeColor: '#fff',
    strokeWidth: 2,
    strokeStyle: 'solid',
    opacity: 1,
    zIndex: 1,
  };
  const el2: CanvasElement = { ...el1, id: 'e2', x: 100 };

  const history = new HistoryManager([el1]);
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), false);

  history.push([el1, el2]);
  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), false);

  const undone = history.undo([el1, el2]);
  assert.ok(undone);
  assert.equal(undone.length, 1);
  assert.equal(undone[0].id, 'e1');
  assert.equal(history.canRedo(), true);

  const redone = history.redo();
  assert.ok(redone);
  assert.equal(redone.length, 2);
  assert.equal(history.canRedo(), false);
});

import { checkSpelling, translateTextOffline, applyAutoCapitalization, transcribeInkToText } from './languageEngine';

test('checkSpelling flags typos and provides accurate autocorrect suggestions', () => {
  const result = checkSpelling('teh user requested suggetion and intraction');
  assert.equal(result.hasErrors, true);
  assert.equal(result.flaggedWords.length, 3);
  assert.equal(result.correctedText, 'the user requested suggestion and interaction');
});

test('checkSpelling handles Hinglish words correctly', () => {
  const result = checkSpelling('namste aap kese ho');
  assert.equal(result.hasErrors, true);
  assert.equal(result.correctedText, 'namaste aap kaise ho');
});

test('translateTextOffline converts English to Hindi and Hinglish', () => {
  const enToHi = translateTextOffline('Hello, thank you for the notes', 'en', 'hi');
  assert.ok(enToHi.includes('नमस्ते'));
  assert.ok(enToHi.includes('धन्यवाद'));

  const enToHinglish = translateTextOffline('Hello, thank you', 'en', 'hinglish');
  assert.ok(enToHinglish.includes('Namaste'));
  assert.ok(enToHinglish.includes('Dhanyawad'));
});

test('applyAutoCapitalization transforms sentences and title casing properly', () => {
  const sample = 'hello world. this is aetheris notes! are you ready?';
  const sentenceCased = applyAutoCapitalization(sample, 'sentences');
  assert.equal(sentenceCased, 'Hello world. This is aetheris notes! Are you ready?');

  const titleCased = applyAutoCapitalization('quantum physics and mechanics', 'title');
  assert.equal(titleCased, 'Quantum Physics and Mechanics');

  const upperCased = applyAutoCapitalization('make notes', 'characters');
  assert.equal(upperCased, 'MAKE NOTES');
});

test('transcribeInkToText produces meaningful transcription from freehand stroke metadata', () => {
  const textFromHint = transcribeInkToText(45, { width: 300, height: 80 }, 'my handwritten note');
  assert.equal(textFromHint, 'My handwritten note');

  const formulaResult = transcribeInkToText(50, { width: 400, height: 60 });
  assert.ok(formulaResult.includes('Euler'));
});
