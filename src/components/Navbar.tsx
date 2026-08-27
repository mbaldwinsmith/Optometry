import React, { useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Lock,
  Trash2,
  KeyRound,
  Building2,
  Users
} from 'lucide-react';
import { CareHomeSummary } from '../types/optometry';
import { generateCsvTemplate } from '../utils/sampleData';

interface NavbarProps {
  summary: CareHomeSummary | null;
  onFileUpload: (file: File) => void;
  onLoadSampleData: () => void;
  onPurgeData: () => void;
  onLockSession: () => void;
  onOpenPinModal: (mode: 'unlock' | 'change') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  summary,
  onFileUpload,
  onLoadSampleData,
  onPurgeData,
  onLockSession,
  onOpenPinModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'EliteSight_Optometry_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <header className="no-print bg-brand-navy text-white border-b border-brand-navy-dark shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm">
              <img src="./logo.png" alt="EliteSight HomeCare" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight font-display text-white">
                  EliteSight HomeCare
                </h1>
                <span className="bg-brand-blue/30 text-sky-200 border border-brand-blue/50 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  Optometry
                </span>
              </div>
              <p className="text-[10px] text-slate-300 hidden sm:block">
                Care Home Consultation Portal &amp; Clinical Document Generator
              </p>
            </div>
          </div>

          {/* Center Stats (if dataset loaded) */}
          {summary && (
            <div className="hidden md:flex items-center gap-4 bg-brand-navy-dark/70 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold text-slate-200 truncate max-w-[160px]">
                  {summary.careHome}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong className="text-white">{summary.seenPatientsCount}</strong> / {summary.totalPatients} Examined
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="text-sky-300 font-mono font-semibold">
                NHS: {summary.nhsCount} • Priv: {summary.privateCount}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-brand-blue hover:bg-sky-600 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
              title="Upload Blink or Care Home CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload CSV</span>
            </button>

            {!summary && (
              <button
                onClick={onLoadSampleData}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                title="Load 10-patient demonstration data"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Sample Data</span>
              </button>
            )}

            <button
              onClick={handleDownloadTemplate}
              className="hidden lg:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
              title="Download CSV Schema Template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Template</span>
            </button>

            {/* PIN Lock & Security Menu */}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2 ml-1">
              <button
                onClick={() => onOpenPinModal('change')}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Change 4-Digit Security PIN"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              <button
                onClick={onLockSession}
                className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                title="Lock Session Now"
              >
                <Lock className="w-4 h-4" />
              </button>

              {summary && (
                <button
                  onClick={onPurgeData}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition"
                  title="Purge in-memory consultation session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
