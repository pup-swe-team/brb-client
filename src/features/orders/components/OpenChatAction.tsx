import React from 'react';
import { Button } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';

// CP-202 / CP-701. "Chat" action on OrderDetailScreen.
// Navigates directly to ChatThread with the order details and counterparty name.
export function OpenChatAction({ navigation, order, role }: OrderActionProps) {
  const recipientName =
    role === 'Lender'
      ? order.borrowerName || order.counterpart || 'Borrower'
      : order.lenderName || order.counterpart || 'Lender';

  return (
    <Button
      title="Chat"
      variant="secondary"
      onPress={() =>
        navigation.navigate('ChatThread', {
          orderId: order.id,
          recipientName,
          listingTitle: order.listingTitle,
        })
      }
    />
  );
}
