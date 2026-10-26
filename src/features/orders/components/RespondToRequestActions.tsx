import React from 'react';
import { SlotPlaceholder } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';

// OWNER: Member B. CP-502 Accept or decline a borrow request.
// Accept Request / Decline buttons + the decline confirm (HTML 35, 36).
// Shown by OrderDetailScreen when the status is Requested and the viewer is the Lender.
// Service: respondToRequest() in ordersService.ts.
export function RespondToRequestActions(_props: OrderActionProps) {
  return <SlotPlaceholder ticket="CP-502" owner="Member B" label="Accept / decline request" />;
}
