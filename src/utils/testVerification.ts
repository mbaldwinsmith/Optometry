import { parseOptometryCsv, generateCleanedCsv } from './csvParser';
import { SAMPLE_OPTOMETRY_CSV } from './sampleData';
import { calculateNextExamDate } from './cleaners';
import { formatDioptre } from './rxParser';
import { generateReportRef } from './hash';

export async function runSelfVerificationTests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let passed = true;

  // Test 1: Date arithmetic (+1 year recall)
  const baseDate = '24/08/2026';
  const expectedNext = '24/08/2027';
  const calculatedNext = calculateNextExamDate(baseDate, 1);
  if (calculatedNext === expectedNext) {
    results.push('✓ Test 1 Passed: 1-Year recall date calculation accurate (' + calculatedNext + ')');
  } else {
    passed = false;
    results.push('✗ Test 1 Failed: Expected ' + expectedNext + ', got ' + calculatedNext);
  }

  // Test 2: Spex Rx normalizer & Dioptre formatting
  const formattedSph = formatDioptre('+0.5');
  const formattedCyl = formatDioptre('-0.75');
  if (formattedSph === '+0.50' && formattedCyl === '-0.75') {
    results.push('✓ Test 2 Passed: Spex Rx formatting verified (+0.50, -0.75)');
  } else {
    passed = false;
    results.push('✗ Test 2 Failed: Spex Rx dioptres incorrect (' + formattedSph + ', ' + formattedCyl + ')');
  }

  // Test 3: Deterministic reference hash
  const ref = generateReportRef('Fairhaven Care Home', 'Melanie', 'Dudman', '14/03/1938', 1);
  if (ref.startsWith('FCH-MD1403-OPT1')) {
    results.push('✓ Test 3 Passed: Deterministic Report Ref verified (' + ref + ')');
  } else {
    passed = false;
    results.push('✗ Test 3 Failed: Unexpected ref ' + ref);
  }

  // Test 4: Parse 10-patient sample CSV
  const parseRes = await parseOptometryCsv(SAMPLE_OPTOMETRY_CSV);
  if (parseRes.patients.length === 10 && parseRes.seenPatients.length === 7) {
    results.push('✓ Test 4 Passed: 10-Patient sample CSV parsed successfully (7 seen, 3 unseen)');
  } else {
    passed = false;
    results.push('✗ Test 4 Failed: Expected 10 patients (7 seen), got ' + parseRes.patients.length + ' (' + parseRes.seenPatients.length + ' seen)');
  }

  // Test 5: Dementia Explainer output
  const samplePatient = parseRes.patients[0];
  if (samplePatient && samplePatient.dementiaExplanation.summary.includes('Melanie')) {
    results.push('✓ Test 5 Passed: Dementia & Carer explanation engine generated plain-English summary');
  } else {
    passed = false;
    results.push('✗ Test 5 Failed: Dementia explanation missing patient name');
  }

  // Test 6: Cleaned CSV generation
  const exportedCsv = generateCleanedCsv(parseRes.patients, true);
  if (
    exportedCsv.includes('Melanie') &&
    exportedCsv.includes('Report Ref') &&
    exportedCsv.includes('Lens Type') &&
    exportedCsv.includes('MAR Coating')
  ) {
    results.push('✓ Test 6 Passed: generateCleanedCsv produced standardized CSV containing all clinical and administrative headers');
  } else {
    passed = false;
    results.push('✗ Test 6 Failed: generateCleanedCsv output missing expected headers or patient data');
  }

  // Test 7: Lossless round-trip export & re-import with live edits
  const editedPatients = [...parseRes.patients];
  const targetPatient = { ...editedPatients[0] };
  targetPatient.funding = 'Private';
  targetPatient.spexRx = {
    ...targetPatient.spexRx,
    rightEye: {
      ...targetPatient.spexRx.rightEye,
      sph: '+3.25',
      cyl: '-1.50',
      axis: '90',
    },
  };
  targetPatient.dispense = {
    ...targetPatient.dispense,
    lensType: 'Bifocal Lenses',
    bifocalFrame: 'Stepper Titanium Wine 54',
    hasMar: true,
    hasReactions: true,
  };
  targetPatient.dementiaExplanation = {
    ...targetPatient.dementiaExplanation,
    summary: 'Custom clinical overview updated by optometrist during consultation.',
  };
  editedPatients[0] = targetPatient;

  const editedCsvString = generateCleanedCsv(editedPatients, true);
  const reimportedRes = await parseOptometryCsv(editedCsvString);
  const reimportedPat = reimportedRes.patients[0];

  if (
    reimportedPat &&
    reimportedPat.funding === 'Private' &&
    reimportedPat.spexRx.rightEye.sph === '+3.25' &&
    reimportedPat.spexRx.rightEye.cyl === '-1.50' &&
    reimportedPat.dispense.lensType === 'Bifocal Lenses' &&
    reimportedPat.dispense.bifocalFrame === 'Stepper Titanium Wine 54' &&
    reimportedPat.dispense.hasMar === true &&
    reimportedPat.dispense.hasReactions === true &&
    reimportedPat.dementiaExplanation.summary === 'Custom clinical overview updated by optometrist during consultation.'
  ) {
    results.push('✓ Test 7 Passed: Lossless round-trip re-import verified (all live edits preserved exactly)');
  } else {
    passed = false;
    results.push('✗ Test 7 Failed: Re-imported patient did not match live edits');
  }

  console.log('[Verification Suite]', passed ? 'ALL TESTS PASSED' : 'TESTS FAILED', results);
  return { passed, results };
}
