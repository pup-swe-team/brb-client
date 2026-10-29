
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, ConfirmModal } from '../../../shared/components';
import { respondToRequest } from '../services/ordersService';
import type { OrderActionProps } from './orderActionProps';

export function RespondToRequestActions({
  order,
  onChanged,
}: OrderActionProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [decision, setDecision] = useState<'accept' | 'decline'>('accept');
  const [loading, setLoading] = useState(false);

  const openConfirmation = (nextDecision: 'accept' | 'decline') => {
    setDecision(nextDecision);
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    setLoading(true);

    try {
      await respondToRequest(order.id, decision);
      setModalVisible(false);
      onChanged();

      Alert.alert(
        decision === 'accept' ? 'Request accepted' : 'Request declined',
        decision === 'accept'
          ? `${order.counterpart}'s request has been accepted.`
          : `${order.counterpart}'s request has been declined.`,
      );
    } catch (error) {
      Alert.alert(
        'Unable to update request',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Button
        title="Accept Request"
        onPress={() => openConfirmation('accept')}
        loading={loading && decision === 'accept'}
        disabled={loading}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Decline"
            variant="secondary"
            onPress={() => openConfirmation('decline')}
            disabled={loading}
            compact
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Chat"
            variant="secondary"
            onPress={() =>
              Alert.alert('Chat', 'Chat functionality is not implemented yet.')
            }
            disabled={loading}
            compact
          />
        </View>
      </View>

      <ConfirmModal
        visible={modalVisible}
        title={
          decision === 'accept'
            ? 'Accept this request?'
            : 'Decline this request?'
        }
        message={
          decision === 'accept'
            ? `${order.counterpart} will be notified that you accepted this request.`
            : `${order.counterpart} will be notified that you declined this request. This can't be undone.`
        }
        confirmLabel={decision === 'accept' ? 'Accept' : 'Decline'}
        destructive={decision === 'decline'}
        onConfirm={handleConfirm}
        onCancel={() => setModalVisible(false)}
      />
    </View>
  );
}
