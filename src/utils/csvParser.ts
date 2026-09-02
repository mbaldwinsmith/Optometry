import Papa from 'papaparse';
import {
  RawCsvRow,
  PatientRow,
  CareHomeSummary,
  ValidationError,
  ParseResult,
  RecallItem,
  DispenseInfo,
  LensTypeOption,
} from '../types/optometry';
import { toTitleCase, normalizeDate, calculateNextExamDate, addDaysToDate, parseBoolean, parseFunding } from './cleaners';
import { generateReportRef, generateInvoiceNo, getCareHomeInitials, getPatientInitials } from './hash';
import { buildSpexRx, formatDioptre, formatAxis } from './rxParser';
import { parseClinicalNotes } from './notesParser';
import { generateDementiaCareExplanation } from './dementiaCareExplainer';
import { calculateOptometryLineItems, calculateTotalAmount } from './pricing';
import { CSV_REQUIRED_COLUMNS, PRICING_CONFIG } from './constants';

export function parseLensType(raw?: string): LensTypeOption | null {
  if (!raw) return null;
  const s = raw.trim();
  const lower = s.toLowerCase();
  if (lower.includes('no spec') || lower.includes('no glasses') || lower === 'none') {
    return 'No Spectacles Required';
  }
  if (lower.includes('existing') || lower.includes('retained') || lower.includes('no change')) {
    return 'Existing Spectacles Retained (No Change Needed)';
  }
  if (lower.includes('varifocal') || lower.includes('progressive')) {
    return 'Varifocal / Progressive Lenses';
  }
  if (lower.includes('bifocal')) {
    return 'Bifocal Lenses';
  }
  if (lower.includes('distance & near') || lower.includes('distance and near') || lower.includes('separate') || lower.includes('both')) {
    return 'Single Vision (Distance & Near)';
  }
  if (lower.includes('reading') || lower.includes('near only') || lower.includes('near (reading')) {
    return 'Single Vision Near (Reading Only)';
  }
  if (lower.includes('distance only') || lower.includes('distance')) {
    return 'Single Vision Distance Only';
  }
  return null;
}

export function validateHeaders(headers: string[]): { missing: string[]; matched: Record<string, string> } {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const missing: string[] = [];
  const matched: Record<string, string> = {};

  for (const col of CSV_REQUIRED_COLUMNS) {
    const colLower = col.toLowerCase();
    const foundIdx = normalizedHeaders.findIndex(
      (h) => h === colLower || h.replace(/[\?\:\_\s]/g, '') === colLower.replace(/[\?\:\_\s]/g, '')
    );
    if (foundIdx === -1) {
      if (col === 'Examination Date' && normalizedHeaders.some((h) => h.includes('exam') || h.includes('date') || h.includes('appointment'))) {
        const found = headers[normalizedHeaders.findIndex((h) => h.includes('exam') || h.includes('date') || h.includes('appointment'))];
        matched[col] = found;
      } else {
        missing.push(col);
      }
    } else {
      matched[col] = headers[foundIdx];
    }
  }

  return { missing, matched };
}

function getRowValue(row: RawCsvRow, colName: string, matched: Record<string, string>): string {
  const exactKey = matched[colName] || colName;
  if (row[exactKey] !== undefined && row[exactKey] !== null) {
    return String(row[exactKey]).trim();
  }
  const colLower = colName.toLowerCase().replace(/[\?\:\_\s]/g, '');
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().replace(/[\?\:\_\s]/g, '') === colLower) {
      return String(row[key]).trim();
    }
  }
  return '';
}

