
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Card, EmptyState, StatusBadge } from '../../../shared/components';
import { colors, text } from '../../../theme';
import type { Order } from '../../../shared/types';
import { getMyOrders } from '../../orders/services/ordersService';

export function IncomingRequestsSection({ navigation }: { navigation: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const lenderOrders = await getMyOrders('Lender');
      setOrders(lenderOrders.filter((order) => order.status === 'Requested'));
    } catch (error) {
      console.error('Failed to load incoming requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} />;
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={text.h2}>Incoming Requests</Text>
        <View
          style={{
            backgroundColor: colors.info,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: '600' }}>
            {orders.length}
          </Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <EmptyState
          title="No incoming requests"
          message="New borrow requests will appear here."
        />
      ) : (
        orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('OrderDetail', {
                orderId: order.id,
                role: 'Lender',
              })
            }
          >
            <Card>
              <View style={{ gap: 8 }}>
                <Text style={text.h2}>{order.listingTitle}</Text>
                <Text style={text.body}>
                  Request #{order.orderNumber}
                </Text>
                <Text style={text.body}>
                  Requested by: {order.counterpart}
                </Text>
                <Text style={text.body}>
                  {order.startDate} – {order.endDate}
                </Text>
                <StatusBadge status={order.status} />
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  View request →
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}
