import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CareHomeSummary, PatientRow } from '../types/optometry';
import { CareHomeReport } from '../components/print/CareHomeReport';
import { OptometryReport } from '../components/print/OptometryReport';
import { OptometryInvoice } from '../components/print/OptometryInvoice';
import { generateCleanedCsv } from './csvParser';

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  // Ensure custom and web fonts are fully loaded before capturing
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness errors
    }
  }

  const pageElements = Array.from(element.querySelectorAll<HTMLElement>('.a4-page'));
  const targets = pageElements.length > 0 ? pageElements : [element];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Standard A4 pixel dimensions at 96 DPI
  const a4WidthPx = 794;
  const a4HeightPx = 1123;

  for (let i = 0; i < targets.length; i++) {
    const pageEl = targets[i];

    // Capture at high resolution with exact 794px viewport width
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: a4WidthPx,
      height: a4HeightPx,
      windowWidth: a4WidthPx,
      windowHeight: a4HeightPx,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (_clonedDoc, clonedEl) => {
        // Enforce exact A4 bounds on cloned element
        const page = (clonedEl.classList.contains('a4-page') ? clonedEl : clonedEl.querySelector('.a4-page')) as HTMLElement || clonedEl;
        if (page) {
          page.style.width = '794px';
          page.style.minWidth = '794px';
          page.style.maxWidth = '794px';
          page.style.height = '1123px';
          page.style.minHeight = '1123px';
          page.style.maxHeight = '1123px';
          page.style.boxSizing = 'border-box';
          page.style.margin = '0';
          page.style.transform = 'none';
          page.style.boxShadow = 'none';
          page.style.position = 'relative';
          page.style.left = '0';
          page.style.top = '0';
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    // Exact A4 dimensions in mm: 210 x 297
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  return pdf.output('blob');
}

export async function renderReactNodeToPdfBlob(node: React.ReactElement): Promise<Blob> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.height = 'auto';
  container.style.background = '#ffffff';
  container.style.zIndex = '-9999';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'visible';

  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(node);

  // Allow React to mount, CSS to layout, and fonts & images to paint
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 250));

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
  const patientName =
    [patient.residentFirstName, patient.residentSurname].filter(Boolean).join(' ') ||
    patient.residentFullName ||
    'Resident';
  const filename = sanitizeFileName(`${patientName} - Eye Report.pdf`);
  const blob = await renderReactNodeToPdfBlob(<OptometryReport patient={patient} />);
  triggerBlobDownload(blob, filename);
}

export async function exportPatientInvoicePdf(patient: PatientRow): Promise<void> {
  const patientName =
    [patient.residentFirstName, patient.residentSurname].filter(Boolean).join(' ') ||
    patient.residentFullName ||
    'Resident';
  const filename = sanitizeFileName(`${patientName} - Invoice.pdf`);
  const blob = await renderReactNodeToPdfBlob(<OptometryInvoice patient={patient} />);
  triggerBlobDownload(blob, filename);
}

export async function exportCareHomeReportPdf(summary: CareHomeSummary): Promise<void> {
  const careHome = sanitizeFileName(summary.careHome?.trim() || 'Care Home');
  const filename = sanitizeFileName(`${careHome} - Care Home Summary Report.pdf`);
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

  const safeCareHome = sanitizeFileName(summary.careHome?.trim() || 'Care Home');
  const rootFolderName = safeCareHome;
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
      itemTitle: safeCareHome + ' Summary',
    });
  }

  const summaryBlob = await renderReactNodeToPdfBlob(<CareHomeReport summary={summary} />);
  const summaryFileName = sanitizeFileName(`00 - ${safeCareHome} - Summary Report.pdf`);
  folder.file(summaryFileName, summaryBlob);

  // Bundle Portable Cleaned CSV into ZIP root
  const cleanedCsvText = generateCleanedCsv(patients, true);
  const cleanedCsvFileName = sanitizeFileName(`00 - ${safeCareHome} - Cleaned Roster.csv`);
  folder.file(cleanedCsvFileName, cleanedCsvText);

  // 2. Loop through seen patients
  for (let i = 0; i < seenPatients.length; i++) {
    const patient = seenPatients[i];
    const patientName =
      [patient.residentFirstName, patient.residentSurname].filter(Boolean).join(' ') ||
      patient.residentFullName ||
      `Resident ${i + 1}`;

    // Patient Report
    currentDoc++;
    if (onProgress) {
      onProgress({
        current: currentDoc,
        total: totalDocs,
        percent: Math.round((currentDoc / totalDocs) * 100),
        status: 'Generating Eye Report ' + (i + 1) + ' of ' + seenPatients.length + '...',
        itemTitle: patientName + ' (Eye Report)',
      });
    }

    const reportBlob = await renderReactNodeToPdfBlob(<OptometryReport patient={patient} />);
    const reportFileName = sanitizeFileName(`${patientName} - Eye Report.pdf`);
    if (reportsFolder) {
      reportsFolder.file(reportFileName, reportBlob);
    } else {
      folder.file('Reports - ' + reportFileName, reportBlob);
    }

    // Patient Invoice
    currentDoc++;
    if (onProgress) {
      onProgress({
        current: currentDoc,
        total: totalDocs,
        percent: Math.round((currentDoc / totalDocs) * 100),
        status: 'Generating Invoice ' + (i + 1) + ' of ' + seenPatients.length + '...',
        itemTitle: patientName + ' (Invoice)',
      });
    }

    const invoiceBlob = await renderReactNodeToPdfBlob(<OptometryInvoice patient={patient} />);
    const invoiceFileName = sanitizeFileName(`${patientName} - Invoice.pdf`);
    if (invoicesFolder) {
      invoicesFolder.file(invoiceFileName, invoiceBlob);
    } else {
      folder.file('Invoices - ' + invoiceFileName, invoiceBlob);
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
