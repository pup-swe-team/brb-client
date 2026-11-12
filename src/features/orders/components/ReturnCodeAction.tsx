
import React from 'react';
import { Button } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';

export function ReturnCodeAction({
  order,
  role,
  navigation,
}: OrderActionProps) {
  const mode = role === 'Borrower' ? 'show' : 'enter';

  return (
    <Button
      // HTML 29/31 (Borrower): "Return Item". HTML 39 (Lender): "Confirm Return".
      title={mode === 'show' ? 'Return Item' : 'Confirm Return'}
      onPress={() =>
        navigation.navigate('ReturnCode', {
          orderId: order.id,
          mode,
        })
      }
    />
  );
}
