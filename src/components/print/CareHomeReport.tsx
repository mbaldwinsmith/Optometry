import React from 'react';
import { CareHomeSummary, PatientRow } from '../../types/optometry';
import { COMPANY_DETAILS } from '../../utils/constants';
import { formatDobDisplay, isPlaceholderDob } from '../../utils/cleaners';

interface CareHomeReportProps {
  summary: CareHomeSummary;
}

interface PageSectionChunk {
  items: PatientRow[];
  startIndex: number;
  isContinuation: boolean;
}

interface PageRecallChunk {
  items: { patientName: string; dob: string; nextExamDate: string }[];
  startIndex: number;
  isContinuation: boolean;
}

interface OptometryReportPage {
  pageIndex: number;
  isFirstPage: boolean;
  section1?: PageSectionChunk;
  section2?: PageRecallChunk;
  section3?: PageSectionChunk;
}

function paginateOptometryReport(
  seenPatients: PatientRow[],
  recalls: { patientName: string; dob: string; nextExamDate: string }[],
  unseenPatients: PatientRow[]
): OptometryReportPage[] {
  const pages: OptometryReportPage[] = [];

  const PAGE_1_BUDGET = 560;
  const PAGE_N_BUDGET = 820;
  const SECTION_HEADER_COST = 55;
  const ROW_COST = 30;
  const RECALL_ROW_COST = 34; // 2 recalls per row in grid
  const EMPTY_SECTION_COST = 36;
  const SECTION_GAP = 18;

  let currentPageIndex = 0;
  let currentBudget = PAGE_1_BUDGET;

  let currentPage: OptometryReportPage = {
    pageIndex: 0,
    isFirstPage: true,
  };

  function startNewPage() {
    pages.push(currentPage);
    currentPageIndex++;
    currentBudget = PAGE_N_BUDGET;
    currentPage = {
      pageIndex: currentPageIndex,
      isFirstPage: false,
    };
  }

  // 1. Process Section 1 (Residents Seen)
  if (seenPatients.length === 0) {
    currentPage.section1 = { items: [], startIndex: 0, isContinuation: false };
    currentBudget -= (SECTION_HEADER_COST + EMPTY_SECTION_COST + SECTION_GAP);
  } else {
    let sIndex = 0;
    while (sIndex < seenPatients.length) {
      const isCont = sIndex > 0;
      const availableRows = Math.floor((currentBudget - SECTION_HEADER_COST - SECTION_GAP) / ROW_COST);

      if (availableRows < 2 && (sIndex > 0 || !currentPage.isFirstPage)) {
        startNewPage();
        continue;
      }

      const chunkSize = Math.max(1, Math.min(Math.max(2, availableRows), seenPatients.length - sIndex));
      const chunk = seenPatients.slice(sIndex, sIndex + chunkSize);

      currentPage.section1 = {
        items: chunk,
        startIndex: sIndex,
        isContinuation: isCont,
      };

      currentBudget -= (SECTION_HEADER_COST + chunk.length * ROW_COST + SECTION_GAP);
      sIndex += chunkSize;

      if (sIndex < seenPatients.length) {
        startNewPage();
      }
    }
  }

  // 2. Process Section 2 (Recalls)
  if (recalls.length === 0) {
    const cost = SECTION_HEADER_COST + EMPTY_SECTION_COST + SECTION_GAP;
    if (currentBudget < cost && (currentPage.section1 || currentPage.section2 || currentPage.section3)) {
      startNewPage();
    }
    currentPage.section2 = { items: [], startIndex: 0, isContinuation: false };
    currentBudget -= cost;
  } else {
    let rIndex = 0;
    while (rIndex < recalls.length) {
      const isCont = rIndex > 0;
      const availableGridRows = Math.floor((currentBudget - SECTION_HEADER_COST - SECTION_GAP) / RECALL_ROW_COST);
      const availableRecalls = availableGridRows * 2;

      if (availableRecalls < 2 && (currentPage.section1 || currentPage.section2)) {
        startNewPage();
        continue;
      }

      const chunkSize = Math.max(1, Math.min(Math.max(2, availableRecalls), recalls.length - rIndex));
      const chunk = recalls.slice(rIndex, rIndex + chunkSize);

      currentPage.section2 = {
        items: chunk,
        startIndex: rIndex,
        isContinuation: isCont,
      };

      const gridRowsCount = Math.ceil(chunk.length / 2);
      currentBudget -= (SECTION_HEADER_COST + gridRowsCount * RECALL_ROW_COST + SECTION_GAP);
      rIndex += chunkSize;

      if (rIndex < recalls.length) {
        startNewPage();
      }
    }
  }

  // 3. Process Section 3 (Residents Not Seen)
  if (unseenPatients.length === 0) {
    const cost = SECTION_HEADER_COST + EMPTY_SECTION_COST + SECTION_GAP;
    if (currentBudget < cost && (currentPage.section1 || currentPage.section2 || currentPage.section3)) {
      startNewPage();
    }
    currentPage.section3 = { items: [], startIndex: 0, isContinuation: false };
    currentBudget -= cost;
  } else {
    let uIndex = 0;
    while (uIndex < unseenPatients.length) {
      const isCont = uIndex > 0;
      const availableRows = Math.floor((currentBudget - SECTION_HEADER_COST - SECTION_GAP) / ROW_COST);

      if (availableRows < 2 && (currentPage.section1 || currentPage.section2 || currentPage.section3)) {
        startNewPage();
        continue;
      }

      const chunkSize = Math.max(1, Math.min(Math.max(2, availableRows), unseenPatients.length - uIndex));
      const chunk = unseenPatients.slice(uIndex, uIndex + chunkSize);

      currentPage.section3 = {
        items: chunk,
        startIndex: uIndex,
        isContinuation: isCont,
      };

      currentBudget -= (SECTION_HEADER_COST + chunk.length * ROW_COST + SECTION_GAP);
      uIndex += chunkSize;

      if (uIndex < unseenPatients.length) {
        startNewPage();
      }
    }
  }

  pages.push(currentPage);
  return pages;
}

