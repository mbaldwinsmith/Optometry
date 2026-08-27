import React from 'react';
import { PatientRow, EyeRx, LensTypeOption } from '../types/optometry';
import { calculateOptometryLineItems, calculateTotalAmount } from '../utils/pricing';
import { generateDementiaCareExplanation } from '../utils/dementiaCareExplainer';
import { Edit3, FileText, Receipt, Eye } from 'lucide-react';
import { exportPatientReportPdf, exportPatientInvoicePdf } from '../utils/pdfGenerator';

interface PatientEditorProps {
  patient: PatientRow;
  onUpdatePatient: (updatedPatient: PatientRow) => void;
}

export const PatientEditor: React.FC<PatientEditorProps> = ({
  patient,
  onUpdatePatient,
}) => {
  const handleFundingToggle = (newFunding: 'NHS' | 'Private') => {
    const updatedLineItems = calculateOptometryLineItems(
      newFunding,
      patient.dispense,
      patient.spexRx.hasPrescription
    );
    const updated: PatientRow = {
      ...patient,
      funding: newFunding,
      lineItems: updatedLineItems,
      totalAmount: calculateTotalAmount(updatedLineItems),
    };
    onUpdatePatient(updated);
  };

  const handleEyeRxChange = (eye: 'rightEye' | 'leftEye', field: keyof EyeRx, value: string) => {
    const updatedSpex = {
      ...patient.spexRx,
      [eye]: {
        ...patient.spexRx[eye],
        [field]: value,
      },
    };

    const dementia = generateDementiaCareExplanation(
      patient.residentFullName,
      updatedSpex,
      patient.dispense,
      patient.notes
    );

    const updatedLineItems = calculateOptometryLineItems(
      patient.funding,
      patient.dispense,
      updatedSpex.hasPrescription
    );

    onUpdatePatient({
      ...patient,
      spexRx: updatedSpex,
      dementiaExplanation: dementia,
      lineItems: updatedLineItems,
      totalAmount: calculateTotalAmount(updatedLineItems),
    });
  };

  const handleLensTypeChange = (lensType: LensTypeOption) => {
    const updatedDispense = {
      ...patient.dispense,
      lensType,
    };

    const dementia = generateDementiaCareExplanation(
      patient.residentFullName,
      patient.spexRx,
      updatedDispense,
      patient.notes
    );

    const updatedLineItems = calculateOptometryLineItems(
      patient.funding,
      updatedDispense,
      patient.spexRx.hasPrescription
    );

    onUpdatePatient({
      ...patient,
      dispense: updatedDispense,
      dementiaExplanation: dementia,
      lineItems: updatedLineItems,
      totalAmount: calculateTotalAmount(updatedLineItems),
    });
  };

  const handleDispenseChange = (field: string, value: any) => {
    const updatedDispense = {
      ...patient.dispense,
      [field]: value,
    };

    const dementia = generateDementiaCareExplanation(
      patient.residentFullName,
      patient.spexRx,
      updatedDispense,
      patient.notes
    );

    const updatedLineItems = calculateOptometryLineItems(
      patient.funding,
      updatedDispense,
      patient.spexRx.hasPrescription
    );

    onUpdatePatient({
      ...patient,
      dispense: updatedDispense,
      dementiaExplanation: dementia,
      lineItems: updatedLineItems,
      totalAmount: calculateTotalAmount(updatedLineItems),
    });
  };

  const handleFieldChange = (field: keyof PatientRow, value: any) => {
    onUpdatePatient({ ...patient, [field]: value });
  };

  const isMultifocal = patient.dispense.lensType === 'Bifocal Lenses' || patient.dispense.lensType === 'Varifocal / Progressive Lenses';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 font-display">
            <Edit3 className="w-4 h-4 text-brand-blue flex-shrink-0" />
            <span>Edit Resident Record: {patient.residentFullName}</span>
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500">
            Changes update preview documents and PDFs immediately in-memory.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-mono text-brand-blue font-bold">{patient.reportRef}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-600">ID: {patient.blinkId}</span>
        </div>
      </div>

      {/* Funding Selector & Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div>
          <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-1.5">
            Funding Scheme
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleFundingToggle('NHS')}
              className={`py-1.5 px-2 rounded-md text-xs font-bold transition border ${
                patient.funding === 'NHS'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              NHS (GOS 3)
            </button>
            <button
              type="button"
              onClick={() => handleFundingToggle('Private')}
              className={`py-1.5 px-2 rounded-md text-xs font-bold transition border ${
                patient.funding === 'Private'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Private (£60)
            </button>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-1.5">
            Examination Date
          </label>
          <input
            type="text"
            value={patient.appointmentDate}
            onChange={(e) => handleFieldChange('appointmentDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:ring-1 focus:ring-brand-blue outline-none font-mono"
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-1.5 flex items-center justify-between">
            <span>Next Exam (+2 Yrs)</span>
            <span className="text-[9px] text-brand-blue font-semibold">Recall Due</span>
          </label>
          <input
            type="text"
            value={patient.nextExamDate}
            onChange={(e) => handleFieldChange('nextExamDate', e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:ring-1 focus:ring-brand-blue outline-none font-mono font-bold text-brand-blue"
            placeholder="DD/MM/YYYY"
          />
        </div>
      </div>

      {/* Optical Prescription (Spex Rx) Live Inputs */}
      <div className="border border-slate-200 rounded-lg p-3 bg-white">
        <h4 className="font-bold text-brand-navy text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 font-display">
          <Eye className="w-3.5 h-3.5 text-brand-blue" />
          <span>Optical Prescription (Spex Rx)</span>
        </h4>
        
        {/* Right Eye */}
        <div className="mb-2.5">
          <span className="text-[10px] font-bold text-slate-600 block mb-1">Right Eye (OD)</span>
          <div className="grid grid-cols-6 gap-1.5 text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 block">SPH</span>
              <input
                type="text"
                value={patient.spexRx.rightEye.sph}
                onChange={(e) => handleEyeRxChange('rightEye', 'sph', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono font-bold text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">CYL</span>
              <input
                type="text"
                value={patient.spexRx.rightEye.cyl}
                onChange={(e) => handleEyeRxChange('rightEye', 'cyl', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Axis</span>
              <input
                type="text"
                value={patient.spexRx.rightEye.axis}
                onChange={(e) => handleEyeRxChange('rightEye', 'axis', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Prism</span>
              <input
                type="text"
                value={patient.spexRx.rightEye.prism}
                onChange={(e) => handleEyeRxChange('rightEye', 'prism', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-brand-blue font-bold block">Near Add</span>
              <input
                type="text"
                value={patient.spexRx.rightEye.nearAdd}
                onChange={(e) => handleEyeRxChange('rightEye', 'nearAdd', e.target.value)}
                className="w-full border border-blue-300 bg-blue-50/50 rounded p-1 text-center font-mono font-bold text-xs text-brand-blue"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">PD (mm)</span>
              <input
                type="text"
                value={patient.spexRx.rightEye.pd}
                onChange={(e) => handleEyeRxChange('rightEye', 'pd', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Left Eye */}
        <div>
          <span className="text-[10px] font-bold text-slate-600 block mb-1">Left Eye (OS)</span>
          <div className="grid grid-cols-6 gap-1.5 text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 block">SPH</span>
              <input
                type="text"
                value={patient.spexRx.leftEye.sph}
                onChange={(e) => handleEyeRxChange('leftEye', 'sph', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono font-bold text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">CYL</span>
              <input
                type="text"
                value={patient.spexRx.leftEye.cyl}
                onChange={(e) => handleEyeRxChange('leftEye', 'cyl', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Axis</span>
              <input
                type="text"
                value={patient.spexRx.leftEye.axis}
                onChange={(e) => handleEyeRxChange('leftEye', 'axis', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Prism</span>
              <input
                type="text"
                value={patient.spexRx.leftEye.prism}
                onChange={(e) => handleEyeRxChange('leftEye', 'prism', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[9px] text-brand-blue font-bold block">Near Add</span>
              <input
                type="text"
                value={patient.spexRx.leftEye.nearAdd}
                onChange={(e) => handleEyeRxChange('leftEye', 'nearAdd', e.target.value)}
                className="w-full border border-blue-300 bg-blue-50/50 rounded p-1 text-center font-mono font-bold text-xs text-brand-blue"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">PD (mm)</span>
              <input
                type="text"
                value={patient.spexRx.leftEye.pd}
                onChange={(e) => handleEyeRxChange('leftEye', 'pd', e.target.value)}
                className="w-full border border-slate-300 rounded p-1 text-center font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lens Type & Spectacle Dispensing Details */}
      <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
        <div>
          <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-1.5">
            Lens &amp; Dispensing Configuration
          </label>
          <select
            value={patient.dispense.lensType}
            onChange={(e) => handleLensTypeChange(e.target.value as LensTypeOption)}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 focus:ring-1 focus:ring-brand-blue outline-none font-semibold text-slate-800"
          >
            <option value="Single Vision (Distance & Near)">Single Vision (Separate Distance & Near Pairs)</option>
            <option value="Single Vision Near (Reading Only)">Single Vision Near (Reading Only)</option>
            <option value="Single Vision Distance Only">Single Vision Distance Only</option>
            <option value="Bifocal Lenses">Bifocal Lenses (All-in-One)</option>
            <option value="Varifocal / Progressive Lenses">Varifocal / Progressive Lenses (All-in-One)</option>
            <option value="No Spectacles Required">No Spectacles Required</option>
          </select>
        </div>

        {isMultifocal ? (
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {patient.dispense.lensType} Frame Model &amp; Colour
            </label>
            <input
              type="text"
              value={patient.dispense.bifocalFrame || patient.dispense.distFrame || ''}
              onChange={(e) => handleDispenseChange('bifocalFrame', e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
              placeholder="e.g. Stepper SI 6012 Titanium Wine"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Distance Frame Model &amp; Colour</label>
              <input
                type="text"
                value={patient.dispense.distFrame || ''}
                onChange={(e) => handleDispenseChange('distFrame', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
                placeholder="e.g. Solo 837 Purple 52 (or '-' if not needed)"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reading / Near Frame Model &amp; Colour</label>
              <input
                type="text"
                value={patient.dispense.nearFrame || ''}
                onChange={(e) => handleDispenseChange('nearFrame', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
                placeholder="e.g. Solo 226 Bronze Flex Hinge (or '-' if not needed)"
              />
            </div>
          </div>
        )}
      </div>

      {/* Eyecare Guide Live Override */}
      <div>
        <label className="font-semibold text-slate-700 block mb-1">
          Eyecare Guide Vision Summary (Plain English)
        </label>
        <textarea
          rows={3}
          value={patient.dementiaExplanation.summary}
          onChange={(e) => {
            const updatedDementia = {
              ...patient.dementiaExplanation,
              summary: e.target.value,
            };
            onUpdatePatient({ ...patient, dementiaExplanation: updatedDementia });
          }}
          className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none leading-relaxed"
        />
      </div>

      {/* Clinical Consultation Notes */}
      <div>
        <label className="font-semibold text-slate-700 block mb-1">Clinician Consultation Notes</label>
        <textarea
          rows={2}
          value={patient.notes || ''}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
          placeholder="Consultation notes, GOS 3 status, SOS advice..."
        />
      </div>

      {/* PDF Export Shortcuts */}
      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-[10px] sm:text-[11px] text-slate-500 italic">
          Export individual files named with resident name &amp; reference:
        </span>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            type="button"
            onClick={() => exportPatientReportPdf(patient)}
            className="flex items-center justify-center gap-1.5 bg-brand-soft hover:bg-brand-soft-hover text-brand-navy border border-brand-soft-dark px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-brand-blue" />
            <span>Download Report</span>
          </button>
          <button
            type="button"
            onClick={() => exportPatientInvoicePdf(patient)}
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-600" />
            <span>Download Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
