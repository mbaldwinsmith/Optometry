import { EyeRx, SpexRx } from '../types/optometry';

export function formatDioptre(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === '') return '-';
  const str = String(val).trim().toUpperCase();
  if (str === 'PLANO' || str === 'PL' || str === '0' || str === '0.00') return 'PLANO';
  if (str === 'DS' || str === '-') return str;

  const num = parseFloat(str.replace('+', ''));
  if (isNaN(num)) return str;

  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  const absFormatted = Math.abs(num).toFixed(2);
  return sign ? `${sign}${absFormatted}` : absFormatted;
}

export function formatAxis(val: string | number | undefined | null): string {
  if (!val || val === '-') return '-';
  const num = parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(num)) return String(val);
  return Math.min(180, Math.max(1, num)).toString();
}

export function createDefaultEyeRx(): EyeRx {
  return {
    sph: 'PLANO',
    cyl: '-',
    axis: '-',
    prism: '-',
    nearAdd: '-',
    nearPrism: '-',
    intAdd: '-',
    intPrism: '-',
    pd: '32',
  };
}

export function parseRawRxString(rxText: string): Partial<EyeRx> {
  const res: Partial<EyeRx> = {};
  if (!rxText) return res;

  const sphMatch = rxText.match(/(?:SPH|Sph|Sphere)?\s*([+\-]\d+(?:\.\d+)?|PLANO|PL)/i);
  if (sphMatch) res.sph = formatDioptre(sphMatch[1]);

  const cylMatch = rxText.match(/(?:CYL|Cyl|Cylinder)?\s*([+\-]\d+(?:\.\d+)?|DS)/i);
  if (cylMatch && !cylMatch[1].startsWith('+') && !sphMatch) {
    res.cyl = formatDioptre(cylMatch[1]);
  } else if (cylMatch) {
    res.cyl = formatDioptre(cylMatch[1]);
  }

  const axisMatch = rxText.match(/(?:Axis|x|@|AXIS)?\s*(\d{1,3})(?:°|deg)?/i);
  if (axisMatch) res.axis = formatAxis(axisMatch[1]);

  const addMatch = rxText.match(/(?:Near Add|Add|Near|ADD)?\s*\+?(\d+(?:\.\d+)?)/i);
  if (addMatch) res.nearAdd = formatDioptre('+' + addMatch[1]);

  const pdMatch = rxText.match(/(?:PD|pd)?\s*(\d{2}(?:\.\d+)?)/i);
  if (pdMatch) res.pd = pdMatch[1];

  return res;
}

export function buildSpexRx(
  rightInput?: Partial<EyeRx> | string,
  leftInput?: Partial<EyeRx> | string,
  distancePdInput?: string
): SpexRx {
  const rightEye: EyeRx = { ...createDefaultEyeRx() };
  const leftEye: EyeRx = { ...createDefaultEyeRx() };

  if (typeof rightInput === 'string') {
    Object.assign(rightEye, parseRawRxString(rightInput));
  } else if (rightInput) {
    Object.assign(rightEye, rightInput);
  }

  if (typeof leftInput === 'string') {
    Object.assign(leftEye, parseRawRxString(leftInput));
  } else if (leftInput) {
    Object.assign(leftEye, leftInput);
  }

  const rightPdNum = parseFloat(rightEye.pd) || 32;
  const leftPdNum = parseFloat(leftEye.pd) || 32;
  const binocularPd = distancePdInput ? String(distancePdInput).trim() : (rightPdNum + leftPdNum).toString();

  const hasPrescription =
    rightEye.sph !== 'PLANO' ||
    rightEye.cyl !== '-' ||
    rightEye.nearAdd !== '-' ||
    leftEye.sph !== 'PLANO' ||
    leftEye.cyl !== '-' ||
    leftEye.nearAdd !== '-';

  return {
    rightEye,
    leftEye,
    binocularPd,
    hasPrescription,
  };
}