export const CareHomeReport: React.FC<CareHomeReportProps> = ({ summary }) => {
  const hasSeenDob = summary.seenPatients.some((p) => !isPlaceholderDob(p.dob));
  const pages = paginateOptometryReport(summary.seenPatients, summary.recalls, summary.unseenPatients);
  const totalPages = pages.length;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {pages.map((page, pageIdx) => (
        <div
          key={pageIdx}
          className="a4-page p-8 md:p-10 font-sans text-slate-800 flex flex-col justify-between text-xs leading-relaxed"
        >
          <div>
            {/* Document Header (Page 1: Full; Page 2+: Compact Continuation) */}
            {page.isFirstPage ? (
              <>
                <div className="flex items-center justify-between border-b-2 border-brand-navy pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="./logo.png"
                      alt="EliteSight HomeCare"
                      width="44"
                      height="44"
                      className="h-11 w-11 object-contain flex-shrink-0"
                      style={{ width: '44px', height: '44px', minWidth: '44px', maxWidth: '44px', maxHeight: '44px', objectFit: 'contain' }}
                    />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-brand-blue font-display">
                        {COMPANY_DETAILS.name}
                      </div>
                      <h1 className="text-lg font-bold text-brand-navy uppercase tracking-tight font-display">
                        Care Home Optometry Report
                      </h1>
                      <p className="text-[10px] text-slate-500 font-medium">{COMPANY_DETAILS.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px]">
                    <div className="font-semibold text-brand-navy text-sm">{summary.careHome}</div>
                    <div className="text-slate-600">{summary.postCode || 'Care Home Visit'}</div>
                    <div className="text-slate-500 mt-0.5">Date: <span className="font-semibold text-slate-700">{summary.appointmentDate}</span></div>
                    <div className="text-slate-500">Optometrist: <span className="font-semibold text-slate-700">{summary.optometrist}</span></div>
                  </div>
                </div>

                {/* Top KPI Ribbon */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-brand-soft border border-brand-soft-dark rounded-md p-2 text-center">
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-brand-navy">Total Patients</div>
                    <div className="text-base font-bold text-brand-navy mt-0.5">{summary.totalPatients}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-center">
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-emerald-800">Seen / Examined</div>
                    <div className="text-base font-bold text-emerald-700 mt-0.5">{summary.seenPatientsCount}</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-center">
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-blue-800">NHS Funded</div>
                    <div className="text-base font-bold text-blue-700 mt-0.5">{summary.nhsCount}</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-2 text-center">
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-purple-800">Spectacles Ordered</div>
                    <div className="text-base font-bold text-purple-700 mt-0.5">{summary.spectaclesOrderedCount}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between border-b border-brand-navy/30 pb-2.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <img
                    src="./logo.png"
                    alt="EliteSight HomeCare"
                    width="32"
                    height="32"
                    className="h-8 w-8 object-contain flex-shrink-0"
                    style={{ width: '32px', height: '32px', minWidth: '32px', maxWidth: '32px', maxHeight: '32px', objectFit: 'contain' }}
                  />
                  <div>
                    <h2 className="text-sm font-bold text-brand-navy uppercase tracking-tight">
                      Care Home Optometry Report (Cont.)
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {summary.careHome} • {summary.appointmentDate} • Optometrist: {summary.optometrist}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-brand-soft text-brand-navy border border-brand-soft-dark px-2.5 py-0.5 rounded text-[10px] font-bold">
                    Page {pageIdx + 1} of {totalPages}
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 1: Residents Seen */}
            {page.section1 && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
                  <h2 className="font-bold text-xs uppercase tracking-wider">
                    Section 1: Residents Seen {page.section1.isContinuation ? '(Continued)' : ''}
                  </h2>
                  <span className="text-[10px] font-medium text-brand-soft">
                    {page.section1.isContinuation
                      ? `Residents ${page.section1.startIndex + 1} - ${page.section1.startIndex + page.section1.items.length} of ${summary.seenPatients.length}`
                      : `${summary.seenPatients.length} Resident(s)`}
                  </span>
                </div>
                <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white">
                  {page.section1.items.length > 0 ? (
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-brand-soft text-brand-navy font-semibold border-b border-slate-200">
                          <th className="py-1 px-2.5 w-6">#</th>
                          <th className="py-1 px-2.5">Resident</th>
                          {hasSeenDob && <th className="py-1 px-2.5">DOB</th>}
                          <th className="py-1 px-2.5">ID</th>
                          <th className="py-1 px-2.5">Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {page.section1.items.map((p, idx) => {
                          let outcomeText = 'Spectacles ordered';
                          if (p.dispense.lensType === 'Existing Spectacles Retained (No Change Needed)') {
                            outcomeText = 'Existing spectacles retained (No change needed)';
                          } else if (p.dispense.lensType === 'No Spectacles Required') {
                            outcomeText = 'No spectacles required';
                          }

                          return (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                              <td className="py-1 px-2.5 text-slate-400 font-mono">{page.section1!.startIndex + idx + 1}</td>
                              <td className="py-1 px-2.5 font-semibold text-slate-800">{p.residentFullName}</td>
                              {hasSeenDob && <td className="py-1 px-2.5 text-slate-600">{formatDobDisplay(p.dob)}</td>}
                              <td className="py-1 px-2.5 font-mono text-brand-navy">{p.blinkId}</td>
                              <td className="py-1 px-2.5 text-slate-700 font-medium">{outcomeText}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-3 text-center text-slate-500 italic">No examined residents logged.</div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: Next Appointment Due */}
            {page.section2 && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
                  <h2 className="font-bold text-xs uppercase tracking-wider">
                    Section 2: Next Appointment Due {page.section2.isContinuation ? '(Continued)' : ''}
                  </h2>
                  <span className="text-[10px] text-brand-soft">
                    {page.section2.isContinuation
                      ? `Recalls ${page.section2.startIndex + 1} - ${page.section2.startIndex + page.section2.items.length} of ${summary.recalls.length}`
                      : 'Routine Recall Schedule'}
                  </span>
                </div>
                <div className="border border-t-0 border-slate-200 rounded-b-md p-2.5 bg-white">
                  {page.section2.items.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {page.section2.items.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded">
                          <div>
                            <strong className="text-slate-800">{r.patientName}</strong>
                            {r.dob && !isPlaceholderDob(r.dob) && (
                              <span className="text-slate-400 ml-1">({formatDobDisplay(r.dob)})</span>
                            )}
                          </div>
                          <div className="font-mono font-bold text-brand-blue">
                            Due: {r.nextExamDate}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No upcoming recalls scheduled.</p>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 3: Residents Not Seen */}
            {page.section3 && (
              <div className="mb-4">
                <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
                  <h2 className="font-bold text-xs uppercase tracking-wider">
                    Section 3: Residents Not Seen {page.section3.isContinuation ? '(Continued)' : ''}
                  </h2>
                  <span className="text-[10px] font-medium text-brand-soft">
                    {page.section3.isContinuation
                      ? `Residents ${page.section3.startIndex + 1} - ${page.section3.startIndex + page.section3.items.length} of ${summary.unseenPatients.length}`
                      : `${summary.unseenPatients.length} Resident(s)`}
                  </span>
                </div>
                <div className="border border-t-0 border-slate-200 rounded-b-md p-2.5 bg-white">
                  {page.section3.items.length > 0 ? (
                    <table className="w-full text-left text-[10px] border border-amber-200 rounded overflow-hidden">
                      <thead className="bg-amber-50 text-amber-900 font-semibold border-b border-amber-200">
                        <tr>
                          <th className="py-1 px-2.5 w-1/3">Resident</th>
                          <th className="py-1 px-2.5">Reason Not Seen / Action Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {page.section3.items.map((p) => {
                          const cleanReason = (p.reasonNotSeen || 'Resident did not attend (DNA) - Rescheduled for next routine visit')
                            .replace(/(?:-\s*)?Missing\s*(?:patient\s*|declaration\s*)?signature/gi, '')
                            .replace(/(?:-\s*)?Missing\s*signature/gi, '')
                            .trim() || 'Resident did not attend (DNA) - Rescheduled for next routine visit';

                          return (
                            <tr key={p.id} className="bg-amber-50/30">
                              <td className="py-1 px-2.5 font-semibold text-slate-800">{p.residentFullName}</td>
                              <td className="py-1 px-2.5 text-amber-950">{cleanReason}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">All scheduled residents were successfully examined today.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Report Footer on Every Page */}
          <div className="border-t border-slate-300 pt-2.5 text-[10px] text-slate-500 flex justify-between items-center">
            <div>
              <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span> | Reg No: {COMPANY_DETAILS.regNo}
            </div>
            <div className="text-center font-semibold text-brand-navy">
              Page {pageIdx + 1} of {totalPages}
            </div>
            <div className="font-medium text-slate-600">
              Tel: {COMPANY_DETAILS.phone} | {COMPANY_DETAILS.email}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
