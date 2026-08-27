import React from 'react';
import { CareHomeSummary, PatientRow } from '../../types/optometry';
import { CareHomeReport } from './CareHomeReport';
import { OptometryReport } from './OptometryReport';
import { OptometryInvoice } from './OptometryInvoice';

interface BatchPrintContainerProps {
  summary: CareHomeSummary;
  patients: PatientRow[];
}

export const BatchPrintContainer: React.FC<BatchPrintContainerProps> = ({ summary, patients }) => {
  const seenPatients = patients.filter((p) => p.seen);

  return (
    <div className="print-only hidden">
      {/* 1. Care Home Summary Report */}
      <CareHomeReport summary={summary} />

      {/* 2. Patient Reports & Invoices */}
      {seenPatients.map((patient) => (
        <React.Fragment key={patient.id}>
          <div className="page-break">
            <OptometryReport patient={patient} />
          </div>
          <div className="page-break">
            <OptometryInvoice patient={patient} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
