import React from 'react';
import { SlotPlaceholder } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';

// OWNER: Member B. CP-505 Generate and validate return code.
// Borrower: "Show Return Code" -> ReturnCode screen with mode 'show' (HTML 30).
// Lender: "Enter Return Code" -> ReturnCode screen with mode 'enter' (HTML 40).
// Shown by OrderDetailScreen when the status is Active or Overdue. The button only navigates:
// navigation.navigate('ReturnCode', { orderId: order.id, mode })
export function ReturnCodeAction(_props: OrderActionProps) {
  return <SlotPlaceholder ticket="CP-505" owner="Member B" label="Return code button" />;
}
