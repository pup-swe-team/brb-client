import { USE_MOCK } from '../../../services/http';
import { PublicLenderProfile } from './lenderTypes';
import { MOCK_LENDERS } from './mockLenders';

export * from './lenderTypes';

export async function getLenderProfile(lenderId: string): Promise<PublicLenderProfile> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const profile = MOCK_LENDERS[lenderId];
    if (!profile) {
      throw new Error('Lender not found');
    }
    return profile;
  }

  // TODO: Connect to backend endpoint when ready
  throw new Error('Lender profile endpoint not connected yet. Set EXPO_PUBLIC_USE_MOCK=true to use mock data.');
}
