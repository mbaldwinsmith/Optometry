export function parseClinicalNotes(notesText?: string): {
  distFrame: string;
  nearFrame: string;
  interFrame: string;
  lensType: string;
  voucherType: string;
  pd: string;
  sosAdviceGiven: boolean;
  cleanedNotes: string;
} {
  if (!notesText) {
    return {
      distFrame: '',
      nearFrame: '',
      interFrame: '',
      lensType: 'Single Vision (SVD/SVN)',
      voucherType: 'GOS 3',
      pd: '64',
      sosAdviceGiven: true,
      cleanedNotes: '',
    };
  }

  const text = notesText.trim();

  // 1. Distance frame: e.g. "Dist: solo 837 purple 52"
  const distMatch = text.match(/(?:Dist|Distance|Distance frame|Dist frame):\s*([^;\n\r,]+)/i);
  const distFrame = distMatch ? distMatch[1].trim() : '';

  // 2. Near frame: e.g. "Near: solo 226 bronze flex hinge"
  const nearMatch = text.match(/(?:Near|Reading|Near frame|Read frame):\s*([^;\n\r,]+)/i);
  const nearFrame = nearMatch ? nearMatch[1].trim() : '';

  // 3. Intermediate / Bifocal frame
  const interMatch = text.match(/(?:Inter|Intermediate|Bifocal):\s*([^;\n\r,]+)/i);
  const interFrame = interMatch ? interMatch[1].trim() : '';

  // 4. Voucher Type / GOS
  let voucherType = '';
  if (/GOS\s*3/i.test(text)) voucherType = 'GOS 3 Optical Voucher';
  if (/Voucher\s*A/i.test(text)) voucherType = 'GOS 3 (Voucher A)';
  if (/Voucher\s*B/i.test(text)) voucherType = 'GOS 3 (Voucher B)';
  if (!voucherType && (distFrame || nearFrame)) voucherType = 'GOS 3';

  // 5. Lens Type
  let lensType = 'Single Vision (SVD / SVN)';
  if (/bifocal/i.test(text)) lensType = 'Bifocal Lenses';
  if (/varifocal/i.test(text)) lensType = 'Varifocal / Progressive';
  if (/SVD/i.test(text) && !/SVN/i.test(text)) lensType = 'Single Vision Distance (SVD)';
  if (/SVN/i.test(text) && !/SVD/i.test(text)) lensType = 'Single Vision Near (SVN)';

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
    interFrame,
    lensType,
    voucherType,
    pd,
    sosAdviceGiven,
    cleanedNotes: text,
  };
}
