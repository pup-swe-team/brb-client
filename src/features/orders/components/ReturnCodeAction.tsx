
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
      title={mode === 'show' ? 'Show Return Code' : 'Confirm Return'}
      onPress={() =>
        navigation.navigate('ReturnCode', {
          orderId: order.id,
          mode,
        })
      }
    />
  );
}
