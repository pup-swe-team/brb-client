import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { colors, text } from '../../../theme';

// OWNER: Member B. CP-505, the damage-flag follow-up (HTML 63).
// The Lender lands here after confirming a return with the damage flag on:
// what happened, description, at least 1 photo and 1 video. The order becomes Disputed.
// Open it with: navigation.navigate('ReportDamage', { orderId })
export default function ReportDamageScreen({ navigation, route }: any) {
  const { orderId } = route.params as { orderId: string };
  return (
    <View style={s.root}>
      <TopBar title="Report Damage" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <Text style={text.caption}>Order {orderId}</Text>
        <SlotPlaceholder ticket="CP-505" owner="Member B" label="Report damage form" />
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
