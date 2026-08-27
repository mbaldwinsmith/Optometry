import { LensTypeOption } from '../types/optometry';
import { toTitleCase } from './cleaners';

function cleanExtractedFrame(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/(?:Near|Reading|Read|Dist|Distance|Bifocal|Varifocal|Multifocal|PD|Distance PDs?|SOS|GOS).*$/i, '')
    .replace(/[;\.\,\-]+$/, '')
    .trim();
}

export function parseClinicalNotes(notesText?: string): {
  distFrame: string;
  nearFrame: string;
  bifocalFrame: string;
  lensType: LensTypeOption;
  voucherType: string;
  pd: string;
  sosAdviceGiven: boolean;
  cleanedNotes: string;
} {
  if (!notesText) {
    return {
      distFrame: '',
      nearFrame: '',
      bifocalFrame: '',
      lensType: 'Single Vision (Distance & Near)',
      voucherType: 'GOS 3',
      pd: '64',
      sosAdviceGiven: true,
      cleanedNotes: '',
    };
  }

  const text = notesText.trim();

  // 1. Bifocal / Varifocal Frame e.g. "Bifocal: Stepper SI 6012 Titanium Wine"
  const biMatch = text.match(/(?:Bifocal|Varifocal|Multifocal|Progressive)(?:\s*frame)?:\s*([^;\n\r\.]+)/i);
  let bifocalFrame = biMatch ? cleanExtractedFrame(biMatch[1]) : '';

  // 2. Distance frame e.g. "Dist: Solo 837 purple 52." or "Dist frame: ..."
  const distMatch = text.match(/(?:Dist|Distance)(?:\s*frame)?:\s*([^;\n\r\.]+)/i);
  let distFrame = distMatch ? cleanExtractedFrame(distMatch[1]) : '';

  // 3. Near frame e.g. "Near: Solo 226 bronze flex hinge." or "Reading: ..."
  const nearMatch = text.match(/(?:Near|Reading|Read)(?:\s*frame)?:\s*([^;\n\r\.]+)/i);
  let nearFrame = nearMatch ? cleanExtractedFrame(nearMatch[1]) : '';

  // 4. Lens Type detection
  let lensType: LensTypeOption = 'Single Vision (Distance & Near)';
  if (/varifocal|progressive/i.test(text)) {
    lensType = 'Varifocal / Progressive Lenses';
  } else if (/bifocal/i.test(text)) {
    lensType = 'Bifocal Lenses';
  } else if (distFrame && !nearFrame) {
    lensType = 'Single Vision Distance Only';
  } else if (nearFrame && !distFrame) {
    lensType = 'Single Vision Near (Reading Only)';
  } else if (distFrame && nearFrame) {
    lensType = 'Single Vision (Distance & Near)';
  }

  // 5. Voucher Type / GOS
  let voucherType = '';
  if (/GOS\s*3/i.test(text)) voucherType = 'GOS 3 Optical Voucher';
  if (/Voucher\s*A/i.test(text)) voucherType = 'GOS 3 (Voucher A)';
  if (/Voucher\s*B/i.test(text)) voucherType = 'GOS 3 (Voucher B)';
  if (!voucherType && (distFrame || nearFrame || bifocalFrame)) voucherType = 'GOS 3';

  // 6. PD e.g. "Distance PDs 32 R+L" or "PD 64"
  let pd = '64';
  const pdMonoMatch = text.match(/(?:PDs?|Distance PDs?):\s*(\d{2})\s*(?:R\+?L|R\s*and\s*L|both)/i);
  if (pdMonoMatch) {
    const mono = parseInt(pdMonoMatch[1], 10);
    pd = (mono * 2).toString();
  } else {
    const pdTotalMatch = text.match(/(?:Distance\s*)?PDs?:\s*(\d{2})/i);
    if (pdTotalMatch) pd = pdTotalMatch[1];
  }

  // 7. SOS Advice
  const sosAdviceGiven = /SOS advice/i.test(text) || true;

  // Titlecase frame names for clean professional presentation
  if (distFrame) distFrame = toTitleCase(distFrame);
  if (nearFrame) nearFrame = toTitleCase(nearFrame);
  if (bifocalFrame) bifocalFrame = toTitleCase(bifocalFrame);

  return {
    distFrame,
    nearFrame,
    bifocalFrame,
    lensType,
    voucherType,
    pd,
    sosAdviceGiven,
    cleanedNotes: text,
  };
}
