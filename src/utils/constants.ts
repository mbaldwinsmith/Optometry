import { CompanyDetails } from '../types/optometry';

export const COMPANY_DETAILS: CompanyDetails = {
  name: 'EliteSight HomeCare Ltd',
  regNo: '16396660',
  subtitle: 'Professional Eye & Hearing Care, Delivered to Your Door',
  address: '60B Green End Road, Cambridge, England, CB4 1RY',
  phone: '0800 865 4488',
  email: 'info@elitesighthomecare.com',
  website: 'elitesighthomecare.com',
  bankName: 'SUMUP LIMITED',
  sortCode: '04-14-50',
  accountNo: '63846695',
  swift: 'SUPAGB2LXXX',
  iban: 'GB65SUPA04145063846695',
};

export const PRICING_CONFIG = {
  NHS_SIGHT_TEST: 0.0,
  PRIVATE_SIGHT_TEST: 60.0,
  GOS3_VOUCHER_A: 42.40,
  GOS3_VOUCHER_B: 65.00,
  PRIVATE_FRAME_STANDARD: 45.00,
  PRIVATE_FRAME_PREMIUM: 75.00,
  PAYMENT_TERMS_DAYS: 7,
  VAT_RATE: 0.0,
};

export const CSV_REQUIRED_COLUMNS = [
  'Care Home',
  'Post Code',
  'Examination Date',
  'DOB',
  'Optometrist',
  'Resident First Name',
  'Resident Surname',
  'Seen?',
] as const;

export const DEFAULT_SOS_ADVICE = 
  'Contact EliteSight HomeCare (0800 865 4488) or Care Staff immediately if experiencing: sudden vision reduction, dark curtains/shadows in field of vision, flashes of light with new floaters, or severe eye pain with redness.';
