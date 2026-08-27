import { InvoiceLineItem, DispenseInfo } from '../types/optometry';
import { PRICING_CONFIG } from './constants';

export function calculateOptometryLineItems(
  funding: 'NHS' | 'Private',
  dispense: DispenseInfo,
  _hasPrescription?: boolean
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];

  if (funding === 'NHS') {
    items.push({
      id: 'item-gos-exam',
      description: 'NHS Domiciliary Sight Test & Ocular Health Assessment (GOS 1 / 6)',
      quantity: 1,
      unit: 'Consultation',
      unitPrice: PRICING_CONFIG.NHS_SIGHT_TEST,
      vatRate: PRICING_CONFIG.VAT_RATE,
      amount: PRICING_CONFIG.NHS_SIGHT_TEST,
    });

    if (dispense.bifocalFrame && dispense.bifocalFrame !== '-') {
      items.push({
        id: 'item-gos-bifocal-pair',
        description: `Spectacle Dispense (${dispense.lensType}) - ${dispense.bifocalFrame} (NHS GOS 3 Covered)`,
        quantity: 1,
        unit: 'Pair',
        unitPrice: 0.0,
        vatRate: PRICING_CONFIG.VAT_RATE,
        amount: 0.0,
      });
    } else {
      if (dispense.distFrame && dispense.distFrame !== '-' && !dispense.distFrame.toLowerCase().includes('existing')) {
        items.push({
          id: 'item-gos-dist-pair',
          description: `Spectacle Dispense (Distance) - ${dispense.distFrame} (NHS GOS 3 Covered)`,
          quantity: 1,
          unit: 'Pair',
          unitPrice: 0.0,
          vatRate: PRICING_CONFIG.VAT_RATE,
          amount: 0.0,
        });
      }
      if (dispense.nearFrame && dispense.nearFrame !== '-' && !dispense.nearFrame.toLowerCase().includes('existing')) {
        items.push({
          id: 'item-gos-near-pair',
          description: `Spectacle Dispense (Near / Reading) - ${dispense.nearFrame} (NHS GOS 3 Covered)`,
          quantity: 1,
          unit: 'Pair',
          unitPrice: 0.0,
          vatRate: PRICING_CONFIG.VAT_RATE,
          amount: 0.0,
        });
      }
    }
  } else {
    // Private Funding
    items.push({
      id: 'item-private-exam',
      description: 'Private Domiciliary Eye Examination & Glaucoma/Cataract Assessment',
      quantity: 1,
      unit: 'Assessment',
      unitPrice: PRICING_CONFIG.PRIVATE_SIGHT_TEST,
      vatRate: PRICING_CONFIG.VAT_RATE,
      amount: PRICING_CONFIG.PRIVATE_SIGHT_TEST,
    });

    if (dispense.bifocalFrame && dispense.bifocalFrame !== '-') {
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

  return items;
}

export function calculateTotalAmount(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}
