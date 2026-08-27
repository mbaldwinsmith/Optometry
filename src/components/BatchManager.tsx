import React, { useState, useRef } from 'react';
import {
  CareHomeSummary,
  PatientRow,
  ValidationError,
} from '../types/optometry';
import { CareHomeReport } from './print/CareHomeReport';
import { OptometryReport } from './print/OptometryReport';
import { OptometryInvoice } from './print/OptometryInvoice';
import { BatchPrintContainer } from './print/BatchPrintContainer';
import { PatientEditor } from './PatientEditor';
import {
  Building,
  Receipt,
  Printer,
  Search,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Settings2,
  Users,
  Eye,
  Archive,
  FileDown,
  Loader2,
  Glasses
} from 'lucide-react';
import {
  exportCareHomeReportPdf,
  exportPatientReportPdf,
  exportPatientInvoicePdf,
} from '../utils/pdfGenerator';

interface BatchManagerProps {
  summary: CareHomeSummary;
  patients: PatientRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
  onUpdatePatient: (updatedPatient: PatientRow) => void;
  onPrintSingle: () => void;
  onPrintBatch: () => void;
  onExportBatchZip: () => void;
}

type ViewMode = 'care-home' | 'patient-report' | 'patient-invoice' | 'batch-print';
type MobilePane = 'patients' | 'preview';

