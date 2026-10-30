
import React from 'react';
import { Button } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';

export function HandoverCodeAction({
  order,
  role,
  navigation,
}: OrderActionProps) {
  const mode = role === 'Lender' ? 'show' : 'enter';

  return (
    <Button
      title={
        mode === 'show'
          ? 'View Handover Code'
          : 'Enter Handover Code'
      }
      onPress={() =>
        navigation.navigate('HandoverCode', {
          orderId: order.id,
          mode,
        })
      }
    />
  );
}
