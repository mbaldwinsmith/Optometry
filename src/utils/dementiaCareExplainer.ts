import { SpexRx, DispenseInfo, DementiaExplanation } from '../types/optometry';

export function generateDementiaCareExplanation(
  patientName: string,
  spexRx: SpexRx,
  dispense: DispenseInfo,
  notes?: string
): DementiaExplanation {
  const firstName = patientName.split(' ')[0] || 'The resident';
  const hasNearAdd = spexRx.rightEye.nearAdd !== '-' || spexRx.leftEye.nearAdd !== '-';
  const hasDistanceRx = spexRx.rightEye.sph !== 'PLANO' || spexRx.leftEye.sph !== 'PLANO';
  const isMultifocal = dispense.lensType === 'Bifocal Lenses' || dispense.lensType === 'Varifocal / Progressive Lenses';

  let summary = '';
  if (isMultifocal) {
    summary = `${firstName} was examined and prescribed a combined all-in-one pair (${dispense.lensType}) for clear vision at both distance and close range without needing to switch glasses.`;
  } else if (hasDistanceRx && hasNearAdd) {
    summary = `${firstName} was fully examined and has updated prescriptions for both distance vision and reading comfort. Having the correct glasses helps support independence, orientation, and well-being.`;
  } else if (hasNearAdd && (!dispense.distFrame || dispense.distFrame === '-')) {
    summary = `${firstName} was examined and has good distance vision, with updated reading magnification prescribed to make books, letters, puzzles, and dining clearer and easier.`;
  } else {
    summary = `${firstName} had a full eye health and vision assessment today. Visual acuity and ocular health are monitored and stable.`;
  }

  const spectacleInstructions: string[] = [];

  let distanceAdvice = '';
  let nearAdvice = '';
  let multifocalAdvice = '';

  if (isMultifocal) {
    const frameName = dispense.bifocalFrame || dispense.distFrame || dispense.nearFrame || 'Bifocal frame';
    multifocalAdvice = `All-in-One Pair (${frameName}): Look straight ahead through the upper part of the lenses for watching TV and walking. Look down through the lower reading section when reading or eating meals.`;
    spectacleInstructions.push('All-in-One Glasses: Look straight ahead for TV and walking; look down for reading.');
  } else {
    if (dispense.distFrame && dispense.distFrame !== '-' && !dispense.distFrame.toLowerCase().includes('existing')) {
      distanceAdvice = `Distance Glasses (${dispense.distFrame}): Please wear for watching television, moving around the care home, and social activities.`;
      spectacleInstructions.push('Distance Glasses: Wear for TV, walking around, and activities.');
    } else if (dispense.distFrame && dispense.distFrame.toLowerCase().includes('existing')) {
      distanceAdvice = 'Distance Glasses (Existing pair retained): Continue wearing for television and room mobility.';
      spectacleInstructions.push('Distance Glasses: Continue wearing existing pair for TV and walking.');
    } else if (hasDistanceRx) {
      distanceAdvice = 'Distance Glasses: Recommended for watching television, mobility, and looking across the room.';
    }

    if (dispense.nearFrame && dispense.nearFrame !== '-') {
      nearAdvice = `Reading Glasses (${dispense.nearFrame}): Please wear for reading books, newspapers, letters, meals, and crafts.`;
      spectacleInstructions.push('Reading Glasses: Wear when sitting down to read, eat, or do tabletop hobbies.');
    } else if (hasNearAdd) {
      nearAdvice = 'Reading Glasses: Wear when reading, eating, looking at photographs, or crafts.';
      spectacleInstructions.push('Reading Glasses: Wear for reading, meals, and close activities.');
    }
  }

  if (spectacleInstructions.length === 0) {
    spectacleInstructions.push('Continue wearing current spectacles as customary for day-to-day comfort.');
  }

  let frameIdentification = '';
  if (isMultifocal) {
    frameIdentification = `All-in-One (${dispense.lensType}): ${dispense.bifocalFrame || dispense.distFrame || dispense.nearFrame || 'Prescribed Frame'}. Clearly labelled for care staff.`;
  } else if (dispense.distFrame && dispense.distFrame !== '-' && dispense.nearFrame && dispense.nearFrame !== '-') {
    frameIdentification = `Distance Frame: ${dispense.distFrame} | Reading Frame: ${dispense.nearFrame}. Cases are labelled for easy identification.`;
  } else if (dispense.nearFrame && dispense.nearFrame !== '-') {
    frameIdentification = `Reading Frame: ${dispense.nearFrame}.`;
  } else if (dispense.distFrame && dispense.distFrame !== '-') {
    frameIdentification = `Distance Frame: ${dispense.distFrame}.`;
  } else {
    frameIdentification = 'Spectacle frames verified for proper fit and alignment.';
  }

  const careAndCleaning = 
    'Clean lenses daily with a soft microfibre cloth and gentle lens cleaner or warm water. Avoid wiping with paper towels, tissues, or clothing. Store in protective hard case when resting or asleep.';

  const emergencySos = 
    `SOS Guidance Given: Contact EliteSight HomeCare (0800 865 4488) or Care Lead immediately if ${firstName} experiences sudden vision loss, dark shadows/curtains, flashes of light, severe eye redness, or discomfort.`;

  if (notes) {
    if (notes.toLowerCase().includes('gos 3') || notes.toLowerCase().includes('voucher')) {
      summary += ' NHS GOS 3 optical voucher issued for spectacle provision.';
    }
  }

  return {
    summary,
    spectacleInstructions,
    distanceAdvice,
    nearAdvice,
    multifocalAdvice,
    frameIdentification,
    careAndCleaning,
    emergencySos,
  };
}
