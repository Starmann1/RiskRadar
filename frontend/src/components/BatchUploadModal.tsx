import React, { useState } from "react";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2 } from "lucide-react";

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchProcessed: (count: number) => void;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onBatchProcessed
}) => {
  const [fileSelected, setFileSelected] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  if (!isOpen) return null;

  const handleSimulateUpload = () => {
    setFileSelected("OIL_Upper_Assam_Monthly_HSSE_Reports_March_2026.csv");
    setIsProcessing(true);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setCompletedCount(48);
          setTimeout(() => {
            onBatchProcessed(48);
            onClose();
          }, 1000);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
              <UploadCloud className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Batch CSV / Excel Report Ingestion
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Bulk ingest monthly UA/UC & near-miss logs across OIL installations
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div
            className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-6 text-center space-y-3 bg-slate-50 hover:bg-cyan-50/40 transition cursor-pointer"
            onClick={handleSimulateUpload}
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 m-0">
                {fileSelected ? fileSelected : "Click to select or drag & drop HSSE CSV file"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 m-0">
                Supports standard OIL KAVACH / SAP HSSE exported formats (.csv, .xlsx)
              </p>
            </div>
          </div>

          {/* Streaming Progress */}
          {isProcessing && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Streaming AI/NLP Triage...</span>
                <span className="font-mono text-cyan-700">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Extracting evidence spans, normalizing taxonomy, and computing SIF density rankings...
              </p>
            </div>
          )}

          {completedCount > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Successfully parsed and scored <strong>{completedCount}</strong> reports into the database!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSimulateUpload}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-sm transition cursor-pointer"
            >
              {isProcessing ? "Processing..." : "Process Sample Batch (48 Reports)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
