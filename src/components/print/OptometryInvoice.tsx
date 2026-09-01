import React from 'react';
import { PatientRow } from '../../types/optometry';
import { COMPANY_DETAILS } from '../../utils/constants';

interface OptometryInvoiceProps {
  patient: PatientRow;
}

export const OptometryInvoice: React.FC<OptometryInvoiceProps> = ({ patient }) => {
  return (
    <div className="font-sans text-slate-800 text-xs">
      <div className="a4-page p-8 md:p-10 flex flex-col justify-between leading-relaxed">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-brand-navy pb-3 mb-5">
            <div className="flex items-center gap-3">
              <img src="./logo.png" alt="EliteSight HomeCare" className="h-11 w-11 object-contain" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-brand-blue font-display">
                  {COMPANY_DETAILS.name}
                </div>
                <h1 className="text-lg font-bold text-brand-navy uppercase tracking-tight font-display">
                  Optometry Statement / Invoice
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider">
                  DOMICILIARY EYECARE MEDICAL BILLING
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold text-brand-navy font-mono">{patient.invoiceNo}</div>
              <p className="text-[10px] text-slate-500 font-medium">Issue Date: {patient.appointmentDate}</p>
            </div>
          </div>

          {/* Bill-To Grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[11px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Billed To (Resident / Care Facility)</span>
              <div className="font-bold text-slate-900 text-sm">{patient.residentFullName}</div>
              <div className="text-slate-700">{patient.careHome}</div>
              <div className="text-slate-500">{patient.postCode}</div>
              <div className="text-[10px] text-slate-400 mt-1">DOB: {patient.dob} | ID: {patient.blinkId}</div>
            </div>

            <div className="bg-brand-soft border border-brand-soft-dark rounded-md p-3 text-[11px] flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Payment Summary</span>
                <div className="flex justify-between items-center text-slate-700 mb-1">
                  <span>Funding Scheme:</span>
                  <strong className="text-brand-navy">{patient.funding === 'NHS' ? 'NHS Funded' : 'Private Funding'}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Due Date:</span>
                  <strong className="text-brand-navy">{patient.dueDate}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-brand-soft-dark flex justify-between items-center">
                <span className="font-bold text-brand-navy">Total Due (GBP):</span>
                <span className="text-base font-extrabold text-brand-navy font-mono">£{patient.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Itemized Services & Dispense Table */}
          <div className="mb-5">
            <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider">
              Itemized Eyecare Services &amp; Spectacle Dispensing
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-brand-soft text-brand-navy font-semibold border-b border-slate-200">
                    <th className="py-2 px-3 w-8">#</th>
                    <th className="py-2 px-3">Description &amp; Frame Specification</th>
                    <th className="py-2 px-3 text-center w-16">Qty</th>
                    <th className="py-2 px-3 text-right w-24">Unit Price</th>
                    <th className="py-2 px-3 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patient.lineItems.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-1.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{item.description}</td>
                      <td className="py-1.5 px-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-1.5 px-3 text-right text-slate-600">£{item.unitPrice.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-bold text-slate-900">£{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {patient.lineItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 px-3 text-center text-slate-400 italic">
                        No billable items. Sight test covered under NHS General Ophthalmic Services.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 text-slate-600 text-[11px]">
                    <td colSpan={4} className="py-1.5 px-3 text-right">Subtotal:</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold">£{patient.totalAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 text-[11px]">
                    <td colSpan={4} className="py-1 px-3 text-right">VAT (0% Medical Exemption):</td>
                    <td className="py-1 px-3 text-right font-mono">£0.00</td>
                  </tr>
                  <tr className="bg-brand-soft/80 border-t-2 border-brand-navy font-bold text-brand-navy text-xs">
                    <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider">Total Balance Due (GBP):</td>
                    <td className="py-2 px-3 text-right text-sm font-extrabold font-mono">£{patient.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Remittance & Payment Details */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-white mb-4">
            <div className="text-xs font-bold text-brand-navy uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>BACS Direct Bank Transfer Instructions</span>
              <span className="text-[10px] text-slate-500 font-normal">Terms: 7 Days from Invoice</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Bank Name</span>
                <span className="font-semibold text-slate-800">{COMPANY_DETAILS.bankName}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Sort Code</span>
                <span className="font-mono font-bold text-slate-900">{COMPANY_DETAILS.sortCode}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Account Number</span>
                <span className="font-mono font-bold text-slate-900">{COMPANY_DETAILS.accountNo}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Payment Reference</span>
                <span className="font-mono font-bold text-brand-blue">{patient.invoiceNo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-300 pt-2.5 text-[10px] text-slate-500 flex justify-between items-center">
          <div>
            <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span> | Reg No: {COMPANY_DETAILS.regNo}
          </div>
          <div className="font-medium text-slate-600">
            {COMPANY_DETAILS.phone} | {COMPANY_DETAILS.email}
          </div>
        </div>
      </div>
    </div>
  );
};
