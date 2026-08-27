export const SAMPLE_OPTOMETRY_CSV = `ID,Care Home,Post Code,Examination Date,DOB,Optometrist,Resident First Name,Resident Surname,Seen?,Reason not seen,Funding,Right SPH,Right CYL,Right Axis,Right Near Add,Left SPH,Left CYL,Left Axis,Left Near Add,Distance PD,Notes
BLK-88201,Fairhaven Care Home,CB25 9EJ,24/08/2026,14/03/1938,Dr. Emma Taylor MCOptom,Melanie,Dudman,Yes,,NHS,+0.50,-0.75,180,+2.50,+0.50,-0.75,90,+2.50,64,SOS advice given. Change in near Rx - GOS 3 issued. GOS 3 issued for SVD as current frame damaged. Dist: Solo 837 purple 52. Near: Solo 226 bronze flex hinge. Distance PDs 32 R+L.
BLK-88202,Fairhaven Care Home,CB25 9EJ,24/08/2026,22/11/1942,Dr. Emma Taylor MCOptom,Arthur,Pendleton,Yes,,NHS,+1.75,-0.50,90,+2.50,+2.00,-0.50,85,+2.50,65,SOS advice given. GOS 3 issued for new reading pair. Dist: Existing kept in good order. Near: Solo 114 silver metal. Distance PD 65.
BLK-88203,Fairhaven Care Home,CB25 9EJ,24/08/2026,05/09/1935,Dr. Emma Taylor MCOptom,Dorothy,Evans,No,Resident resting in bed - family requested rescheduling,NHS,,,,,,,,,,Family notified. Rescheduled for next routine domiciliary visit.
BLK-88204,Fairhaven Care Home,CB25 9EJ,24/08/2026,18/07/1940,Dr. Emma Taylor MCOptom,Geoffrey,Harris,Yes,,Private,+0.75,DS,-,+2.25,+1.00,DS,-,+2.25,63,Private patient. Both pairs ordered. Dist: Trendline 901 Tortoise. Near: Trendline 901 Gold flex. Patient and family delighted.
BLK-88205,Fairhaven Care Home,CB25 9EJ,24/08/2026,30/01/1936,Dr. Emma Taylor MCOptom,Beatrice,Welling,Yes,,NHS,+2.25,-1.25,15,+2.50,+2.50,-1.00,165,+2.50,62,SOS advice given. GOS 3 issued for bifocal spectacles. Bifocal: Stepper SI 6012 Titanium Wine. Clear instructions provided to care staff.
BLK-88206,Fairhaven Care Home,CB25 9EJ,24/08/2026,12/06/1944,Dr. Emma Taylor MCOptom,Edward,Sterling,No,Attending external hospital appointment,NHS,,,,,,,,,,Hospital transport arranged on consultation day. Rescheduled for subsequent round.
BLK-88207,Fairhaven Care Home,CB25 9EJ,24/08/2026,09/04/1939,Dr. Emma Taylor MCOptom,Florence,Nightingale,Yes,,NHS,-1.50,DS,-,+2.50,-1.75,DS,-,+2.50,60,SOS advice given. Clear distance vision with current frame. Issued replacement reading pair on GOS 3. Near: Solo 208 Soft Teal.
BLK-88208,Fairhaven Care Home,CB25 9EJ,24/08/2026,27/10/1941,Dr. Emma Taylor MCOptom,Harold,Finch,Yes,,NHS,+1.00,-0.50,180,+2.75,+1.25,-0.75,175,+2.75,66,SOS advice given. Mild early nuclear cataract monitored. Dist: Solo 837 Gunmetal. Near: Solo 226 Brown flex. Distance PDs 33 R+L.
BLK-88209,Fairhaven Care Home,CB25 9EJ,24/08/2026,15/08/1933,Dr. Emma Taylor MCOptom,Irene,Adler,Yes,,Private,+3.00,-1.50,75,+2.50,+2.75,-1.25,105,+2.50,61,Private eye examination. High hyperopic astigmatism. Frames ordered: Dist: Solo 837 Purple. Near: Solo 226 Bronze.
BLK-88210,Fairhaven Care Home,CB25 9EJ,24/08/2026,03/12/1947,Dr. Emma Taylor MCOptom,James,Watson,No,Resident declined eye examination today,NHS,,,,,,,,,,Will re-approach on next visit. Nurse lead informed.`;

export function generateCsvTemplate(): string {
  const headers = [
    'ID',
    'Care Home',
    'Post Code',
    'Examination Date',
    'DOB',
    'Optometrist',
    'Resident First Name',
    'Resident Surname',
    'Seen?',
    'Reason not seen',
    'Funding',
    'Right SPH',
    'Right CYL',
    'Right Axis',
    'Right Near Add',
    'Left SPH',
    'Left CYL',
    'Left Axis',
    'Left Near Add',
    'Distance PD',
    'Notes',
  ].join(',');

  const row1 = 'BLK-88201,Fairhaven Care Home,CB25 9EJ,24/08/2026,14/03/1938,Dr. Emma Taylor MCOptom,Melanie,Dudman,Yes,,NHS,+0.50,-0.75,180,+2.50,+0.50,-0.75,90,+2.50,64,SOS advice given. Dist: Solo 837 purple 52. Near: Solo 226 bronze flex hinge. GOS 3 issued.';
  const row2 = 'BLK-88202,Fairhaven Care Home,CB25 9EJ,24/08/2026,22/11/1942,Dr. Emma Taylor MCOptom,Arthur,Pendleton,Yes,,NHS,+1.75,-0.50,90,+2.50,+2.00,-0.50,85,+2.50,65,SOS advice given. Near: Solo 114 silver metal.';
  const row3 = 'BLK-88203,Fairhaven Care Home,CB25 9EJ,24/08/2026,05/09/1935,Dr. Emma Taylor MCOptom,Dorothy,Evans,No,Resident resting in bed,NHS,,,,,,,,,,Rescheduled for next visit';

  return headers + '\n' + row1 + '\n' + row2 + '\n' + row3 + '\n';
}
