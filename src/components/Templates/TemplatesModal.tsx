import React from 'react';
import {
  X,
  LayoutTemplate,
  Binary,
  Layers,
  Kanban,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { CanvasElement } from '../../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (templateName: string, elements: CanvasElement[]) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const templates = [
    {
      id: 'math-calculus',
      title: 'Advanced Calculus & Fourier Analysis',
      category: 'STEM & Engineering',
      icon: <Binary className="w-5 h-5 text-indigo-400" />,
      description: 'Mathematical proofs, complex Fourier bases, and code block calculation snippets.',
      getElements: (): CanvasElement[] => [
        {
          id: 'tmpl-title',
          type: 'text',
          x: 60,
          y: 40,
          width: 480,
          height: 45,
          text: 'Euler Formula & Fourier Analysis',
          fontSize: 26,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#38bdf8',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 1,
        },
        {
          id: 'tmpl-card',
          type: 'rect',
          x: 60,
          y: 100,
          width: 400,
          height: 180,
          strokeColor: '#6366f1',
          fillColor: '#1e1b4b',
          strokeWidth: 2,
          strokeStyle: 'solid',
          opacity: 0.9,
          glow: true,
          zIndex: 2,
        },
        {
          id: 'tmpl-formula',
          type: 'text',
          x: 80,
          y: 125,
          width: 360,
          height: 130,
          text: 'e^(i*θ) = cos(θ) + i*sin(θ)\n\nF(ω) = ∫ f(t)·e^(-iωt) dt\n\nDiscrete Orthogonality:\nΣ e^(i2πkn/N) = N·δ[k]',
          fontSize: 16,
          fontFamily: 'JetBrains Mono',
          fontWeight: 'normal',
          fontStyle: 'normal',
          strokeColor: '#e0e7ff',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 3,
        },
        {
          id: 'tmpl-sticky',
          type: 'sticky',
          x: 500,
          y: 100,
          width: 240,
          height: 180,
          text: 'Key Principle:\nBasis functions are orthogonal and span the L2 Hilbert space.',
          colorTheme: 'cyan',
          strokeColor: '#06b6d4',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 0.95,
          zIndex: 4,
        },
      ],
    },
    {
      id: 'arch-blueprint',
      title: 'Microservices & Event Bus Architecture',
      category: 'Cloud Engineering',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      description: 'Distributed gateways, Kafka event cluster, and SLA requirements.',
      getElements: (): CanvasElement[] => [
        {
          id: 'b-title',
          type: 'text',
          x: 60,
          y: 40,
          width: 400,
          height: 40,
          text: 'Event-Driven Microservices Blueprint',
          fontSize: 22,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#a855f7',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 1,
        },
        {
          id: 'b-gateway',
          type: 'rect',
          x: 60,
          y: 120,
          width: 160,
          height: 80,
          strokeColor: '#38bdf8',
          fillColor: '#082f49',
          strokeWidth: 2,
          strokeStyle: 'solid',
          opacity: 0.9,
          zIndex: 2,
        },
        {
          id: 'b-gw-label',
          type: 'text',
          x: 80,
          y: 145,
          width: 120,
          height: 30,
          text: 'Edge API Gateway',
          fontSize: 14,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#bae6fd',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 3,
        },
        {
          id: 'b-arrow',
          type: 'arrow',
          x: 220,
          y: 160,
          width: 90,
          height: 0,
          points: [
            { x: 220, y: 160 },
            { x: 310, y: 160 },
          ],
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          strokeStyle: 'solid',
          opacity: 1,
          arrowEnd: true,
          zIndex: 4,
        },
        {
          id: 'b-kafka',
          type: 'circle',
          x: 310,
          y: 110,
          width: 100,
          height: 100,
          strokeColor: '#10b981',
          fillColor: '#064e3b',
          strokeWidth: 2,
          strokeStyle: 'solid',
          opacity: 0.9,
          zIndex: 5,
        },
        {
          id: 'b-kafka-txt',
          type: 'text',
          x: 325,
          y: 145,
          width: 70,
          height: 30,
          text: 'Kafka Bus',
          fontSize: 13,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#a7f3d0',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 6,
        },
      ],
    },
    {
      id: 'agile-sprint',
      title: 'Miro Agile Sprint Retrospective',
      category: 'Productivity',
      icon: <Kanban className="w-5 h-5 text-amber-400" />,
      description: 'Sprint 3-column boards with What Went Well, Delta To Improve, and Action Items.',
      getElements: (): CanvasElement[] => [
        {
          id: 's-title',
          type: 'text',
          x: 60,
          y: 40,
          width: 380,
          height: 40,
          text: 'Sprint Retrospective & Action Matrix',
          fontSize: 22,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#f59e0b',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 1,
        },
        {
          id: 's-col1',
          type: 'rect',
          x: 60,
          y: 100,
          width: 250,
          height: 360,
          strokeColor: '#10b981',
          fillColor: '#022c22',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          opacity: 0.6,
          zIndex: 2,
        },
        {
          id: 's-col1-txt',
          type: 'text',
          x: 80,
          y: 115,
          width: 200,
          height: 30,
          text: '🟢 What Went Well',
          fontSize: 15,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#34d399',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 3,
        },
        {
          id: 's-stick1',
          type: 'sticky',
          x: 80,
          y: 160,
          width: 210,
          height: 110,
          text: 'Smooth 60 FPS panning on infinite canvas.',
          colorTheme: 'emerald',
          strokeColor: '#10b981',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 0.95,
          zIndex: 4,
        },
        {
          id: 's-col2',
          type: 'rect',
          x: 340,
          y: 100,
          width: 250,
          height: 360,
          strokeColor: '#f43f5e',
          fillColor: '#4c0519',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          opacity: 0.6,
          zIndex: 5,
        },
        {
          id: 's-col2-txt',
          type: 'text',
          x: 360,
          y: 115,
          width: 200,
          height: 30,
          text: '🔴 Delta (To Improve)',
          fontSize: 15,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#fb7185',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 6,
        },
        {
          id: 's-stick2',
          type: 'sticky',
          x: 360,
          y: 160,
          width: 210,
          height: 110,
          text: 'Keep expanding math equation presets.',
          colorTheme: 'rose',
          strokeColor: '#f43f5e',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 0.95,
          zIndex: 7,
        },
      ],
    },
    {
      id: 'cornell-system',
      title: 'Cornell Note-Taking Architecture',
      category: 'Education & Research',
      icon: <GraduationCap className="w-5 h-5 text-purple-400" />,
      description: 'Systematic Cornell layout with Recall Cue column, Notes Area, and Summary footer.',
      getElements: (): CanvasElement[] => [
        {
          id: 'c-title',
          type: 'text',
          x: 60,
          y: 35,
          width: 400,
          height: 40,
          text: 'Lecture / Research Topic: [Title]',
          fontSize: 22,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#c084fc',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 1,
        },
        {
          id: 'c-cue-box',
          type: 'rect',
          x: 60,
          y: 90,
          width: 200,
          height: 320,
          strokeColor: '#a855f7',
          fillColor: '#2e1065',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          opacity: 0.8,
          zIndex: 2,
        },
        {
          id: 'c-cue-txt',
          type: 'text',
          x: 75,
          y: 105,
          width: 170,
          height: 280,
          text: 'CUES & QUESTIONS\n\n• What is the main thesis?\n\n• Key definition\n\n• Formula connection',
          fontSize: 14,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#e9d5ff',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 3,
        },
        {
          id: 'c-notes-box',
          type: 'rect',
          x: 280,
          y: 90,
          width: 450,
          height: 320,
          strokeColor: '#38bdf8',
          fillColor: '#082f49',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          opacity: 0.8,
          zIndex: 4,
        },
        {
          id: 'c-notes-txt',
          type: 'text',
          x: 300,
          y: 105,
          width: 410,
          height: 280,
          text: 'DETAILED LECTURE NOTES\n\n1. Point One: Structure observations.\n2. Point Two: Experimental evidence.\n3. Counter-arguments & validation.',
          fontSize: 14,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'normal',
          fontStyle: 'normal',
          strokeColor: '#f0f9ff',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 5,
        },
        {
          id: 'c-summary-box',
          type: 'rect',
          x: 60,
          y: 430,
          width: 670,
          height: 100,
          strokeColor: '#10b981',
          fillColor: '#064e3b',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          opacity: 0.8,
          zIndex: 6,
        },
        {
          id: 'c-summary-txt',
          type: 'text',
          x: 80,
          y: 450,
          width: 630,
          height: 70,
          text: 'SUMMARY (2-3 concise sentences distilling the entire session):',
          fontSize: 13,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 'bold',
          fontStyle: 'normal',
          strokeColor: '#a7f3d0',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: 7,
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Starter Blueprint Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onLoadTemplate(tmpl.title, tmpl.getElements());
                onClose();
              }}
              className="group p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    {tmpl.icon}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{tmpl.category}</span>
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors mb-1">
                  {tmpl.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  {tmpl.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-indigo-400 font-medium">
                <span>Load Template</span>
                <Sparkles className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
