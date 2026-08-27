export interface RawCsvRow {
  'Blink ID'?: string;
  'Patient ID'?: string;
  'Care Home'?: string;
  'Post Code'?: string;
  'Examination Date'?: string;
  'Last Full Examination'?: string;
  'Appointment Date'?: string;
  'DOB'?: string;
  'Optometrist'?: string;
  'Resident First Name'?: string;
  'Resident Surname'?: string;
  'Seen?'?: string;
  'Reason not seen'?: string;
  'Funding'?: string;
  'Right Eye Rx'?: string;
  'Left Eye Rx'?: string;
  'Right SPH'?: string;
  'Right CYL'?: string;
  'Right Axis'?: string;
  'Right Prism'?: string;
  'Right Near Add'?: string;
  'Right Int Add'?: string;
  'Left SPH'?: string;
  'Left CYL'?: string;
  'Left Axis'?: string;
  'Left Prism'?: string;
  'Left Near Add'?: string;
  'Left Int Add'?: string;
  'Distance PD'?: string;
  'Near PD'?: string;
  'Dispense Details'?: string;
  'Voucher Type'?: string;
  'Notes'?: string;
  [key: string]: string | undefined;
}

export interface EyeRx {
  sph: string;
  cyl: string;
  axis: string;
  prism: string;
  nearAdd: string;
  nearPrism: string;
  intAdd: string;
  intPrism: string;
  pd: string;
  va?: string;
}

export interface SpexRx {
  rightEye: EyeRx;
  leftEye: EyeRx;
  binocularPd: string;
  hasPrescription: boolean;
  rawSummary?: string;
}

export interface DispenseInfo {
  distFrame: string;
  nearFrame: string;
  interFrame?: string;
  lensType: string;
  voucherType: string;
  caseCloth: boolean;
}

export interface DementiaExplanation {
  summary: string;
  spectacleInstructions: string[];
  distanceAdvice: string;
  nearAdvice: string;
  frameIdentification: string;
  careAndCleaning: string;
  emergencySos: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  amount: number;
}

export interface PatientRow {
  id: string;
  blinkId: string;
  careHome: string;
  postCode: string;
  appointmentDate: string;
  nextExamDate: string;
  dob: string;
  optometrist: string;
  residentFirstName: string;
  residentSurname: string;
  residentFullName: string;
  seen: boolean;
  reasonNotSeen: string;
  funding: 'NHS' | 'Private';
  voucherType: string;
  spexRx: SpexRx;
  dispense: DispenseInfo;
  dementiaExplanation: DementiaExplanation;
  notes: string;
  sosAdviceGiven: boolean;
  reportRef: string;
  invoiceNo: string;
  careHomeInitials: string;
  patientInitials: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  totalAmount: number;
}

export interface RecallItem {
  patientName: string;
  dob: string;
  blinkId: string;
  lastExamDate: string;
  nextExamDate: string;
  recallReason: string;
  funding: 'NHS' | 'Private';
}

export interface CareHomeSummary {
  careHome: string;
  postCode: string;
  appointmentDate: string;
  optometrist: string;
  totalPatients: number;
  seenPatientsCount: number;
  unseenPatientsCount: number;
  nhsCount: number;
  privateCount: number;
  totalRevenue: number;
  spectaclesOrderedCount: number;
  seenPatients: PatientRow[];
  unseenPatients: PatientRow[];
  recalls: RecallItem[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ParseResult {
  careHomeSummary: CareHomeSummary | null;
  patients: PatientRow[];
  seenPatients: PatientRow[];
  unseenPatients: PatientRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface CompanyDetails {
  name: string;
  regNo: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  sortCode: string;
  accountNo: string;
  swift: string;
  iban: string;
}
