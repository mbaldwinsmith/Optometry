import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CareHomeSummary, PatientRow } from '../types/optometry';
import { CareHomeReport } from '../components/print/CareHomeReport';
import { OptometryReport } from '../components/print/OptometryReport';
import { OptometryInvoice } from '../components/print/OptometryInvoice';

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function convertElementToPdfBlob(element: HTMLElement): Promise<Blob> {
  const pageElements = Array.from(element.querySelectorAll<HTMLElement>('.a4-page'));
  const targets = pageElements.length > 0 ? pageElements : [element];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < targets.length; i++) {
    const pageEl = targets[i];

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1024,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  return pdf.output('blob');
}

export async function renderReactNodeToPdfBlob(node: React.ReactElement): Promise<Blob> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.background = '#ffffff';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';

  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(node);

  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    const blob = await convertElementToPdfBlob(container);
    return blob;
  } finally {
    root.unmount();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

export async function exportPatientReportPdf(patient: PatientRow): Promise<void> {
  const filename = sanitizeFileName(
    patient.reportRef + '_' + patient.residentSurname + '_' + patient.residentFirstName + '_Eyecare_Report.pdf'
  );
  const blob = await renderReactNodeToPdfBlob(<OptometryReport patient={patient} />);
  triggerBlobDownload(blob, filename);
}

export async function exportPatientInvoicePdf(patient: PatientRow): Promise<void> {
  const filename = sanitizeFileName(
    patient.invoiceNo + '_' + patient.residentSurname + '_' + patient.residentFirstName + '_Invoice.pdf'
  );
  const blob = await renderReactNodeToPdfBlob(<OptometryInvoice patient={patient} />);
  triggerBlobDownload(blob, filename);
}

export async function exportCareHomeReportPdf(summary: CareHomeSummary): Promise<void> {
  const dateStr = summary.appointmentDate ? summary.appointmentDate.replace(/\//g, '-') : 'Visit';
  const filename = sanitizeFileName(
    summary.careHome + '_Care_Home_Optometry_Report_' + dateStr + '.pdf'
  );
  const blob = await renderReactNodeToPdfBlob(<CareHomeReport summary={summary} />);
  triggerBlobDownload(blob, filename);
}

export interface BatchProgressCallback {
  (progress: {
    current: number;
    total: number;
    percent: number;
    status: string;
    itemTitle: string;
  }): void;
}

export async function exportBatchZipArchive(
  summary: CareHomeSummary,
  patients: PatientRow[],
  onProgress?: BatchProgressCallback
): Promise<void> {
  const seenPatients = patients.filter((p) => p.seen);
  const totalDocs = 1 + seenPatients.length * 2;
  let currentDoc = 0;

  const zip = new JSZip();

  const safeCareHome = sanitizeFileName(summary.careHome || 'CareHome');
  const dateStr = summary.appointmentDate ? summary.appointmentDate.replace(/\//g, '-') : 'Date';
  const rootFolderName = safeCareHome + '_Optometry_' + dateStr;
  const folder = zip.folder(rootFolderName) || zip;

  const reportsFolder = folder.folder('Reports');
  const invoicesFolder = folder.folder('Invoices');

  // 1. Care Home Overview Report
  currentDoc++;
  if (onProgress) {
    onProgress({
      current: currentDoc,
      total: totalDocs,
      percent: Math.round((currentDoc / totalDocs) * 100),
      status: 'Generating Care Home Summary...',
      itemTitle: summary.careHome + ' Summary',
    });
  }

  const summaryBlob = await renderReactNodeToPdfBlob(<CareHomeReport summary={summary} />);
  const summaryFileName = '00_' + safeCareHome + '_Summary_Report_' + dateStr + '.pdf';
  folder.file(summaryFileName, summaryBlob);

  // 2. Loop through seen patients
  for (let i = 0; i < seenPatients.length; i++) {
    const patient = seenPatients[i];

    // Patient Report
    currentDoc++;
    if (onProgress) {
      onProgress({
        current: currentDoc,
        total: totalDocs,
        percent: Math.round((currentDoc / totalDocs) * 100),
        status: 'Generating Eyecare Report ' + (i + 1) + ' of ' + seenPatients.length + '...',
        itemTitle: patient.residentFullName + ' (Report)',
      });
    }

    const reportBlob = await renderReactNodeToPdfBlob(<OptometryReport patient={patient} />);
    const reportFileName = sanitizeFileName(
      patient.reportRef + '_' + patient.residentSurname + '_' + patient.residentFirstName + '_Report.pdf'
    );
    if (reportsFolder) {
      reportsFolder.file(reportFileName, reportBlob);
    } else {
      folder.file('Reports_' + reportFileName, reportBlob);
    }

    // Patient Invoice
    currentDoc++;
    if (onProgress) {
      onProgress({
        current: currentDoc,
        total: totalDocs,
        percent: Math.round((currentDoc / totalDocs) * 100),
        status: 'Generating Invoice ' + (i + 1) + ' of ' + seenPatients.length + '...',
        itemTitle: patient.residentFullName + ' (Invoice)',
      });
    }

    const invoiceBlob = await renderReactNodeToPdfBlob(<OptometryInvoice patient={patient} />);
    const invoiceFileName = sanitizeFileName(
      patient.invoiceNo + '_' + patient.residentSurname + '_' + patient.residentFirstName + '_Invoice.pdf'
    );
    if (invoicesFolder) {
      invoicesFolder.file(invoiceFileName, invoiceBlob);
    } else {
      folder.file('Invoices_' + invoiceFileName, invoiceBlob);
    }
  }

  // 3. Compress into ZIP
  if (onProgress) {
    onProgress({
      current: totalDocs,
      total: totalDocs,
      percent: 100,
      status: 'Packaging ZIP archive...',
      itemTitle: rootFolderName + '.zip',
    });
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFileName = rootFolderName + '.zip';
  triggerBlobDownload(zipBlob, zipFileName);
}
