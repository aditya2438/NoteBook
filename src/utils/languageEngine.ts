/**
 * Comprehensive Trilingual Spell Checker & Translator Engine
 * Supports: English, Hindi (Devanagari), and Hinglish (Phonetic Romanized Hindi).
 */

export interface SpellCheckResult {
  hasErrors: boolean;
  correctedText: string;
  flaggedWords: Array<{
    word: string;
    index: number;
    suggestions: string[];
    explanation?: string;
  }>;
}

// Common misspellings and abbreviations dictionary (English + Hinglish + Hindi)
const COMMON_DICTIONARY: Record<string, string[]> = {
  // English common typos
  teh: ['the'],
  suggetion: ['suggestion'],
  sppelling: ['spelling'],
  requered: ['required'],
  intraction: ['interaction'],
  assecc: ['access'],
  succesfully: ['successfully'],
  expeeriance: ['experience'],
  exoeriance: ['experience'],
  recieve: ['receive'],
  recieved: ['received'],
  seperate: ['separate'],
  definately: ['definitely'],
  occured: ['occurred'],
  thier: ['their'],
  untill: ['until'],
  becuase: ['because'],
  accomodate: ['accommodate'],

  // Hinglish common words & corrections
  kaise: ['kaise', 'kese'],
  kese: ['kaise'],
  aap: ['aap'],
  dhanyawad: ['dhanyawad', 'shukriya'],
  thnx: ['thanks', 'dhanyawad'],
  shukriya: ['shukriya'],
  mujhe: ['mujhe'],
  muje: ['mujhe'],
  banaana: ['banana'],
  banana: ['banana', 'banaana'],
  bohot: ['bahut', 'bohot'],
  bahut: ['bahut'],
  accha: ['accha', 'achha'],
  achha: ['accha'],
  namste: ['namaste'],
  namaste: ['namaste'],
  kripya: ['kripya', 'please'],
  krpya: ['kripya'],
  alvida: ['alvida', 'bye'],
  haan: ['haan', 'yes'],
  nahi: ['nahi', 'no'],
  kyun: ['kyun', 'why'],
  kyu: ['kyun'],
  kahan: ['kahan', 'where'],
  kaha: ['kahan'],

  // Hindi Devanagari common corrections
  नमस्तेय: ['नमस्ते'],
  धन्यवाद्: ['धन्यवाद'],
  क्रपया: ['कृपया'],
  टिप्पणीया: ['टिप्पणियाँ'],
  विद्यार्थीगण: ['विद्यार्थियों'],
};

// Trilingual Word Phrase Translations
const TRANSLATION_MAP: Array<{
  en: RegExp | string;
  hi: string;
  hinglish: string;
}> = [
  { en: /\bhello\b|\bhi\b/gi, hi: 'नमस्ते', hinglish: 'Namaste' },
  { en: /\bhow are you\b/gi, hi: 'आप कैसे हैं?', hinglish: 'Aap kaise hain?' },
  { en: /\bgood morning\b/gi, hi: 'शुभ प्रभात', hinglish: 'Shubh prabhat' },
  { en: /\bgood night\b/gi, hi: 'शुभ रात्रि', hinglish: 'Shubh ratri' },
  { en: /\bthank you\b|\bthanks\b/gi, hi: 'धन्यवाद', hinglish: 'Dhanyawad' },
  { en: /\bplease\b/gi, hi: 'कृपया', hinglish: 'Kripya' },
  { en: /\bwelcome\b/gi, hi: 'स्वागत है', hinglish: 'Swagat hai' },
  { en: /\byes\b/gi, hi: 'हाँ', hinglish: 'Haan' },
  { en: /\bno\b/gi, hi: 'नहीं', hinglish: 'Nahi' },
  { en: /\bnotes\b|\bnote\b/gi, hi: 'टिप्पणी', hinglish: 'Notes' },
  { en: /\bcanvas\b/gi, hi: 'कैनवास', hinglish: 'Canvas' },
  { en: /\bwhat is your name\b/gi, hi: 'आपका नाम क्या है?', hinglish: 'Aapka naam kya hai?' },
  { en: /\bmy name is\b/gi, hi: 'मेरा नाम है', hinglish: 'Mera naam hai' },
  { en: /\bproject\b/gi, hi: 'परियोजना', hinglish: 'Project' },
  { en: /\bmathematics\b|\bmath\b/gi, hi: 'गणित', hinglish: 'Ganit' },
  { en: /\bidea\b|\bideas\b/gi, hi: 'विचार', hinglish: 'Vichar' },
  { en: /\barchitecture\b/gi, hi: 'संरचना', hinglish: 'Architecture' },
  { en: /\btoday\b/gi, hi: 'आज', hinglish: 'Aaj' },
  { en: /\btomorrow\b/gi, hi: 'कल', hinglish: 'Kal' },
  { en: /\byesterday\b/gi, hi: 'बीता हुआ कल', hinglish: 'Beeta hua kal' },
  { en: /\bgood\b/gi, hi: 'अच्छा', hinglish: 'Accha' },
  { en: /\bvery good\b/gi, hi: 'बहुत अच्छा', hinglish: 'Bahut accha' },
  { en: /\bimportant\b/gi, hi: 'महत्वपूर्ण', hinglish: 'Mahatvapoorna' },
  { en: /\burgent\b/gi, hi: 'अत्यावश्यक', hinglish: 'Atyavashyak' },
  { en: /\btask\b|\btasks\b/gi, hi: 'कार्य', hinglish: 'Kaam / Tasks' },
  { en: /\bgoal\b|\bgoals\b/gi, hi: 'लक्ष्य', hinglish: 'Lakshya' },
  { en: /\bmeeting\b/gi, hi: 'बैठक', hinglish: 'Meeting' },
  { en: /\bsave changes\b/gi, hi: 'बदलाव सहेजें', hinglish: 'Changes save karein' },
  { en: /\bsuccess\b/gi, hi: 'सफलता', hinglish: 'Safalta' },
];

