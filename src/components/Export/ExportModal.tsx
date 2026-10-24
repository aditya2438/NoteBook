import React, { useState } from 'react';
import {
  X,
  FileImage,
  Code2,
  FileText,
  Database,
  Download,
  Upload,
  Check,
} from 'lucide-react';
import { CanvasElement, NoteItem, Viewport } from '../../types';
import {
  exportCanvasToPng,
  exportCanvasToSvg,
  downloadFile,
} from '../../utils/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  viewport: Viewport;
  activeNote: NoteItem;
  onImportNote: (noteData: Partial<NoteItem>) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  elements,
  viewport,
  activeNote,
  onImportNote,
}) => {
  const [includeBackground, setIncludeBackground] = useState(true);
  const [pngScale, setPngScale] = useState<number>(2);
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await exportCanvasToPng(elements, viewport, pngScale, includeBackground);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${activeNote.title.toLowerCase().replace(/\s+/g, '_')}_${pngScale}x.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSvg = () => {
    const svgStr = exportCanvasToSvg(elements, includeBackground);
    downloadFile(
      svgStr,
      `${activeNote.title.toLowerCase().replace(/\s+/g, '_')}.svg`,
      'image/svg+xml'
    );
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // High-res snapshot opened in printable layout
      const dataUrl = await exportCanvasToPng(elements, viewport, 2, includeBackground);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${activeNote.title} - Nexora Notes PDF</title>
              <style>
                @page { size: auto; margin: 15mm; }
                body { background: #000; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; color: #fff; }
                img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
                .footer { margin-top: 10px; font-size: 11px; color: #888; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" alt="${activeNote.title}" />
              <div class="footer">Exported from Nexora Notes · ${new Date().toLocaleDateString()}</div>
              <script>
                setTimeout(() => { window.print(); }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    const backupData = JSON.stringify(activeNote, null, 2);
    downloadFile(
      backupData,
      `${activeNote.title.toLowerCase().replace(/\s+/g, '_')}_backup.json`,
      'application/json'
    );
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.elements && Array.isArray(parsed.elements)) {
          onImportNote(parsed);
          setImportStatus('Note imported successfully!');
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1200);
        } else {
          setImportStatus('Invalid Nexora note format.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Export & Backup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options Body */}
        <div className="p-6 space-y-5">
          {/* Settings */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300">
            <span>Include AMOLED Math Grid</span>
            <input
              type="checkbox"
              checked={includeBackground}
              onChange={(e) => setIncludeBackground(e.target.checked)}
              className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* PNG Export */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <FileImage className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">PNG Image</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Retina or ultra 4K resolution bitmap image.
                </p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPngScale(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        pngScale === s
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}x {s === 2 ? '(Retina)' : s === 4 ? '(4K)' : ''}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleExportPng}
                disabled={isExporting}
                className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </button>
            </div>

            {/* SVG Vector */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-indigo-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Vector SVG</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Infinitely scalable vectors for Illustrator, Figma, or print.
                </p>
              </div>
              <button
                onClick={handleExportSvg}
                className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save SVG</span>
              </button>
            </div>

            {/* PDF Document */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-purple-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">PDF Document</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Print-ready formatted document with centered layout.
                </p>
              </div>
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print to PDF</span>
              </button>
            </div>

            {/* JSON Backup */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">JSON Archive</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Complete note state backup for portability and offline restore.
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save JSON</span>
              </button>
            </div>
          </div>

          {/* Import JSON Section */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span>Have a Nexora backup file?</span>
            </div>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Download Complete Project Source Code ZIP */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-cyan-950/40 border border-indigo-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Full Project Source Code (.zip)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Production-ready code, PostgreSQL schema & CI workflows
              </p>
            </div>
            <a
              href="/nexora-notes-pro.zip"
              download="nexora-notes-pro.zip"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              <span>Download ZIP</span>
            </a>
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
