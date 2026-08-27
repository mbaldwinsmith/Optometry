import Papa from 'papaparse';
import {
  RawCsvRow,
  PatientRow,
  CareHomeSummary,
  ValidationError,
  ParseResult,
  RecallItem,
  DispenseInfo,
} from '../types/optometry';
import { toTitleCase, normalizeDate, calculateNextExamDate, addDaysToDate, parseBoolean, parseFunding } from './cleaners';
import { generateReportRef, generateInvoiceNo, getCareHomeInitials, getPatientInitials } from './hash';
import { buildSpexRx, formatDioptre, formatAxis } from './rxParser';
import { parseClinicalNotes } from './notesParser';
import { generateDementiaCareExplanation } from './dementiaCareExplainer';
import { calculateOptometryLineItems, calculateTotalAmount } from './pricing';
import { CSV_REQUIRED_COLUMNS, PRICING_CONFIG } from './constants';

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

          // Detailed Rx columns
          const rightRxRaw = getRowValue(row, 'Right Eye Rx', matched);
          const leftRxRaw = getRowValue(row, 'Left Eye Rx', matched);
          const rightSph = getRowValue(row, 'Right SPH', matched);
          const rightCyl = getRowValue(row, 'Right CYL', matched);
          const rightAxis = getRowValue(row, 'Right Axis', matched);
          const rightPrism = getRowValue(row, 'Right Prism', matched);
          const rightNearAdd = getRowValue(row, 'Right Near Add', matched);
          const leftSph = getRowValue(row, 'Left SPH', matched);
          const leftCyl = getRowValue(row, 'Left CYL', matched);
          const leftAxis = getRowValue(row, 'Left Axis', matched);
          const leftPrism = getRowValue(row, 'Left Prism', matched);
          const leftNearAdd = getRowValue(row, 'Left Near Add', matched);
          const distPdRaw = getRowValue(row, 'Distance PD', matched);

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
          const nextExamDate = calculateNextExamDate(appointmentDate, 2);
          const dob = normalizeDate(dobRaw) || '01/01/1940';
          const optometrist = toTitleCase(optometristRaw) || careHomeOptometrist || 'Dr. Emma Taylor MCOptom';
          const funding = parseFunding(fundingRaw);

          if (!careHomeName && careHome) careHomeName = careHome;
          if (!careHomePostCode && postCode) careHomePostCode = postCode;
          if (!careHomeAppointmentDate && appointmentDate) careHomeAppointmentDate = appointmentDate;
          if (!careHomeOptometrist && optometrist) careHomeOptometrist = optometrist;

          const seen = parseBoolean(seenRaw || 'Yes');
          const reasonNotSeen = reasonNotSeenRaw || (seen ? '' : 'Resident unwell / Resting in room');

          const parsedNotes = parseClinicalNotes(notesRaw);

          let rightInput: any = rightRxRaw || {};
          let leftInput: any = leftRxRaw || {};

          if (rightSph || rightCyl || rightNearAdd) {
            rightInput = {
              sph: formatDioptre(rightSph),
              cyl: formatDioptre(rightCyl),
              axis: formatAxis(rightAxis),
              prism: rightPrism || '-',
              nearAdd: formatDioptre(rightNearAdd),
              pd: '32',
            };
          }

          if (leftSph || leftCyl || leftNearAdd) {
            leftInput = {
              sph: formatDioptre(leftSph),
              cyl: formatDioptre(leftCyl),
              axis: formatAxis(leftAxis),
              prism: leftPrism || '-',
              nearAdd: formatDioptre(leftNearAdd),
              pd: '32',
            };
          }

          const spexRx = buildSpexRx(rightInput, leftInput, distPdRaw || parsedNotes.pd);

          const dispense: DispenseInfo = {
            lensType: parsedNotes.lensType,
            distFrame: parsedNotes.distFrame || (parsedNotes.lensType === 'Single Vision Distance Only' ? 'Solo 837 Purple 52' : '-'),
            nearFrame: parsedNotes.nearFrame || (parsedNotes.lensType === 'Single Vision Near (Reading Only)' || spexRx.rightEye.nearAdd !== '-' ? 'Solo 226 Bronze Flex Hinge' : '-'),
            bifocalFrame: parsedNotes.bifocalFrame || (parsedNotes.lensType === 'Bifocal Lenses' ? 'Stepper SI 6012 Titanium Wine' : ''),
            voucherType: parsedNotes.voucherType || (funding === 'NHS' ? 'GOS 3 (Voucher A)' : 'Private'),
            caseCloth: true,
          };

          const dementiaExplanation = generateDementiaCareExplanation(
            firstName + ' ' + surname,
            spexRx,
            dispense,
            notesRaw
          );

          const reportRef = generateReportRef(careHome, firstName, surname, dob, index + 1);
          const invoiceNo = generateInvoiceNo(careHome, firstName, surname, dob, index + 1);
          const dueDate = addDaysToDate(appointmentDate, PRICING_CONFIG.PAYMENT_TERMS_DAYS);

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
            voucherType: dispense.voucherType,
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
          recallReason: 'Routine 2-Year Domiciliary Eye Examination',
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