export function parseOptometryCsv(csvString: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<RawCsvRow>(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const rawHeaders = results.meta.fields || [];
        const { missing, matched } = validateHeaders(rawHeaders);
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        if (missing.length > 0) {
          errors.push({
            row: 0,
            field: 'Headers',
            message: 'Missing required column(s): ' + missing.join(', '),
            type: 'error',
          });
        }

        const patients: PatientRow[] = [];
        let careHomeName = '';
        let careHomePostCode = '';
        let careHomeAppointmentDate = '';
        let careHomeOptometrist = '';

        results.data.forEach((row, index) => {
          const rowNumber = index + 2;

          const blinkIdRaw = getRowValue(row, 'ID', matched) || getRowValue(row, 'Blink ID', matched) || getRowValue(row, 'Patient ID', matched) || ('ID-' + (1000 + index));
          const firstNameRaw = getRowValue(row, 'Resident First Name', matched) || getRowValue(row, 'First Name', matched);
          const surnameRaw = getRowValue(row, 'Resident Surname', matched) || getRowValue(row, 'Surname', matched);
          const careHomeRaw = getRowValue(row, 'Care Home', matched);
          const postCodeRaw = getRowValue(row, 'Post Code', matched);
          const appDateRaw = getRowValue(row, 'Examination Date', matched) || getRowValue(row, 'Last Full Examination', matched) || getRowValue(row, 'Appointment Date', matched);
          const dobRaw = getRowValue(row, 'DOB', matched);
          const optometristRaw = getRowValue(row, 'Optometrist', matched);
          const seenRaw = getRowValue(row, 'Seen?', matched);
          const reasonNotSeenRaw = getRowValue(row, 'Reason not seen', matched);
          const fundingRaw = getRowValue(row, 'Funding', matched);
          const notesRaw = getRowValue(row, 'Notes', matched);

          // Extended & Dispense column ingestion (from exported CSVs)
          const reportRefRaw = getRowValue(row, 'Report Ref', matched) || getRowValue(row, 'Report Reference', matched);
          const invoiceNoRaw = getRowValue(row, 'Invoice No', matched) || getRowValue(row, 'Invoice Number', matched);
          const nextExamDateRaw = getRowValue(row, 'Next Exam Date', matched) || getRowValue(row, 'Next Examination', matched);
          const dueDateRaw = getRowValue(row, 'Due Date', matched) || getRowValue(row, 'Payment Due Date', matched);
          const lensTypeRaw = getRowValue(row, 'Lens Type', matched) || getRowValue(row, 'Lenses', matched);
          const distFrameRaw = getRowValue(row, 'Distance Frame', matched) || getRowValue(row, 'Dist Frame', matched) || getRowValue(row, 'Distance Frame Model', matched);
          const nearFrameRaw = getRowValue(row, 'Near Frame', matched) || getRowValue(row, 'Reading Frame', matched) || getRowValue(row, 'Near Frame Model', matched);
          const bifocalFrameRaw = getRowValue(row, 'Bifocal Frame', matched) || getRowValue(row, 'Varifocal Frame', matched) || getRowValue(row, 'Multifocal Frame', matched);
          const voucherTypeRaw = getRowValue(row, 'Voucher Type', matched) || getRowValue(row, 'Voucher', matched);
          const marRaw = getRowValue(row, 'MAR Coating', matched) || getRowValue(row, 'MAR', matched) || getRowValue(row, 'Anti-Reflective', matched);
          const reactionsRaw = getRowValue(row, 'Reactions', matched) || getRowValue(row, 'Photochromic', matched) || getRowValue(row, 'Transitions', matched);
          const dementiaSummaryRaw = getRowValue(row, 'Dementia Summary', matched) || getRowValue(row, 'Eyecare Guide Summary', matched) || getRowValue(row, 'Vision Summary', matched);

          // Detailed Rx columns
          const rightRxRaw = getRowValue(row, 'Right Eye Rx', matched);
          const leftRxRaw = getRowValue(row, 'Left Eye Rx', matched);
          const rightSph = getRowValue(row, 'Right SPH', matched);
          const rightCyl = getRowValue(row, 'Right CYL', matched);
          const rightAxis = getRowValue(row, 'Right Axis', matched);
          const rightPrism = getRowValue(row, 'Right Prism', matched);
          const rightNearAdd = getRowValue(row, 'Right Near Add', matched);
          const rightIntAdd = getRowValue(row, 'Right Int Add', matched);
          const leftSph = getRowValue(row, 'Left SPH', matched);
          const leftCyl = getRowValue(row, 'Left CYL', matched);
          const leftAxis = getRowValue(row, 'Left Axis', matched);
          const leftPrism = getRowValue(row, 'Left Prism', matched);
          const leftNearAdd = getRowValue(row, 'Left Near Add', matched);
          const leftIntAdd = getRowValue(row, 'Left Int Add', matched);
          const distPdRaw = getRowValue(row, 'Distance PD', matched) || getRowValue(row, 'PD', matched);

          if (!firstNameRaw && !surnameRaw) {
            warnings.push({
              row: rowNumber,
              field: 'Resident Name',
              message: 'Patient row is missing resident name.',
              type: 'warning',
            });
            return;
          }

          const firstName = toTitleCase(firstNameRaw);
          const surname = toTitleCase(surnameRaw);
          const careHome = toTitleCase(careHomeRaw) || careHomeName || 'Care Home';
          const postCode = postCodeRaw.toUpperCase() || careHomePostCode || '';
          const appointmentDate = normalizeDate(appDateRaw) || careHomeAppointmentDate || normalizeDate(new Date().toISOString());
          const nextExamDate = normalizeDate(nextExamDateRaw) || calculateNextExamDate(appointmentDate, 1);
          const dob = normalizeDate(dobRaw) || '01/01/1940';
          const optometrist = toTitleCase(optometristRaw) || careHomeOptometrist || 'Dr. Emma Taylor MCOptom';
          const funding = parseFunding(fundingRaw);

          if (!careHomeName && careHome) careHomeName = careHome;
          if (!careHomePostCode && postCode) careHomePostCode = postCode;
          if (!careHomeAppointmentDate && appointmentDate) careHomeAppointmentDate = appointmentDate;
          if (!careHomeOptometrist && optometrist) careHomeOptometrist = optometrist;

          const seen = parseBoolean(seenRaw || 'Yes');
          const rawReason = reasonNotSeenRaw || (seen ? '' : 'Resident did not attend (DNA) - Rescheduled for next routine visit');
          const reasonNotSeen = rawReason
            .replace(/(?:-\s*)?Missing\s*(?:patient\s*|declaration\s*)?signature/gi, '')
            .replace(/(?:-\s*)?Missing\s*signature/gi, '')
            .trim() || (seen ? '' : 'Resident did not attend (DNA) - Rescheduled for next routine visit');

          const parsedNotes = parseClinicalNotes(notesRaw);

          let rightInput: any = rightRxRaw || {};
          let leftInput: any = leftRxRaw || {};

          if (rightSph || rightCyl || rightAxis || rightPrism || rightNearAdd || rightIntAdd) {
            rightInput = {
              sph: formatDioptre(rightSph),
              cyl: formatDioptre(rightCyl),
              axis: formatAxis(rightAxis),
              prism: rightPrism || '-',
              nearAdd: formatDioptre(rightNearAdd),
              intAdd: formatDioptre(rightIntAdd),
              pd: '32',
            };
          }

          if (leftSph || leftCyl || leftAxis || leftPrism || leftNearAdd || leftIntAdd) {
            leftInput = {
              sph: formatDioptre(leftSph),
              cyl: formatDioptre(leftCyl),
              axis: formatAxis(leftAxis),
              prism: leftPrism || '-',
              nearAdd: formatDioptre(leftNearAdd),
              intAdd: formatDioptre(leftIntAdd),
              pd: '32',
            };
          }

          const spexRx = buildSpexRx(rightInput, leftInput, distPdRaw || parsedNotes.pd);

          const hasDistanceRx = spexRx.rightEye.sph !== 'PLANO' || spexRx.rightEye.cyl !== '-' || spexRx.leftEye.sph !== 'PLANO' || spexRx.leftEye.cyl !== '-';
          const hasNearRx = spexRx.rightEye.nearAdd !== '-' || spexRx.leftEye.nearAdd !== '-';

          const explicitLensType = parseLensType(lensTypeRaw);
          const lensType: LensTypeOption = explicitLensType || parsedNotes.lensType;

          let fallbackDist = '-';
          let fallbackNear = '-';
          let fallbackBifocal = '';

          if (lensType === 'Single Vision (Distance & Near)') {
            fallbackDist = 'Distance Spectacles';
            fallbackNear = 'Reading Spectacles';
          } else if (lensType === 'Single Vision Distance Only') {
            fallbackDist = 'Distance Spectacles';
          } else if (lensType === 'Single Vision Near (Reading Only)') {
            fallbackNear = 'Reading Spectacles';
          } else if (lensType === 'Bifocal Lenses' || lensType === 'Varifocal / Progressive Lenses') {
            fallbackBifocal = lensType === 'Bifocal Lenses' ? 'Bifocal Spectacles' : 'Varifocal Spectacles';
          } else if (lensType !== 'Existing Spectacles Retained (No Change Needed)' && lensType !== 'No Spectacles Required') {
            if (hasDistanceRx && hasNearRx) {
              fallbackDist = 'Distance Spectacles';
              fallbackNear = 'Reading Spectacles';
            } else if (hasNearRx) {
              fallbackNear = 'Reading Spectacles';
            } else if (hasDistanceRx) {
              fallbackDist = 'Distance Spectacles';
            }
          }

          const distFrame = distFrameRaw !== '' ? distFrameRaw : (parsedNotes.distFrame || fallbackDist);
          const nearFrame = nearFrameRaw !== '' ? nearFrameRaw : (parsedNotes.nearFrame || fallbackNear);
          const bifocalFrame = bifocalFrameRaw !== '' ? bifocalFrameRaw : (parsedNotes.bifocalFrame || fallbackBifocal);
          const voucherType = voucherTypeRaw || parsedNotes.voucherType || (funding === 'NHS' ? 'NHS Funded' : 'Private');
          const hasMar = marRaw !== '' ? parseBoolean(marRaw) : parsedNotes.hasMar;
          const hasReactions = reactionsRaw !== '' ? parseBoolean(reactionsRaw) : parsedNotes.hasReactions;

          const dispense: DispenseInfo = {
            lensType,
            distFrame,
            nearFrame,
            bifocalFrame,
            voucherType,
            caseCloth: true,
            hasMar,
            hasReactions,
          };

          const dementiaExplanation = generateDementiaCareExplanation(
            firstName + ' ' + surname,
            spexRx,
            dispense,
            notesRaw
          );
          if (dementiaSummaryRaw) {
            dementiaExplanation.summary = dementiaSummaryRaw;
          }

          const reportRef = reportRefRaw || generateReportRef(careHome, firstName, surname, dob, index + 1);
          const invoiceNo = invoiceNoRaw || generateInvoiceNo(careHome, firstName, surname, dob, index + 1);
          const dueDate = normalizeDate(dueDateRaw) || addDaysToDate(appointmentDate, PRICING_CONFIG.PAYMENT_TERMS_DAYS);

          const lineItems = seen ? calculateOptometryLineItems(funding, dispense, spexRx.hasPrescription) : [];
          const totalAmount = calculateTotalAmount(lineItems);

          const patient: PatientRow = {
            id: 'pat-' + (index + 1) + '-' + Date.now().toString(36),
            blinkId: blinkIdRaw,
            careHome,
            postCode,
            appointmentDate,
            nextExamDate,
            dob,
            optometrist,
            residentFirstName: firstName,
            residentSurname: surname,
            residentFullName: `${firstName} ${surname}`.trim(),
            seen,
            reasonNotSeen,
            funding,
            voucherType: dispense.voucherType || (funding === 'NHS' ? 'NHS Funded' : 'Private'),
            spexRx,
            dispense,
            dementiaExplanation,
            notes: notesRaw,
            sosAdviceGiven: parsedNotes.sosAdviceGiven,
            reportRef,
            invoiceNo,
            careHomeInitials: getCareHomeInitials(careHome),
            patientInitials: getPatientInitials(firstName, surname),
            dueDate,
            lineItems,
            totalAmount,
          };

          patients.push(patient);
        });

        const seenPatients = patients.filter((p) => p.seen);
        const unseenPatients = patients.filter((p) => !p.seen);

        const totalRevenue = seenPatients.reduce((sum, p) => sum + p.totalAmount, 0);
        const nhsCount = seenPatients.filter((p) => p.funding === 'NHS').length;
        const privateCount = seenPatients.filter((p) => p.funding === 'Private').length;
        const spectaclesOrderedCount = seenPatients.filter((p) => 
          (p.dispense.distFrame && p.dispense.distFrame !== '-') || 
          (p.dispense.nearFrame && p.dispense.nearFrame !== '-') ||
          (p.dispense.bifocalFrame && p.dispense.bifocalFrame !== '-')
        ).length;

        const recalls: RecallItem[] = seenPatients.map((p) => ({
          patientName: p.residentFullName,
          dob: p.dob,
          blinkId: p.blinkId,
          lastExamDate: p.appointmentDate,
          nextExamDate: p.nextExamDate,
          recallReason: 'Routine 1-Year Domiciliary Eye Examination',
          funding: p.funding,
        }));

        const careHomeSummary: CareHomeSummary | null =
          patients.length > 0
            ? {
                careHome: careHomeName || 'Care Home',
                postCode: careHomePostCode,
                appointmentDate: careHomeAppointmentDate,
                optometrist: careHomeOptometrist,
                totalPatients: patients.length,
                seenPatientsCount: seenPatients.length,
                unseenPatientsCount: unseenPatients.length,
                nhsCount,
                privateCount,
                totalRevenue,
                spectaclesOrderedCount,
                seenPatients,
                unseenPatients,
                recalls,
              }
            : null;

        resolve({
          careHomeSummary,
          patients,
          seenPatients,
          unseenPatients,
          errors,
          warnings,
        });
      },
      error: (err: Error) => {
        resolve({
          careHomeSummary: null,
          patients: [],
          seenPatients: [],
          unseenPatients: [],
          errors: [
            {
              row: 0,
              field: 'Parser',
              message: 'CSV parsing failed: ' + err.message,
              type: 'error',
            },
          ],
          warnings: [],
        });
      },
    });
  });
}

