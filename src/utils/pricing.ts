import { InvoiceLineItem, DispenseInfo } from '../types/optometry';
import { PRICING_CONFIG } from './constants';

export function calculateOptometryLineItems(
  funding: 'NHS' | 'Private',
  dispense: DispenseInfo,
  _hasPrescription?: boolean
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];

  const isNoNewFrames =
    dispense.lensType === 'Existing Spectacles Retained (No Change Needed)' ||
    dispense.lensType === 'No Spectacles Required';

  if (funding === 'NHS') {
    items.push({
      id: 'item-nhs-exam',
      description: 'NHS Domiciliary Sight Test & Ocular Health Assessment',
      quantity: 1,
      unit: 'Consultation',
      unitPrice: PRICING_CONFIG.NHS_SIGHT_TEST,
      vatRate: PRICING_CONFIG.VAT_RATE,
      amount: PRICING_CONFIG.NHS_SIGHT_TEST,
    });

    if (!isNoNewFrames) {
      if (dispense.bifocalFrame && dispense.bifocalFrame !== '-' && !dispense.bifocalFrame.toLowerCase().includes('existing')) {
        items.push({
          id: 'item-nhs-bifocal-pair',
          description: `Spectacle Dispense (${dispense.lensType}) - ${dispense.bifocalFrame} (NHS Funded)`,
          quantity: 1,
          unit: 'Pair',
          unitPrice: 0.0,
          vatRate: PRICING_CONFIG.VAT_RATE,
          amount: 0.0,
        });
      } else {
        if (dispense.distFrame && dispense.distFrame !== '-' && !dispense.distFrame.toLowerCase().includes('existing')) {
          items.push({
            id: 'item-nhs-dist-pair',
            description: `Spectacle Dispense (Distance) - ${dispense.distFrame} (NHS Funded)`,
            quantity: 1,
            unit: 'Pair',
            unitPrice: 0.0,
            vatRate: PRICING_CONFIG.VAT_RATE,
            amount: 0.0,
          });
        }
        if (dispense.nearFrame && dispense.nearFrame !== '-' && !dispense.nearFrame.toLowerCase().includes('existing')) {
          items.push({
            id: 'item-nhs-near-pair',
            description: `Spectacle Dispense (Near / Reading) - ${dispense.nearFrame} (NHS Funded)`,
            quantity: 1,
            unit: 'Pair',
            unitPrice: 0.0,
            vatRate: PRICING_CONFIG.VAT_RATE,
            amount: 0.0,
          });
        }
      }
    }
  } else {
    // Private Funding - Eye tests are always free (£0.00)
    items.push({
      id: 'item-private-exam',
      description: 'Private Domiciliary Eye Examination & Glaucoma/Cataract Assessment (Complimentary)',
      quantity: 1,
      unit: 'Assessment',
      unitPrice: PRICING_CONFIG.PRIVATE_SIGHT_TEST,
      vatRate: PRICING_CONFIG.VAT_RATE,
      amount: PRICING_CONFIG.PRIVATE_SIGHT_TEST,
    });

    if (!isNoNewFrames) {
      if (dispense.bifocalFrame && dispense.bifocalFrame !== '-' && !dispense.bifocalFrame.toLowerCase().includes('existing')) {
        items.push({
          id: 'item-private-bifocal',
          description: `Complete Spectacles (${dispense.lensType}) - ${dispense.bifocalFrame}`,
          quantity: 1,
          unit: 'Pair',
          unitPrice: PRICING_CONFIG.PRIVATE_FRAME_PREMIUM,
          vatRate: PRICING_CONFIG.VAT_RATE,
          amount: PRICING_CONFIG.PRIVATE_FRAME_PREMIUM,
        });
      } else {
        if (dispense.distFrame && dispense.distFrame !== '-' && !dispense.distFrame.toLowerCase().includes('existing')) {
          items.push({
            id: 'item-private-dist',
            description: `Complete Spectacles (Distance) - ${dispense.distFrame} with Scratch-Resistant Lenses`,
            quantity: 1,
            unit: 'Pair',
            unitPrice: PRICING_CONFIG.PRIVATE_FRAME_STANDARD,
            vatRate: PRICING_CONFIG.VAT_RATE,
            amount: PRICING_CONFIG.PRIVATE_FRAME_STANDARD,
          });
        }

        if (dispense.nearFrame && dispense.nearFrame !== '-' && !dispense.nearFrame.toLowerCase().includes('existing')) {
          items.push({
            id: 'item-private-near',
            description: `Complete Spectacles (Near / Reading) - ${dispense.nearFrame} with Scratch-Resistant Lenses`,
            quantity: 1,
            unit: 'Pair',
            unitPrice: PRICING_CONFIG.PRIVATE_FRAME_STANDARD,
            vatRate: PRICING_CONFIG.VAT_RATE,
            amount: PRICING_CONFIG.PRIVATE_FRAME_STANDARD,
          });
        }
      }
    }
  }

  // Optional Lens Extras (MAR Coating & Reactions) for ALL residents (NHS and Private)
  if (dispense.hasMar) {
    items.push({
      id: 'item-extra-mar',
      description: 'Lens Upgrade: Multi-Anti-Reflective (MAR) Anti-Glare Coating',
      quantity: 1,
      unit: 'Upgrade',
      unitPrice: PRICING_CONFIG.MAR_EXTRA,
      vatRate: PRICING_CONFIG.VAT_RATE,
      amount: PRICING_CONFIG.MAR_EXTRA,
    });
  }

  if (dispense.hasReactions) {
    items.push({
      id: 'item-extra-reactions',
      description: 'Lens Upgrade: Reactions (Photochromic Light-Adaptive Lenses)',
      quantity: 1,
      unit: 'Upgrade',
      unitPrice: PRICING_CONFIG.REACTIONS_EXTRA,
      vatRate: PRICING_CONFIG.VAT_RATE,
      amount: PRICING_CONFIG.REACTIONS_EXTRA,
    });
  }

  return items;
}

export function calculateTotalAmount(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}
