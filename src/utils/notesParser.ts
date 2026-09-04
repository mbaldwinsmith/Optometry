import { LensTypeOption } from '../types/optometry';
import { toTitleCase } from './cleaners';

function cleanExtractedFrame(raw: string): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/(?:Near|Reading|Read|Dist|Distance|Bifocal|Varifocal|Multifocal|PD|Distance PDs?|SOS|GOS).*$/i, '')
    .replace(/[;\.\,\-]+$/, '')
    .trim();
  if (/^(?:none|nil|n\/a|no|no\s*specs|no\s*spectacles|-)$/i.test(cleaned)) {
    return '';
  }
  return cleaned;
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
  hasMar: boolean;
  hasReactions: boolean;
} {
  if (!notesText) {
    return {
      distFrame: '',
      nearFrame: '',
      bifocalFrame: '',
      lensType: 'No Spectacles Required',
      voucherType: 'NHS Funded',
      pd: '64',
      sosAdviceGiven: true,
      cleanedNotes: '',
      hasMar: false,
      hasReactions: false,
    };
  }

  const text = notesText.trim();

  // 1. Extras detection (MAR & Reactions)
  const hasMar = /MAR|anti-reflect|anti\s*reflect|anti-glare|antiglare/i.test(text);
  const hasReactions = /reactions?|transitions?|photochromic/i.test(text);

  // 2. Bifocal / Varifocal Frame e.g. "Bifocal: Stepper SI 6012 Titanium Wine"
  const biMatch = text.match(/(?:Bifocal|Varifocal|Multifocal|Progressive)(?:\s*frame)?:\s*([^;\n\r\.]+)/i);
  let bifocalFrame = biMatch ? cleanExtractedFrame(biMatch[1]) : '';

  // 3. Distance frame e.g. "Dist: Solo 837 purple 52." or "Dist frame: ..."
  const distMatch = text.match(/(?:Dist|Distance)(?:\s*frame)?:\s*([^;\n\r\.]+)/i);
  let distFrame = distMatch ? cleanExtractedFrame(distMatch[1]) : '';

  // 4. Near frame e.g. "Near: Solo 226 bronze flex hinge." or "Reading: ..."
  const nearMatch = text.match(/(?:Near|Reading|Read)(?:\s*frame)?:\s*([^;\n\r\.]+)/i);
  let nearFrame = nearMatch ? cleanExtractedFrame(nearMatch[1]) : '';

  // 5. Lens Type detection
  let lensType: LensTypeOption = 'No Spectacles Required';
  if (/no\s*spectacles\s*(?:required|needed|ordered)|no\s*glasses\s*(?:needed|required|ordered)|no\s*specs\s*(?:needed|required|ordered)|none\s*ordered|none\s*required|no\s*spectacles|no\s*glasses|declined\s*frame/i.test(text)) {
    lensType = 'No Spectacles Required';
  } else if (/existing\s*(?:kept|retained|in\s*good\s*order)|no\s*(?:prescription\s*)?change/i.test(text) && !distFrame && !nearFrame && !bifocalFrame) {
    lensType = 'Existing Spectacles Retained (No Change Needed)';
  } else if (/varifocal|progressive/i.test(text) || bifocalFrame.toLowerCase().includes('varifocal')) {
    lensType = 'Varifocal / Progressive Lenses';
  } else if (bifocalFrame || /bifocal/i.test(text)) {
    lensType = 'Bifocal Lenses';
  } else if (distFrame && nearFrame) {
    lensType = 'Single Vision (Distance & Near)';
  } else if (distFrame && !nearFrame) {
    lensType = 'Single Vision Distance Only';
  } else if (nearFrame && !distFrame) {
    lensType = 'Single Vision Near (Reading Only)';
  } else {
    lensType = 'No Spectacles Required';
  }

  // 6. Voucher Type / Funding
  let voucherType = 'NHS Funded';

  // 7. PD e.g. "Distance PDs 32 R+L" or "PD 64"
  let pd = '64';
  const pdMonoMatch = text.match(/(?:PDs?|Distance PDs?):\s*(\d{2})\s*(?:R\+?L|R\s*and\s*L|both)/i);
  if (pdMonoMatch) {
    const mono = parseInt(pdMonoMatch[1], 10);
    pd = (mono * 2).toString();
  } else {
    const pdTotalMatch = text.match(/(?:Distance\s*)?PDs?:\s*(\d{2})/i);
    if (pdTotalMatch) pd = pdTotalMatch[1];
  }

  // 8. SOS Advice
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
    hasMar,
    hasReactions,
  };
}
