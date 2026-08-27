import { LensTypeOption } from '../types/optometry';

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

  // 1. Bifocal / Varifocal Frame
  const biMatch = text.match(/(?:Bifocal|Varifocal|Multifocal|Progressive|Bifocal frame|Varifocal frame):\s*([^;\n\r,]+)/i);
  const bifocalFrame = biMatch ? biMatch[1].trim() : '';

  // 2. Distance frame: e.g. "Dist: solo 837 purple 52"
  const distMatch = text.match(/(?:Dist|Distance|Distance frame|Dist frame):\s*([^;\n\r,]+)/i);
  let distFrame = distMatch ? distMatch[1].trim() : '';

  // 3. Near frame: e.g. "Near: solo 226 bronze flex hinge"
  const nearMatch = text.match(/(?:Near|Reading|Near frame|Read frame|Read):\s*([^;\n\r,]+)/i);
  let nearFrame = nearMatch ? nearMatch[1].trim() : '';

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

  // If bifocal/varifocal frame is captured but placed in Dist/Near, consolidate
  if ((lensType === 'Bifocal Lenses' || lensType === 'Varifocal / Progressive Lenses') && !bifocalFrame) {
    const frameMatch = text.match(/(?:Frame):\s*([^;\n\r,]+)/i);
    if (frameMatch) {
      distFrame = '';
      nearFrame = '';
    }
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
    const pdTotalMatch = text.match(/(?:PDs?|PD):\s*(\d{2})/i);
    if (pdTotalMatch) pd = pdTotalMatch[1];
  }

  // 7. SOS Advice
  const sosAdviceGiven = /SOS advice/i.test(text) || true;

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
