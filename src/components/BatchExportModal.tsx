import React from 'react';
import { Archive } from 'lucide-react';

interface BatchExportModalProps {
  isOpen: boolean;
  current: number;
  total: number;
  percent: number;
  status: string;
  itemTitle: string;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  percent,
  status,
  itemTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <Archive className="w-7 h-7 animate-bounce" />
        </div>

        <div>
          <h3 className="font-extrabold text-base text-slate-900 font-display">
            Compiling Batch ZIP Archive
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Generating individual A4 PDFs for reports, statements, and summaries.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600 font-semibold">
            <span>{status}</span>
            <span className="font-mono text-brand-blue">{percent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">
            {itemTitle}
          </p>
        </div>
      </div>
    </div>
  );
};
