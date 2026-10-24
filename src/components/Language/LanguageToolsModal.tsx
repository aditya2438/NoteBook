import React, { useState } from 'react';
import {
  X,
  Languages,
  CheckCheck,
  ArrowRightLeft,
  Sparkles,
  Copy,
  PlusCircle,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { checkSpelling, translateTextOffline, SpellCheckResult } from '../../utils/languageEngine';
import { playClickSound, playPlaceSound } from '../../utils/audioFeedback';

interface LanguageToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToCanvas: (text: string, type: 'text' | 'sticky') => void;
  selectedText?: string;
}

export const LanguageToolsModal: React.FC<LanguageToolsModalProps> = ({
  isOpen,
  onClose,
  onInsertToCanvas,
  selectedText = '',
}) => {
  const [activeTab, setActiveTab] = useState<'translator' | 'spellcheck'>('translator');

  // Translation State
  const [sourceLang, setSourceLang] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [targetLang, setTargetLang] = useState<'en' | 'hi' | 'hinglish'>('hi');
  const [inputText, setInputText] = useState(selectedText || 'Hello, welcome to Aetheris Notes! How are you?');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Spell Check State
  const [spellInput, setSpellInput] = useState(selectedText || 'teh user requested suggetion and intraction');
  const [spellLang, setSpellLang] = useState<'en' | 'hinglish' | 'hi'>('en');
  const [spellResult, setSpellResult] = useState<SpellCheckResult | null>(null);

  if (!isOpen) return null;

  const handleSwapLanguages = () => {
    playClickSound();
    const prevSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prevSource);
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText('');
    }
  };

  const handleTranslate = async () => {
    playClickSound();
    if (!inputText.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/language/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, sourceLang, targetLang }),
      });
      const data = await res.json();
      if (data.success) {
        setTranslatedText(data.translatedText);
      } else {
        setTranslatedText(translateTextOffline(inputText, sourceLang, targetLang));
      }
    } catch {
      setTranslatedText(translateTextOffline(inputText, sourceLang, targetLang));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRunSpellCheck = () => {
    playClickSound();
    const res = checkSpelling(spellInput, spellLang);
    setSpellResult(res);
  };

  const handleApplySpellCorrection = () => {
    if (spellResult?.correctedText) {
      playClickSound();
      setSpellInput(spellResult.correctedText);
      setSpellResult({
        hasErrors: false,
        correctedText: spellResult.correctedText,
        flaggedWords: [],
      });
    }
  };

  const handleCopy = (text: string) => {
    playClickSound();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCanvas = (text: string, type: 'text' | 'sticky') => {
    playPlaceSound();
    onInsertToCanvas(text, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-[96vw] sm:max-w-2xl max-h-[92vh] bg-[#090b14]/95 backdrop-blur-3xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100 flex flex-col">
        {/* Header with Title & Tabs */}
        <div className="h-14 px-3 sm:px-6 border-b border-white/10 flex items-center justify-between bg-white/[0.04] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white">Language & Translation Suite</h2>
              <p className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-none">English • Hinglish • Hindi (हिंदी)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('translator');
                }}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  activeTab === 'translator'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Translator
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('spellcheck');
                }}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  activeTab === 'spellcheck'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Spell Check & Auto-Suggest
              </button>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {activeTab === 'translator' ? (
            /* TRANSLATOR VIEW */
            <div className="space-y-4">
              {/* Language Selection Row */}
              <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">From:</span>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value as any)}
                    className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                  >
                    <option value="en">English (US/UK)</option>
                    <option value="hinglish">Hinglish (Roman Hindi)</option>
                    <option value="hi">Hindi (हिंदी Devanagari)</option>
                  </select>
                </div>

                <button
                  onClick={handleSwapLanguages}
                  title="Swap languages"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 border border-white/10 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">To:</span>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value as any)}
                    className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                  >
                    <option value="hi">Hindi (हिंदी Devanagari)</option>
                    <option value="hinglish">Hinglish (Roman Hindi)</option>
                    <option value="en">English (US/UK)</option>
                  </select>
                </div>
              </div>

              {/* Text Input & Output Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Input Note Text</span>
                    <span className="text-[10px] text-slate-400">{inputText.length} chars</span>
                  </label>
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter notes, phrases, or thoughts..."
                    className="w-full p-3 rounded-2xl bg-black/50 border border-white/15 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400 resize-none font-sans"
                  />
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => setInputText('Hello, thank you for making notes on this canvas!')}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-400"
                    >
                      Preset: Greeting
                    </button>
                    <button
                      onClick={() => setInputText('Aap kaise hain? Mujhe naye notes banana hai.')}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-400"
                    >
                      Preset: Hinglish
                    </button>
                  </div>
                </div>

                {/* Translation Output */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Translation Result</span>
                    {translatedText && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </label>
                  <div className="w-full h-[142px] p-3 rounded-2xl bg-white/[0.04] border border-white/15 text-white text-xs leading-relaxed overflow-y-auto font-sans">
                    {translatedText ? (
                      <p className="whitespace-pre-wrap">{translatedText}</p>
                    ) : (
                      <p className="text-slate-500 italic">Click Translate to generate output...</p>
                    )}
                  </div>

                  {translatedText && (
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleCopy(translatedText)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddToCanvas(translatedText, 'text')}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 text-xs font-medium"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Insert as Text</span>
                        </button>
                        <button
                          onClick={() => handleAddToCanvas(translatedText, 'sticky')}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 text-xs font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Insert as Sticky</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Translate Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !inputText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                  <span>{isTranslating ? 'Translating...' : 'Translate Instantly'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* SPELL CHECK & AUTO-SUGGEST VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Target Language:</span>
                  <select
                    value={spellLang}
                    onChange={(e) => setSpellLang(e.target.value as any)}
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="en">English (US/UK)</option>
                    <option value="hinglish">Hinglish (Hindi in Roman script)</option>
                    <option value="hi">Hindi (हिंदी Devanagari)</option>
                  </select>
                </div>

                <button
                  onClick={handleRunSpellCheck}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-md"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Check Spelling</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Text to Spell Check</label>
                <textarea
                  rows={4}
                  value={spellInput}
                  onChange={(e) => {
                    setSpellInput(e.target.value);
                    setSpellResult(null);
                  }}
                  className="w-full p-3 rounded-2xl bg-black/50 border border-white/15 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              {/* Suggestions / Results */}
              {spellResult && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {spellResult.hasErrors ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-amber-300">
                            Found {spellResult.flaggedWords.length} spelling correction{spellResult.flaggedWords.length > 1 ? 's' : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">
                            No spelling mistakes detected!
                          </span>
                        </>
                      )}
                    </div>

                    {spellResult.hasErrors && (
                      <button
                        onClick={handleApplySpellCorrection}
                        className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                      >
                        Auto-Correct All
                      </button>
                    )}
                  </div>

                  {spellResult.hasErrors && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {spellResult.flaggedWords.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="line-through text-rose-400 font-mono font-medium">{item.word}</span>
                            <span className="text-slate-500">→</span>
                            <span className="text-emerald-300 font-semibold">{item.suggestions.join(', ')}</span>
                          </div>
                          <button
                            onClick={() => {
                              playClickSound();
                              const newText = spellInput.replace(item.word, item.suggestions[0]);
                              setSpellInput(newText);
                              const nextFlagged = spellResult.flaggedWords.filter((_, i) => i !== idx);
                              setSpellResult({
                                hasErrors: nextFlagged.length > 0,
                                correctedText: newText,
                                flaggedWords: nextFlagged,
                              });
                            }}
                            className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-cyan-300"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleAddToCanvas(spellInput, 'text')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 text-xs font-medium"
                    >
                      Insert Corrected Text to Canvas
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
