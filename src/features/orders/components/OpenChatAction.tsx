import React from 'react';
import { Button } from '../../../shared/components';
import type { OrderActionProps } from './orderActionProps';

// CP-202. "Chat" action on OrderDetailScreen (HTML 24, 25, 29, 31, 37, 39, 64).
// Opens the Chat tab. The Chat feature itself is not built yet (features/chat is empty), so for now
// this lands on the temporary Chat tab. When chat ships, pass { orderId: order.id } as the screen
// params here so the conversation opens directly.
export function OpenChatAction({ navigation }: OrderActionProps) {
  return (
    <Button
      title="Chat"
      variant="secondary"
      onPress={() => navigation.navigate('Tabs', { screen: 'Chat' })}
    />
  );
}
