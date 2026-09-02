import React from 'react';
import { PatientRow } from '../../types/optometry';
import { COMPANY_DETAILS } from '../../utils/constants';
import { formatDobDisplay } from '../../utils/cleaners';

interface OptometryReportProps {
  patient: PatientRow;
}

export const OptometryReport: React.FC<OptometryReportProps> = ({ patient }) => {
  const rx = patient.spexRx;
  const dispense = patient.dispense;
  const dementia = patient.dementiaExplanation;
  const isMultifocal = dispense.lensType === 'Bifocal Lenses' || dispense.lensType === 'Varifocal / Progressive Lenses';

  return (
    <div className="font-sans text-slate-800 text-xs">
      <div className="a4-page p-8 md:p-10 flex flex-col justify-between leading-relaxed">
        <div>
          {/* Header */}
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
                <h1 className="text-lg font-extrabold text-brand-navy uppercase tracking-tight font-display">
                  Eyecare &amp; Vision Summary
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider">
                  DOMICILIARY OPTOMETRIC ASSESSMENT &amp; SPECTACLE GUIDE
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-brand-soft text-brand-navy border border-brand-soft-dark px-2.5 py-1 rounded font-mono font-bold text-xs">
                Ref: {patient.reportRef}
              </span>
            </div>
          </div>

          {/* Metadata Ribbon */}
          <div className="bg-brand-soft border border-brand-soft-dark rounded-md px-3.5 py-2 mb-3.5 grid grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">Care Home: </span>
              <strong className="text-brand-navy font-semibold">{patient.careHome}</strong>
            </div>
            <div>
              <span className="text-slate-500">Exam Date: </span>
              <strong className="text-brand-navy font-semibold">{patient.appointmentDate}</strong>
            </div>
            <div>
              <span className="text-slate-500">Next Due (+1 Yr): </span>
              <strong className="text-brand-blue font-bold">{patient.nextExamDate}</strong>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                patient.funding === 'NHS'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {patient.funding === 'NHS' ? 'NHS Funded' : 'Private Funded'}
              </span>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className="border border-slate-200 rounded-md p-3 bg-white mb-3.5 grid grid-cols-4 gap-y-2 gap-x-4 text-[11px]">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Resident Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.residentFullName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
              <span className="font-semibold text-slate-700">{formatDobDisplay(patient.dob)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ID</span>
              <span className="font-mono font-semibold text-brand-navy">{patient.blinkId}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Optometrist</span>
              <span className="font-semibold text-slate-700">{patient.optometrist}</span>
            </div>
          </div>

          {/* Optical Prescription (Spex Rx) Table */}
          <div className="mb-3.5">
            <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Optical Prescription (Spex Rx)</span>
              <span className="text-[10px] font-normal text-brand-soft">Binocular PD: {rx.binocularPd} mm</span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white">
              <table className="w-full text-center border-collapse text-[11px]">
                <thead>
                  <tr className="bg-brand-soft text-brand-navy font-semibold border-b border-slate-200 text-[10px] uppercase">
                    <th className="py-1.5 px-2 text-left w-20">Eye</th>
                    <th className="py-1.5 px-2">SPH</th>
                    <th className="py-1.5 px-2">CYL</th>
                    <th className="py-1.5 px-2">Axis</th>
                    <th className="py-1.5 px-2">Prism</th>
                    <th className="py-1.5 px-2 font-bold text-brand-blue">Near Add</th>
                    <th className="py-1.5 px-2">Int Add</th>
                    <th className="py-1.5 px-2">PD (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-1.5 px-2 text-left font-sans font-bold text-slate-800 bg-slate-50/50">
                      Right (OD)
                    </td>
                    <td className="py-1.5 px-2 font-bold text-slate-900">{rx.rightEye.sph}</td>
                    <td className="py-1.5 px-2 text-slate-700">{rx.rightEye.cyl}</td>
                    <td className="py-1.5 px-2 text-slate-700">{rx.rightEye.axis !== '-' ? rx.rightEye.axis + '°' : '-'}</td>
                    <td className="py-1.5 px-2 text-slate-500">{rx.rightEye.prism}</td>
                    <td className="py-1.5 px-2 font-bold text-brand-blue bg-blue-50/40">{rx.rightEye.nearAdd}</td>
                    <td className="py-1.5 px-2 text-slate-500">{rx.rightEye.intAdd}</td>
                    <td className="py-1.5 px-2 text-slate-700">{rx.rightEye.pd}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-left font-sans font-bold text-slate-800 bg-slate-50/50">
                      Left (OS)
                    </td>
                    <td className="py-1.5 px-2 font-bold text-slate-900">{rx.leftEye.sph}</td>
                    <td className="py-1.5 px-2 text-slate-700">{rx.leftEye.cyl}</td>
                    <td className="py-1.5 px-2 text-slate-700">{rx.leftEye.axis !== '-' ? rx.leftEye.axis + '°' : '-'}</td>
                    <td className="py-1.5 px-2 text-slate-500">{rx.leftEye.prism}</td>
                    <td className="py-1.5 px-2 font-bold text-brand-blue bg-blue-50/40">{rx.leftEye.nearAdd}</td>
                    <td className="py-1.5 px-2 text-slate-500">{rx.leftEye.intAdd}</td>
                    <td className="py-1.5 px-2 text-slate-700">{rx.leftEye.pd}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Eyecare Guide */}
          <div className="mb-3.5 border-2 border-brand-blue/30 bg-blue-50/40 rounded-md p-3">
            <div className="flex items-center justify-between mb-1.5 border-b border-brand-blue/20 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-blue inline-block"></span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-brand-navy font-display">
                  Eyecare Guide
                </h3>
              </div>
              <span className="text-[10px] bg-brand-soft text-brand-navy border border-brand-soft-dark px-2 py-0.5 rounded font-semibold">
                Care Staff &amp; Family Reference
              </span>
            </div>
            
            <p className="text-[11px] text-slate-800 leading-snug mb-2 font-medium">
              {dementia.summary}
            </p>

            {isMultifocal ? (
              <div className="bg-white border border-slate-200 rounded p-2.5 mb-2 text-[11px]">
                <div className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                  <span className="text-brand-blue font-extrabold">👓</span>
                  <span>All-in-One Spectacles ({dispense.lensType})</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  {dementia.multifocalAdvice || 'Look straight ahead for distance and TV; look through the lower portion for reading and meals.'}
                </p>
              </div>
            ) : dispense.lensType === 'Existing Spectacles Retained (No Change Needed)' ? (
              <div className="bg-white border border-slate-200 rounded p-2.5 mb-2 text-[11px]">
                <div className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                  <span className="text-brand-blue font-extrabold">👓</span>
                  <span>Existing Spectacles Retained</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Resident was fully tested. Existing spectacles are in good order and suitable for continued daily wear without prescription changes.
                </p>
              </div>
            ) : dispense.lensType === 'No Spectacles Required' ? (
              <div className="bg-white border border-slate-200 rounded p-2.5 mb-2 text-[11px]">
                <div className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                  <span className="text-brand-blue font-extrabold">👓</span>
                  <span>No Spectacles Required</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Resident was fully examined. Visual health is good and no corrective spectacles are required at this time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white border border-slate-200 rounded p-2.5 mb-2">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                    <span className="text-brand-blue font-extrabold">👓</span>
                    <span>Distance Vision &amp; Room Glasses</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {dementia.distanceAdvice || (dispense.distFrame && dispense.distFrame !== '-' ? `Wear ${dispense.distFrame} for TV and walking.` : 'No separate distance glasses required.')}
                  </p>
                </div>
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                    <span className="text-brand-blue font-extrabold">📖</span>
                    <span>Reading &amp; Close Work Glasses</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {dementia.nearAdvice || (dispense.nearFrame && dispense.nearFrame !== '-' ? `Wear ${dispense.nearFrame} for reading and meals.` : 'No separate reading glasses required.')}
                  </p>
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-700 bg-slate-100/80 rounded p-1.5 flex items-center justify-between">
              <div>
                <strong>Frame Identification: </strong> {dementia.frameIdentification}
              </div>
            </div>
          </div>

          {/* Spectacles Dispensing Details */}
          <div className="mb-3.5">
            <div className="bg-brand-navy text-white px-3 py-1.5 rounded-t-md font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Dispensing &amp; Spectacle Details</span>
              <span className="text-[10px] font-normal text-brand-soft">{dispense.lensType}</span>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-md p-3 bg-white grid grid-cols-3 gap-3 text-[11px]">
              {isMultifocal ? (
                <div className="col-span-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Multifocal / Bifocal Frame</span>
                  <span className="font-bold text-slate-800">{dispense.bifocalFrame || dispense.distFrame || dispense.nearFrame || 'Frame issued'}</span>
                </div>
              ) : dispense.lensType === 'Existing Spectacles Retained (No Change Needed)' ? (
                <div className="col-span-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Eyewear Status</span>
                  <span className="font-bold text-slate-800">Existing spectacles retained (No change needed)</span>
                </div>
              ) : dispense.lensType === 'No Spectacles Required' ? (
                <div className="col-span-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Eyewear Status</span>
                  <span className="font-bold text-slate-800">No spectacles required</span>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance Frame</span>
                    <span className="font-bold text-slate-800">{dispense.distFrame || 'None issued'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Reading / Near Frame</span>
                    <span className="font-bold text-slate-800">{dispense.nearFrame || 'None issued'}</span>
                  </div>
                </>
              )}
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Funding Scheme</span>
                <span className="font-bold text-brand-navy">{patient.funding === 'NHS' ? 'NHS Funded' : 'Private Dispense'}</span>
                {(dispense.hasMar || dispense.hasReactions) && (
                  <div className="mt-1 text-[9px] text-brand-blue font-semibold">
                    Extras: {[dispense.hasMar ? 'MAR' : '', dispense.hasReactions ? 'Reactions' : ''].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SOS Advice Warning Box */}
          <div className="mb-3 border-2 border-amber-300 bg-amber-50/70 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-amber-800 font-extrabold text-[11px] uppercase tracking-wide">
                ⚠️ SOS Emergency Advice &amp; Warning Symptoms
              </span>
              <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold ml-auto">
                Action Protocol
              </span>
            </div>
            <p className="text-[10px] text-amber-950 leading-snug">
              Contact EliteSight HomeCare (<strong>0800 865 4488</strong>) or care staff immediately if resident experiences <strong>sudden vision loss, dark shadows/curtains, flashes of light with new floaters, or severe eye pain with redness</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-300 pt-2.5 text-[10px] text-slate-500 flex justify-between items-center">
          <div>
            <span className="font-semibold text-slate-700">{COMPANY_DETAILS.name}</span> | Reg No: {COMPANY_DETAILS.regNo} | {COMPANY_DETAILS.address}
          </div>
          <div className="font-medium text-slate-600">
            Tel: {COMPANY_DETAILS.phone} | {COMPANY_DETAILS.email}
          </div>
        </div>
      </div>
    </div>
  );
};
