import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { colors } from '../../../theme';

// OWNER: Lance. CP-801 Notify users of key platform events.
// In-app notification list + mark-as-read control (single item and "Mark all as read").
// Route: Notifications (registered). Opened from the dashboard's notifications panel (CP-202, Danielo).
// Service: features/notifications/services/notificationsService.ts (contract already fixed).
// Tapping an item with an orderId should navigate('OrderDetail', { orderId, role }).
// Replace the SlotPlaceholder with the real UI. Use StatusBadge/EmptyState from shared where they fit.
export default function NotificationsScreen({ navigation }: any) {
  return (
    <View style={s.root}>
      <TopBar title="Notifications" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll>
        <SlotPlaceholder ticket="CP-801" owner="Lance" label="Notification list + mark as read" />
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
