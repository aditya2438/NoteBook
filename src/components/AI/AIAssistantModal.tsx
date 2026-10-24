import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Calculator,
  Lightbulb,
  GitBranch,
  FileText,
  X,
  Copy,
  PlusCircle,
  Loader2,
  Check,
  Mic,
  MicOff,
  Globe,
  Dna,
  Music,
  Send,
} from 'lucide-react';
import { CanvasElement } from '../../types';
import { generateId } from '../../utils/canvasMath';
import { playClickSound, playPlaceSound } from '../../utils/audioFeedback';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElementsToCanvas: (elements: CanvasElement[]) => void;
  currentElementsSummary: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onAddElementsToCanvas,
  currentElementsSummary,
}) => {
  const [activeTab, setActiveTab] = useState<
    'solve-math' | 'transcribe' | 'science' | 'music' | 'brainstorm' | 'mindmap' | 'clean-notes'
  >('solve-math');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchGrounding, setSearchGrounding] = useState(true);
  const recognitionRef = useRef<any>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() && activeTab !== 'clean-notes') return;

    setIsLoading(true);
    setResponseResult(null);

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeTab,
          prompt,
          contextText: currentElementsSummary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResponseResult(data.result);
      } else {
        setResponseResult('An error occurred during AI processing. Please retry.');
      }
    } catch (err) {
      console.error(err);
      setResponseResult('Failed to connect to AI server. Please verify network or API keys.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToCanvas = () => {
    if (!responseResult) return;

    if (activeTab === 'mindmap') {
      try {
        const jsonMatch = responseResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const newElements: CanvasElement[] = [];

          // Central Root Node
          const rootId = generateId('root');
          newElements.push({
            id: rootId,
            type: 'rect',
            x: 200,
            y: 200,
            width: 220,
            height: 70,
            strokeColor: '#818cf8',
            fillColor: '#1e1b4b',
            strokeWidth: 2,
            strokeStyle: 'solid',
            opacity: 1,
            glow: true,
            zIndex: 1,
          });
          newElements.push({
            id: generateId('txt'),
            type: 'text',
            x: 220,
            y: 225,
            width: 180,
            height: 30,
            text: parsed.title || 'Central Concept',
            fontSize: 16,
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: 'bold',
            fontStyle: 'normal',
            strokeColor: '#ffffff',
            strokeWidth: 1,
            strokeStyle: 'solid',
            opacity: 1,
            zIndex: 2,
          });

          // Branches
          let branchY = 100;
          parsed.branches?.forEach((b: any, idx: number) => {
            const branchId = generateId('branch');
            const targetX = 520;
            const targetY = branchY;

            // Connector Arrow
            newElements.push({
              id: generateId('arr'),
              type: 'arrow',
              x: 420,
              y: 235,
              width: 100,
              height: targetY - 235,
              points: [
                { x: 420, y: 235 },
                { x: targetX, y: targetY + 30 },
              ],
              strokeColor: '#818cf8',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              opacity: 0.9,
              arrowEnd: true,
              zIndex: 3,
            });

            // Branch Sticky Card
            newElements.push({
              id: branchId,
              type: 'sticky',
              x: targetX,
              y: targetY,
              width: 220,
              height: 120,
              text: `${b.title}\n• ${b.subtopics?.join('\n• ') || ''}`,
              colorTheme: b.colorTheme || 'cyan',
              strokeColor: '#38bdf8',
              strokeWidth: 1,
              strokeStyle: 'solid',
              opacity: 0.95,
              zIndex: 4,
            });

            branchY += 150;
          });

          onAddElementsToCanvas(newElements);
          onClose();
          return;
        }
      } catch (e) {
        console.warn('Could not parse mind map JSON:', e);
      }
    }

    // Default: Add as a formatted card or sticky note
    const cardElement: CanvasElement = {
      id: generateId('ai_card'),
      type: 'sticky',
      x: 100,
      y: 100,
      width: 380,
      height: 240,
      text: responseResult.replace(/#+\s?/g, ''),
      colorTheme: activeTab === 'solve-math' ? 'purple' : 'cyan',
      strokeColor: '#818cf8',
      strokeWidth: 1.5,
      strokeStyle: 'solid',
      opacity: 0.95,
      zIndex: 10,
    };

    onAddElementsToCanvas([cardElement]);
    onClose();
  };

  const copyToClipboard = () => {
    if (responseResult) {
      navigator.clipboard.writeText(responseResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleRecording = () => {
    playClickSound();
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPrompt((p) => (p ? `${p} ` : '') + 'Euler formula e^(i*pi) + 1 = 0 and Fourier series representation.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[96vw] sm:max-w-2xl rounded-2xl sm:rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white">AuraNotes AI Intelligence</h2>
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
                Math solver, voice transcribe, bio-science, mind maps & search grounding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Mobile-Friendly Tab Selector (Horizontal Scroll with No Overflow) */}
        <div className="flex items-center gap-1.5 px-3 sm:px-6 pt-2 pb-1 border-b border-white/10 bg-white/[0.01] overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('solve-math');
              setResponseResult(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'solve-math'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Math & STEM</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('transcribe');
              setResponseResult(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'transcribe'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice Transcribe</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('science');
              setResponseResult(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'science'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bio-Science</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('music');
              setResponseResult(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'music'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Focus Music</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('brainstorm');
              setResponseResult(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'brainstorm'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Brainstorm</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('mindmap');
              setResponseResult(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'mindmap'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Mind Map</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('clean-notes');
              setResponseResult(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'clean-notes'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>
        </div>

        {/* Content Body - Mobile Responsive, No Overflow */}
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {activeTab === 'solve-math'
                  ? 'Enter STEM equation, calculus integral, or physics formula:'
                  : activeTab === 'transcribe'
                  ? 'Speak into microphone or paste voice audio memo to transcribe:'
                  : activeTab === 'science'
                  ? 'Bio-science, genomics, DNA/RNA sequence, or chemical pathway:'
                  : activeTab === 'music'
                  ? 'Describe ambient study lo-fi soundscape or focus music vibes:'
                  : activeTab === 'brainstorm'
                  ? 'What topic would you like to brainstorm?'
                  : activeTab === 'mindmap'
                  ? 'Central concept or project structure for Mind Map:'
                  : 'Notes text to clean, structure, and summarize:'}
              </label>

              {/* Voice Dictation Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'bg-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.14]'
                }`}
                title="Dictate with voice microphone"
              >
                {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-cyan-400" />}
                <span>{isRecording ? 'Listening...' : 'Voice Dictate'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'solve-math'
                  ? 'e.g. Integrate x * e^(2x) dx or solve harmonic oscillator eigenvalues'
                  : activeTab === 'transcribe'
                  ? 'Tap "Voice Dictate" and speak, or paste speech audio transcript...'
                  : activeTab === 'science'
                  ? 'e.g. Translate DNA sequence ATGCGATCGTA to mRNA codons and amino acids'
                  : activeTab === 'music'
                  ? 'e.g. Deep cosmic binaural study beats at 60 BPM with rain acoustics'
                  : activeTab === 'brainstorm'
                  ? 'e.g. Next-generation spatial canvas tools and gesture shortcuts'
                  : activeTab === 'mindmap'
                  ? 'e.g. Distributed Cloud Architecture and Microservices'
                  : 'Paste your raw unformatted lecture notes here...'
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 break-words"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Google Search Grounding Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400 hover:text-slate-200 select-none">
              <input
                type="checkbox"
                checked={searchGrounding}
                onChange={(e) => setSearchGrounding(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-cyan-500"
              />
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Google Search Grounding</span>
            </label>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reasoning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Generate AI Solution</span>
                </>
              )}
            </button>
          </div>

          {/* AI Result View */}
          {responseResult && (
            <div className="mt-4 p-4 rounded-xl bg-black/60 border border-indigo-500/30 text-xs text-slate-200 space-y-3 font-mono">
              <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
                <span className="text-[11px] font-sans font-semibold text-indigo-400">
                  AI Output:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-[11px] max-h-60 overflow-y-auto">
                {responseResult}
              </pre>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleApplyToCanvas}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/30 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Directly to Canvas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
