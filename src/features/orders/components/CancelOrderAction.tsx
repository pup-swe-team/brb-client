import React, { useState } from 'react';
import { Button } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';
import { CancelOrderSheet } from './CancelOrderSheet';

// OWNER: Danielo. CP-503 Cancel a Requested or Confirmed order.
// Cancel Order button + reason sheet (HTML 41) for both parties. Shown by
// OrderDetailScreen when the status is Requested or Confirmed.
// Service: cancelOrder() in ordersService.ts.
// HTML 24, 25 and 37 show Cancel Order as a secondary button.
export function CancelOrderAction({ order, role, onChanged }: OrderActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button title="Cancel Order" variant="secondary" onPress={() => setOpen(true)} />
      <CancelOrderSheet
        visible={open}
        order={order}
        role={role}
        onClose={() => setOpen(false)}
        onChanged={onChanged}
      />
    </>
  );
}