export const BatchManager: React.FC<BatchManagerProps> = ({
  summary,
  patients,
  errors,
  warnings,
  onUpdatePatient,
  onPrintSingle,
  onPrintBatch: _onPrintBatch,
  onExportBatchZip,
}) => {
  const [activeTab, setActiveTab] = useState<ViewMode>('care-home');
  const [mobilePane, setMobilePane] = useState<MobilePane>('preview');
  const [isDownloadingCurrent, setIsDownloadingCurrent] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    summary.seenPatients[0]?.id || patients[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'seen' | 'unseen' | 'nhs' | 'private' | 'specs'>('all');
  const [showEditor, setShowEditor] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.residentFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.blinkId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reportRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'seen') return p.seen;
    if (filterType === 'unseen') return !p.seen;
    if (filterType === 'nhs') return p.funding === 'NHS';
    if (filterType === 'private') return p.funding === 'Private';
    if (filterType === 'specs') return p.dispense.distFrame !== '-' || p.dispense.nearFrame !== '-';
    return true;
  });

  const handlePatientSelect = (p: PatientRow) => {
    setSelectedPatientId(p.id);
    if (activeTab === 'care-home') {
      setActiveTab(p.seen ? 'patient-report' : 'care-home');
    }
    setMobilePane('preview');
  };

  const handleDownloadCurrentDoc = async () => {
    if (isDownloadingCurrent) return;
    setIsDownloadingCurrent(true);
    try {
      if (activeTab === 'care-home') {
        await exportCareHomeReportPdf(summary);
      } else if (activeTab === 'patient-report' && selectedPatient) {
        await exportPatientReportPdf(selectedPatient);
      } else if (activeTab === 'patient-invoice' && selectedPatient) {
        await exportPatientInvoicePdf(selectedPatient);
      }
    } finally {
      setIsDownloadingCurrent(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full min-w-0">
      {/* Validation Callouts */}
      {errors.length > 0 && (
        <div className="no-print mb-3 sm:mb-4 bg-rose-50 border border-rose-300 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">CSV Import Errors:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {errors.map((e, idx) => (
                <li key={idx}>Row {e.row}: {e.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="no-print mb-3 sm:mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice &amp; Warnings:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>Row {w.row}: {w.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile Segmented Switcher */}
      <div className="no-print lg:hidden mb-3 bg-slate-200/80 p-1 rounded-xl flex items-center shadow-inner">
        <button
          onClick={() => setMobilePane('patients')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
            mobilePane === 'patients'
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-brand-blue" />
          <span>Residents ({patients.length})</span>
        </button>

        <button
          onClick={() => setMobilePane('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
            mobilePane === 'preview'
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-brand-blue" />
          <span>Document Preview</span>
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full min-w-0">
        {/* Left Column: Patient Navigator (4 cols) */}
        <div
          className={`no-print lg:col-span-4 space-y-3 sm:space-y-4 w-full min-w-0 ${
            mobilePane === 'patients' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Facility Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm sm:text-base text-brand-navy truncate font-display">
                  {summary.careHome}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {summary.postCode} • Date: {summary.appointmentDate}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Optometrist: <strong className="text-slate-700">{summary.optometrist}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('care-home');
                  setMobilePane('preview');
                }}
                className="bg-brand-soft hover:bg-brand-soft-hover text-brand-navy border border-brand-soft-dark px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition"
              >
                <Building className="w-3.5 h-3.5 text-brand-blue" />
                <span>Visit Summary</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resident, Blink ID, ref..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1 text-[10px]">
              {[
                { id: 'all', label: `All (${patients.length})` },
                { id: 'seen', label: `Seen (${summary.seenPatientsCount})` },
                { id: 'nhs', label: `NHS (${summary.nhsCount})` },
                { id: 'private', label: `Private (${summary.privateCount})` },
                { id: 'specs', label: `Specs (${summary.spectaclesOrderedCount})` },
                { id: 'unseen', label: `Unseen (${summary.unseenPatientsCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-2 py-1 rounded-md font-semibold transition ${
                    filterType === f.id
                      ? 'bg-brand-navy text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resident List */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePatientSelect(p)}
                  className={`w-full text-left p-3 transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-brand-soft border-l-4 border-brand-blue'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {p.residentFullName}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        p.funding === 'NHS' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {p.funding}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>DOB: {p.dob}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{p.blinkId}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-brand-blue' : 'text-slate-300'}`} />
                </button>
              );
            })}
            {filteredPatients.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No residents match the search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview Workspace & Actions (8 cols) */}
        <div
          className={`lg:col-span-8 space-y-3 sm:space-y-4 w-full min-w-0 ${
            mobilePane === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Top Control Bar */}
          <div className="no-print bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('care-home')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'care-home'
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-brand-blue" />
                <span>Care Home Report</span>
              </button>

              <button
                onClick={() => setActiveTab('patient-report')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'patient-report'
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Glasses className="w-3.5 h-3.5 text-brand-blue" />
                <span>Patient Eyecare Summary</span>
              </button>

              <button
                onClick={() => setActiveTab('patient-invoice')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'patient-invoice'
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-slate-600" />
                <span>Invoice / Statement</span>
              </button>
            </div>

            {/* Document Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditor(!showEditor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ${
                  showEditor
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Toggle Live Editor Panel"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{showEditor ? 'Hide Editor' : 'Edit Record'}</span>
              </button>

              <button
                onClick={handleDownloadCurrentDoc}
                disabled={isDownloadingCurrent}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
                title="Download this document as high-resolution A4 PDF"
              >
                {isDownloadingCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-brand-blue" />
                )}
                <span>PDF</span>
              </button>

              <button
                onClick={onPrintSingle}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
                title="Print current document"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={onExportBatchZip}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                title="Download all PDFs in an organized ZIP archive"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Export Batch ZIP</span>
              </button>
            </div>
          </div>

          {/* Live Editor Panel (if toggled) */}
          {showEditor && selectedPatient && (
            <div className="no-print animate-in fade-in slide-in-from-top-2 duration-200">
              <PatientEditor
                patient={selectedPatient}
                onUpdatePatient={onUpdatePatient}
              />
            </div>
          )}

          {/* Live A4 Document Preview Card */}
          <div
            ref={previewContainerRef}
            className="overflow-x-auto bg-slate-200/80 p-4 sm:p-6 rounded-2xl shadow-inner flex justify-center min-h-[640px]"
          >
            {activeTab === 'care-home' && <CareHomeReport summary={summary} />}
            {activeTab === 'patient-report' && selectedPatient && (
              <OptometryReport patient={selectedPatient} />
            )}
            {activeTab === 'patient-invoice' && selectedPatient && (
              <OptometryInvoice patient={selectedPatient} />
            )}
          </div>
        </div>
      </div>

      {/* Hidden Batch Print Container for window.print() */}
      <BatchPrintContainer summary={summary} patients={patients} />
    </div>
  );
};
