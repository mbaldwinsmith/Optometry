import React, { useState, useEffect, useRef } from 'react';
import { CareHomeSummary, PatientRow, ValidationError } from './types/optometry';
import { parseOptometryCsv } from './utils/csvParser';
import { SAMPLE_OPTOMETRY_CSV } from './utils/sampleData';
import { exportBatchZipArchive } from './utils/pdfGenerator';
import { INACTIVITY_TIMEOUT_MS } from './utils/security';
import { runSelfVerificationTests } from './utils/testVerification';

import { Navbar } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { BatchManager } from './components/BatchManager';
import { PinLockModal } from './components/PinLockModal';
import { BatchExportModal } from './components/BatchExportModal';

export const App: React.FC = () => {
  const [summary, setSummary] = useState<CareHomeSummary | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationError[]>([]);

  const [pinModalMode, setPinModalMode] = useState<'unlock' | 'change' | null>(null);

  // Batch Export Progress
  const [exportProgress, setExportProgress] = useState<{
    isOpen: boolean;
    current: number;
    total: number;
    percent: number;
    status: string;
    itemTitle: string;
  }>({
    isOpen: false,
    current: 0,
    total: 0,
    percent: 0,
    status: '',
    itemTitle: '',
  });

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset Inactivity Timer on user interaction
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      if (patients.length > 0) {
        setPinModalMode('unlock');
      }
    }, INACTIVITY_TIMEOUT_MS);
  };

  useEffect(() => {
    // Run self-test sanity verification on initial mount
    runSelfVerificationTests();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [patients.length]);

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    const result = await parseOptometryCsv(text);
    setSummary(result.careHomeSummary);
    setPatients(result.patients);
    setErrors(result.errors);
    setWarnings(result.warnings);
  };

  const handleLoadSampleData = async () => {
    const result = await parseOptometryCsv(SAMPLE_OPTOMETRY_CSV);
    setSummary(result.careHomeSummary);
    setPatients(result.patients);
    setErrors(result.errors);
    setWarnings(result.warnings);
  };

  const handlePurgeData = () => {
    if (window.confirm('Are you sure you want to purge in-memory consultation records?')) {
      setSummary(null);
      setPatients([]);
      setErrors([]);
      setWarnings([]);
    }
  };

  const handleUpdatePatient = (updated: PatientRow) => {
    const newPatients = patients.map((p) => (p.id === updated.id ? updated : p));
    setPatients(newPatients);

    if (summary) {
      const seen = newPatients.filter((p) => p.seen);
      const unseen = newPatients.filter((p) => !p.seen);
      const totalRev = seen.reduce((sum, p) => sum + p.totalAmount, 0);
      const nhsCount = seen.filter((p) => p.funding === 'NHS').length;
      const privateCount = seen.filter((p) => p.funding === 'Private').length;
      const spectaclesOrderedCount = seen.filter((p) => p.dispense.distFrame !== '-' || p.dispense.nearFrame !== '-').length;

      setSummary({
        ...summary,
        seenPatients: seen,
        unseenPatients: unseen,
        totalRevenue: totalRev,
        nhsCount,
        privateCount,
        spectaclesOrderedCount,
      });
    }
  };

  const handlePrintSingle = () => {
    window.print();
  };

  const handleExportBatchZip = async () => {
    if (!summary || patients.length === 0) return;

    setExportProgress({
      isOpen: true,
      current: 0,
      total: 1 + summary.seenPatientsCount * 2,
      percent: 0,
      status: 'Initializing batch PDF generator...',
      itemTitle: summary.careHome,
    });

    try {
      await exportBatchZipArchive(summary, patients, (prog) => {
        setExportProgress({
          isOpen: true,
          current: prog.current,
          total: prog.total,
          percent: prog.percent,
          status: prog.status,
          itemTitle: prog.itemTitle,
        });
      });
    } finally {
      setTimeout(() => {
        setExportProgress((prev) => ({ ...prev, isOpen: false }));
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar
        summary={summary}
        onFileUpload={handleFileUpload}
        onLoadSampleData={handleLoadSampleData}
        onPurgeData={handlePurgeData}
        onLockSession={() => {
          setPinModalMode('unlock');
        }}
        onOpenPinModal={(mode) => setPinModalMode(mode)}
      />

      <main className="flex-1">
        {!summary ? (
          <EmptyState
            onFileUpload={handleFileUpload}
            onLoadSampleData={handleLoadSampleData}
          />
        ) : (
          <BatchManager
            summary={summary}
            patients={patients}
            errors={errors}
            warnings={warnings}
            onUpdatePatient={handleUpdatePatient}
            onPrintSingle={handlePrintSingle}
            onPrintBatch={handlePrintSingle}
            onExportBatchZip={handleExportBatchZip}
          />
        )}
      </main>

      {/* PIN Security Modal */}
      <PinLockModal
        isOpen={pinModalMode !== null}
        mode={pinModalMode || 'unlock'}
        onUnlockSuccess={() => {
          setPinModalMode(null);
        }}
        onCloseChangeModal={() => setPinModalMode(null)}
      />

      {/* Batch ZIP Export Modal */}
      <BatchExportModal
        isOpen={exportProgress.isOpen}
        current={exportProgress.current}
        total={exportProgress.total}
        percent={exportProgress.percent}
        status={exportProgress.status}
        itemTitle={exportProgress.itemTitle}
      />
    </div>
  );
};
