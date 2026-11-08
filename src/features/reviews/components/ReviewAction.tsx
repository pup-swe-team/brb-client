import React from 'react';
import { Button } from '../../../shared/components';
import type { OrderActionProps } from '../../orders/components/orderActionProps';

// OWNER: Izzy. CP-601. Action slot on OrderDetailScreen, shown when the order is Completed.
// Scaffold: opens the review form. Finish it: hide the button (or show the submitted rating) when
// getOrderReview(order.id) returns a review, so an order cannot be reviewed twice.
export function ReviewAction({ order, navigation }: OrderActionProps) {
  return (
    <Button
      title="Rate & Review"
      variant="secondary"
      onPress={() => navigation.navigate('ReviewForm', { orderId: order.id })}
    />
  );
}
