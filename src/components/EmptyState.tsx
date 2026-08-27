import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Glasses,
  Brain,
  ShieldCheck,
  CalendarCheck,
  Download
} from 'lucide-react';
import { generateCsvTemplate } from '../utils/sampleData';

interface EmptyStateProps {
  onFileUpload: (file: File) => void;
  onLoadSampleData: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onFileUpload,
  onLoadSampleData,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      onFileUpload(file);
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
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Welcome */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-brand-soft border border-brand-soft-dark text-brand-navy px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Glasses className="w-4 h-4 text-brand-blue" />
          <span>Care Home Optometry Batch Document Generator</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          Generate Pixel-Perfect Eyecare Summaries &amp; Invoices
        </h2>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-2 leading-relaxed">
          Ingest PMS exports or care home consultation spreadsheets in seconds. Automatically format Spex prescriptions, generate plain-English eyecare guides, calculate +2 year recalls, and export A4 clinical PDFs.
        </p>
      </div>

      {/* Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 bg-white shadow-sm ${
          isDragging
            ? 'border-brand-blue bg-sky-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileUpload(file);
          }}
          accept=".csv"
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-brand-soft border border-brand-soft-dark text-brand-blue flex items-center justify-center mx-auto mb-4 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
          Drop Care Home Consultation CSV Here
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
          Supports PMS exports and standard care home visit rosters with automatic column mapping.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="bg-brand-navy hover:bg-brand-navy-dark text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            Browse CSV File
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSampleData();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Load 10-Resident Sample</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadTemplate();
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Feature Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-2.5">
            <Glasses className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 text-xs mb-1">Optical Prescription Grid</h4>
          <p className="text-[11px] text-slate-500 leading-snug">
            Parses SPH, CYL, Axis, Prism, Near Add, and PD with standardized clinical formatting.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
            <Brain className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 text-xs mb-1">Eyecare Guide</h4>
          <p className="text-[11px] text-slate-500 leading-snug">
            Plain-English explanation of Distance, Reading, and Bifocal/Varifocal glasses, frame colors, and SOS advice.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 text-xs mb-1">+2 Year Automatic Recall</h4>
          <p className="text-[11px] text-slate-500 leading-snug">
            Calculates 24-month examination recalls with care home scheduling register and NHS GOS 3 status.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 text-xs mb-1">Zero-Retention Security</h4>
          <p className="text-[11px] text-slate-500 leading-snug">
            100% in-browser processing. Zero PID uploaded to cloud servers. PIN protected with auto-lock.
          </p>
        </div>
      </div>
    </div>
  );
};
