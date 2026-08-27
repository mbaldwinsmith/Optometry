import React from 'react';
import { CareHomeSummary } from '../../types/optometry';
import { COMPANY_DETAILS } from '../../utils/constants';

interface CareHomeReportProps {
  summary: CareHomeSummary;
}

export const CareHomeReport: React.FC<CareHomeReportProps> = ({ summary }) => {
  return (
    <div className="a4-page p-8 md:p-10 font-sans text-slate-800 flex flex-col justify-between text-xs leading-relaxed">
      <div>
        {/* Document Header */}
        <div className="flex items-center justify-between border-b-2 border-brand-navy pb-3 mb-4">
          <div className="flex items-center gap-3">
            <img src="./logo.png" alt="EliteSight HomeCare" className="h-11 w-11 object-contain" />
            <div>
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
        <div className="grid grid-cols-5 gap-2.5 mb-4">
          <div className="bg-brand-soft border border-brand-soft-dark rounded-md p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-brand-navy">Total Patients</div>
            <div className="text-base font-bold text-brand-navy mt-0.5">{summary.totalPatients}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-emerald-800">Seen / Examined</div>
            <div className="text-base font-bold text-emerald-700 mt-0.5">{summary.seenPatientsCount}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-blue-800">NHS (GOS 3)</div>
            <div className="text-base font-bold text-blue-700 mt-0.5">{summary.nhsCount}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-md p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-purple-800">Spectacles Ordered</div>
            <div className="text-base font-bold text-purple-700 mt-0.5">{summary.spectaclesOrderedCount}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-semibold text-amber-800">Exceptions / Unseen</div>
            <div className="text-base font-bold text-amber-700 mt-0.5">{summary.unseenPatientsCount}</div>
          </div>
        </div>

        {/* SECTION 1: Financial & GOS Voucher Summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 1: Resident Eyecare &amp; Voucher Statement</h2>
            <span className="text-[10px] font-medium text-brand-soft">Terms: 7 Days from Visit</span>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-brand-soft text-brand-navy font-semibold border-b border-slate-200">
                  <th className="py-1 px-2.5 w-6">#</th>
                  <th className="py-1 px-2.5">Resident</th>
                  <th className="py-1 px-2.5">DOB</th>
                  <th className="py-1 px-2.5">Blink ID</th>
                  <th className="py-1 px-2.5">Funding</th>
                  <th className="py-1 px-2.5">Eyewear Ordered</th>
                  <th className="py-1 px-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.seenPatients.map((p, idx) => {
                  const frames: string[] = [];
                  if (p.dispense.distFrame && p.dispense.distFrame !== '-') frames.push('Dist: ' + p.dispense.distFrame);
                  if (p.dispense.nearFrame && p.dispense.nearFrame !== '-') frames.push('Near: ' + p.dispense.nearFrame);
                  const framesText = frames.length > 0 ? frames.join(' | ') : 'No new glasses';

                  return (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-1 px-2.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-1 px-2.5 font-semibold text-slate-800">{p.residentFullName}</td>
                      <td className="py-1 px-2.5 text-slate-600">{p.dob}</td>
                      <td className="py-1 px-2.5 font-mono text-brand-navy">{p.blinkId}</td>
                      <td className="py-1 px-2.5 font-semibold">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${p.funding === 'NHS' ? 'bg-emerald-50 text-emerald-800' : 'bg-purple-50 text-purple-800'}`}>
                          {p.funding}
                        </span>
                      </td>
                      <td className="py-1 px-2.5 text-slate-700 truncate max-w-[220px]">{framesText}</td>
                      <td className="py-1 px-2.5 text-right font-semibold text-slate-900">£{p.totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-brand-soft/80 border-t-2 border-brand-navy font-bold text-brand-navy text-[11px]">
                  <td colSpan={6} className="py-1.5 px-2.5 text-right uppercase tracking-wider">
                    Total Private Copay / Care Home Balance:
                  </td>
                  <td className="py-1.5 px-2.5 text-right text-brand-navy font-extrabold text-xs">
                    £{summary.totalRevenue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 2: 2-Year Recall Register */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 2: 2-Year Recall Register (+24 Months)</h2>
            <span className="text-[10px] text-brand-soft">Next Routine Visit Schedule</span>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md p-2.5 bg-white">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {summary.recalls.slice(0, 8).map((r, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded">
                  <div>
                    <strong className="text-slate-800">{r.patientName}</strong>
                    <span className="text-slate-400 ml-1">({r.dob})</span>
                  </div>
                  <div className="font-mono font-bold text-brand-blue">
                    Due: {r.nextExamDate}
                  </div>
                </div>
              ))}
            </div>
            {summary.recalls.length > 8 && (
              <p className="text-[9px] text-slate-400 text-right mt-1 italic">
                + {summary.recalls.length - 8} more residents scheduled for 2-year recall.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 3: Exceptions & Reschedules */}
        <div>
          <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md">
            <h2 className="font-bold text-xs uppercase tracking-wider">Section 3: Exceptions &amp; Reschedules Required</h2>
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-md p-2.5 bg-white">
            {summary.unseenPatients.length > 0 ? (
              <table className="w-full text-left text-[10px] border border-amber-200 rounded overflow-hidden">
                <thead className="bg-amber-50 text-amber-900 font-semibold border-b border-amber-200">
                  <tr>
                    <th className="py-1 px-2">Resident</th>
                    <th className="py-1 px-2">DOB</th>
                    <th className="py-1 px-2">Reason Not Seen / Action Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {summary.unseenPatients.map((p) => (
                    <tr key={p.id} className="bg-amber-50/30">
                      <td className="py-1 px-2 font-semibold text-slate-800">{p.residentFullName}</td>
                      <td className="py-1 px-2 text-slate-600">{p.dob}</td>
                      <td className="py-1 px-2 text-amber-950">{p.reasonNotSeen || 'Rescheduled for next visit'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[10px] text-slate-500 italic">All scheduled residents were successfully examined today.</p>
            )}
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div className="border-t border-slate-300 pt-2.5 text-[10px] text-slate-500 flex justify-between items-center">
        <div>
          <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span> | Reg No: {COMPANY_DETAILS.regNo}
        </div>
        <div className="font-medium text-slate-600">
          Bank: {COMPANY_DETAILS.bankName} | Sort: {COMPANY_DETAILS.sortCode} | Acc: {COMPANY_DETAILS.accountNo}
        </div>
      </div>
    </div>
  );
};
