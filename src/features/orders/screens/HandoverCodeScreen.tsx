import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { colors, text } from '../../../theme';

// OWNER: Member B. CP-504 show or enter the handover code (HTML 26, 27, 28, 38).
// ONE screen with two variants, driven by route.params.mode: 'show' (Lender shows the code) or 'enter' (Borrower types it). Use CodeInput from shared. Service: generateHandoverCode(), confirmHandover().
// Error, locked and expired variants are state of this same screen (CLAUDE.md rule 5).
// Open it with: navigation.navigate('HandoverCode', { orderId, mode })
export default function HandoverCodeScreen({ navigation, route }: any) {
  const { orderId, mode } = route.params as { orderId: string; mode: 'show' | 'enter' };
  return (
    <View style={s.root}>
      <TopBar title="Handover Code" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <Text style={text.caption}>Order {orderId} · mode: {mode}</Text>
        <SlotPlaceholder ticket="CP-504" owner="Member B" label="Handover Code screen" />
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
