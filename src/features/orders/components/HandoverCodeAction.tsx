import React from 'react';
import { SlotPlaceholder } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';

// OWNER: Member B. CP-504 Generate and validate handover code.
// Lender: "View Handover Code" -> HandoverCode screen with mode 'show' (HTML 38).
// Borrower: "Enter Handover Code" -> HandoverCode screen with mode 'enter' (HTML 26, 27, 28).
// Shown by OrderDetailScreen when the status is Confirmed. The button only navigates:
// navigation.navigate('HandoverCode', { orderId: order.id, mode })
export function HandoverCodeAction(_props: OrderActionProps) {
  return <SlotPlaceholder ticket="CP-504" owner="Member B" label="Handover code button" />;
}