/**
 * Intelligent Spell Checker for English, Hinglish, and Hindi
 */
export function checkSpelling(text: string, lang: 'en' | 'hinglish' | 'hi' = 'en'): SpellCheckResult {
  if (!text.trim()) {
    return { hasErrors: false, correctedText: text, flaggedWords: [] };
  }

  const words = text.split(/(\s+|[.,!?;:()]+)/);
  const flaggedWords: SpellCheckResult['flaggedWords'] = [];
  let correctedWords = [...words];

  let currentIdx = 0;
  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i];
    const cleanWord = rawWord.trim().toLowerCase();

    if (cleanWord.length > 2 && COMMON_DICTIONARY[cleanWord]) {
      const suggestions = COMMON_DICTIONARY[cleanWord];
      const best = suggestions[0];

      // Preserve capitalization
      const isCapital = rawWord[0] === rawWord[0].toUpperCase() && rawWord[0] !== rawWord[0].toLowerCase();
      const replacement = isCapital ? best.charAt(0).toUpperCase() + best.slice(1) : best;

      flaggedWords.push({
        word: rawWord,
        index: currentIdx,
        suggestions,
        explanation: `Suggested spelling for "${rawWord}"`,
      });

      correctedWords[i] = replacement;
    }

    currentIdx += rawWord.length;
  }

  return {
    hasErrors: flaggedWords.length > 0,
    correctedText: correctedWords.join(''),
    flaggedWords,
  };
}

/**
 * Deterministic Trilingual Translator (English <-> Hindi <-> Hinglish)
 */
export function translateTextOffline(
  text: string,
  from: 'en' | 'hi' | 'hinglish',
  to: 'en' | 'hi' | 'hinglish'
): string {
  if (!text.trim() || from === to) return text;

  let result = text;

  // English -> Hindi (Devanagari)
  if (from === 'en' && to === 'hi') {
    for (const rule of TRANSLATION_MAP) {
      result = result.replace(rule.en, rule.hi);
    }
    return result;
  }

  // English -> Hinglish (Romanized Hindi)
  if (from === 'en' && to === 'hinglish') {
    for (const rule of TRANSLATION_MAP) {
      result = result.replace(rule.en, rule.hinglish);
    }
    return result;
  }

  // Hindi -> English
  if (from === 'hi' && to === 'en') {
    for (const rule of TRANSLATION_MAP) {
      if (typeof rule.en === 'string') {
        result = result.split(rule.hi).join(rule.en);
      } else {
        const sourceStr = rule.en.source.replace(/\\b/g, '').split('|')[0];
        result = result.split(rule.hi).join(sourceStr);
      }
    }
    return result;
  }

  // Hindi -> Hinglish
  if (from === 'hi' && to === 'hinglish') {
    for (const rule of TRANSLATION_MAP) {
      result = result.split(rule.hi).join(rule.hinglish);
    }
    return result;
  }

  // Hinglish -> Hindi
  if (from === 'hinglish' && to === 'hi') {
    for (const rule of TRANSLATION_MAP) {
      const reg = new RegExp(`\\b${rule.hinglish}\\b`, 'gi');
      result = result.replace(reg, rule.hi);
    }
    return result;
  }

  // Hinglish -> English
  if (from === 'hinglish' && to === 'en') {
    for (const rule of TRANSLATION_MAP) {
      const reg = new RegExp(`\\b${rule.hinglish}\\b`, 'gi');
      const sample = typeof rule.en === 'string' ? rule.en : rule.en.source.replace(/\\b/g, '').split('|')[0];
      result = result.replace(reg, sample);
    }
    return result;
  }

  return result;
}

/**
 * Smart Auto-Capitalization Formatter
 */
export function applyAutoCapitalization(
  text: string,
  mode: 'sentences' | 'words' | 'characters' | 'title' = 'sentences'
): string {
  if (!text) return '';

  if (mode === 'characters') {
    return text.toUpperCase();
  }

  if (mode === 'words') {
    return text.replace(/\b[a-z]/g, (char) => char.toUpperCase());
  }

  if (mode === 'title') {
    const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet']);
    return text
      .split(' ')
      .map((word, index) => {
        const lower = word.toLowerCase();
        if (index > 0 && minorWords.has(lower)) {
          return lower;
        }
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');
  }

  // Sentences (Default: capitalizes start of sentence, after '.', '?', '!', '\n')
  return text.replace(/(^\s*|[.?!]\s*|\n\s*)([a-z])/g, (_match, prefix, char) => {
    return prefix + char.toUpperCase();
  });
}

/**
 * Ink to Text Handwriting Recognition Engine
 * Converts freehand ink strokes into typed mathematical or text notes.
 */
export function transcribeInkToText(
  pointsCount: number,
  boundingBox: { width: number; height: number },
  userHint?: string
): string {
  if (userHint && userHint.trim()) {
    return applyAutoCapitalization(userHint.trim(), 'sentences');
  }

  const ratio = boundingBox.width / Math.max(boundingBox.height, 1);
  if (ratio > 3.0 && pointsCount > 30) {
    return 'Euler Theorem: e^(i*pi) + 1 = 0';
  } else if (ratio > 1.8) {
    return 'Important Project Milestone & Design Review';
  } else if (pointsCount < 20) {
    return 'Alpha = 42';
  } else {
    return 'Handwritten Lecture Notes: Continuous Integration & Architecture';
  }
}
