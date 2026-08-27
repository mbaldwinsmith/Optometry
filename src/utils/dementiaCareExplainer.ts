import { SpexRx, DispenseInfo, DementiaExplanation } from '../types/optometry';

export function generateDementiaCareExplanation(
  patientName: string,
  spexRx: SpexRx,
  dispense: DispenseInfo,
  _notes?: string
): DementiaExplanation {
  const firstName = patientName.split(' ')[0] || 'The resident';
  const hasNearAdd = spexRx.rightEye.nearAdd !== '-' || spexRx.leftEye.nearAdd !== '-';
  const hasDistanceRx = spexRx.rightEye.sph !== 'PLANO' || spexRx.leftEye.sph !== 'PLANO';
  const isMultifocal = dispense.lensType === 'Bifocal Lenses' || dispense.lensType === 'Varifocal / Progressive Lenses';
  const isRetainedOrNone =
    dispense.lensType === 'Existing Spectacles Retained (No Change Needed)' ||
    dispense.lensType === 'No Spectacles Required';

  let summary = '';
  if (dispense.lensType === 'Existing Spectacles Retained (No Change Needed)') {
    summary = `${firstName} was fully examined and tested today. Visual acuity and ocular health are stable with existing spectacles, and no prescription changes or new glasses are needed at this time.`;
  } else if (dispense.lensType === 'No Spectacles Required') {
    summary = `${firstName} completed a full domiciliary eye examination today. Visual health is good and no spectacles are required at this time.`;
  } else if (isMultifocal) {
    summary = `${firstName} was examined and prescribed a combined all-in-one pair (${dispense.lensType}) for clear vision at both distance and close range without needing to switch glasses.`;
  } else if (hasDistanceRx && hasNearAdd) {
    summary = `${firstName} was fully examined and has updated prescriptions for both distance vision and reading comfort. Having the correct glasses helps support independence, orientation, and well-being.`;
  } else if (hasNearAdd && (!dispense.distFrame || dispense.distFrame === '-')) {
    summary = `${firstName} was examined and has good distance vision, with updated reading magnification prescribed to make books, letters, puzzles, and dining clearer and easier.`;
  } else {
    summary = `${firstName} had a full eye health and vision assessment today. Visual acuity and ocular health are monitored and stable.`;
  }

  if (dispense.hasMar) {
    summary += ' Multi-Anti-Reflective (MAR) anti-glare coating applied to reduce reflections and improve contrast.';
  }
  if (dispense.hasReactions) {
    summary += ' Reactions light-adaptive lenses fitted to transition automatically between indoor and outdoor lighting.';
  }

  const spectacleInstructions: string[] = [];

  let distanceAdvice = '';
  let nearAdvice = '';
  let multifocalAdvice = '';

  if (isRetainedOrNone) {
    if (dispense.lensType === 'Existing Spectacles Retained (No Change Needed)') {
      spectacleInstructions.push('Continue wearing current existing spectacles as customary for day-to-day comfort.');
      distanceAdvice = 'Current distance vision is satisfactory with existing glasses.';
      nearAdvice = 'Current reading vision is satisfactory with existing glasses.';
    } else {
      spectacleInstructions.push('No spectacles required for daily activities.');
      distanceAdvice = 'Unaided distance vision is clear.';
      nearAdvice = 'Unaided close vision is clear.';
    }
  } else if (isMultifocal) {
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
    frameIdentification = `All-in-One (${dispense.lensType}): ${dispense.bifocalFrame || dispense.distFrame || dispense.nearFrame || 'Prescribed Frame'}. Resident name is engraved on the lens for care home identification.`;
  } else if (dispense.distFrame && dispense.distFrame !== '-' && dispense.nearFrame && dispense.nearFrame !== '-') {
    frameIdentification = `Distance Frame: ${dispense.distFrame} | Reading Frame: ${dispense.nearFrame}. Cases are labelled and resident name is engraved on the lens.`;
  } else if (dispense.nearFrame && dispense.nearFrame !== '-') {
    frameIdentification = `Reading Frame: ${dispense.nearFrame}. Resident name is engraved on the lens.`;
  } else if (dispense.distFrame && dispense.distFrame !== '-') {
    frameIdentification = `Distance Frame: ${dispense.distFrame}. Resident name is engraved on the lens.`;
  } else if (dispense.lensType === 'Existing Spectacles Retained (No Change Needed)') {
    frameIdentification = 'Existing spectacles verified for proper fit and alignment. Resident name is engraved on the lens.';
  } else if (dispense.lensType === 'No Spectacles Required') {
    frameIdentification = 'No spectacles required.';
  } else {
    frameIdentification = 'Spectacle frames verified for proper fit and alignment. Resident name is engraved on the lens.';
  }

  const careAndCleaning = 
    'Clean lenses daily with a soft microfibre cloth and gentle lens cleaner or warm water. Avoid wiping with paper towels, tissues, or clothing. Store in protective hard case when resting or asleep.';

  const emergencySos = 
    `SOS Guidance Given: Contact EliteSight HomeCare (0800 865 4488) or Care Lead immediately if ${firstName} experiences sudden vision loss, dark shadows/curtains, flashes of light, severe eye redness, or discomfort.`;

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