/**
 * Generates cleaned and standardized CSV string from live PatientRow list, including all live edits.
 */
export function generateCleanedCsv(
  patients: PatientRow[],
  includeExtendedColumns: boolean = true
): string {
  const data = patients.map((p) => {
    const baseRow: Record<string, string | number> = {
      'ID': p.blinkId,
      'Care Home': p.careHome,
      'Post Code': p.postCode,
      'Examination Date': p.appointmentDate,
      'DOB': p.dob,
      'Optometrist': p.optometrist,
      'Resident First Name': p.residentFirstName,
      'Resident Surname': p.residentSurname,
      'Seen?': p.seen ? 'Yes' : 'No',
      'Reason not seen': p.reasonNotSeen || '',
      'Funding': p.funding,
      'Right SPH': p.spexRx.rightEye.sph,
      'Right CYL': p.spexRx.rightEye.cyl,
      'Right Axis': p.spexRx.rightEye.axis,
      'Right Prism': p.spexRx.rightEye.prism,
      'Right Near Add': p.spexRx.rightEye.nearAdd,
      'Right Int Add': p.spexRx.rightEye.intAdd || '-',
      'Left SPH': p.spexRx.leftEye.sph,
      'Left CYL': p.spexRx.leftEye.cyl,
      'Left Axis': p.spexRx.leftEye.axis,
      'Left Prism': p.spexRx.leftEye.prism,
      'Left Near Add': p.spexRx.leftEye.nearAdd,
      'Left Int Add': p.spexRx.leftEye.intAdd || '-',
      'Distance PD': p.spexRx.binocularPd || p.spexRx.rightEye.pd || '64',
      'Lens Type': p.dispense.lensType,
      'Distance Frame': p.dispense.distFrame || '',
      'Near Frame': p.dispense.nearFrame || '',
      'Bifocal Frame': p.dispense.bifocalFrame || '',
      'Voucher Type': p.dispense.voucherType || (p.funding === 'NHS' ? 'NHS Funded' : 'Private'),
      'MAR Coating': p.dispense.hasMar ? 'Yes' : 'No',
      'Reactions': p.dispense.hasReactions ? 'Yes' : 'No',
      'Notes': p.notes || '',
    };

    if (includeExtendedColumns) {
      baseRow['Report Ref'] = p.reportRef;
      baseRow['Invoice No'] = p.invoiceNo;
      baseRow['Total Amount (GBP)'] = p.seen ? `£${p.totalAmount.toFixed(2)}` : '£0.00';
      baseRow['Due Date'] = p.dueDate;
      baseRow['Next Exam Date'] = p.nextExamDate;
      if (p.dementiaExplanation?.summary) {
        baseRow['Dementia Summary'] = p.dementiaExplanation.summary;
      }
    }

    return baseRow;
  });

  return Papa.unparse(data);
}

