import React from 'react';
import { SlotPlaceholder } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';

// OWNER: Danielo. CP-503 Cancel a Requested or Confirmed order.
// Cancel Order button + reason sheet (HTML 41) for both parties. Shown by
// OrderDetailScreen when the status is Requested or Confirmed.
// Service: cancelOrder() in ordersService.ts.
export function CancelOrderAction(_props: OrderActionProps) {
  return <SlotPlaceholder ticket="CP-503" owner="Danielo" label="Cancel order + reason sheet" />;
}
