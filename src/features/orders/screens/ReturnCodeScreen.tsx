import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { colors, text } from '../../../theme';

// OWNER: Member B. CP-505 show or enter the return code, with the damage flag (HTML 30, 40).
// ONE screen with two variants, driven by route.params.mode: 'show' (Borrower shows the code) or 'enter' (Lender types it, with the damage-flag switch). Use CodeInput from shared. Service: generateReturnCode(), confirmReturn().
// Error, locked and expired variants are state of this same screen (CLAUDE.md rule 5).
// Open it with: navigation.navigate('ReturnCode', { orderId, mode })
export default function ReturnCodeScreen({ navigation, route }: any) {
  const { orderId, mode } = route.params as { orderId: string; mode: 'show' | 'enter' };
  return (
    <View style={s.root}>
      <TopBar title="Return Code" onBack={() => navigation.goBack()} />
      <ScreenContainer>
        <Text style={text.caption}>Order {orderId} · mode: {mode}</Text>
        <SlotPlaceholder ticket="CP-505" owner="Member B" label="Return Code screen" />
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
