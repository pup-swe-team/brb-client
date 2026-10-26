import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { colors, text } from '../../../theme';

// OWNER: Member A. CP-506 Admin case view (HTML 87, 88, 89; web admin layout).
// Case header and status, then Borrower identity, Contact, Order record, Chat
// history and Code log. Build it against mock data first: the admin backend
// data may not exist yet. Put mock/real functions in features/admin/services/.
// Open it with: navigation.navigate('AdminCase', { caseId })
export default function AdminCaseScreen({ navigation, route }: any) {
  const { caseId } = route.params as { caseId: string };
  return (
    <View style={s.root}>
      <TopBar title="Unreturned Case" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll>
        <Text style={text.caption}>Case {caseId}</Text>
        <SlotPlaceholder ticket="CP-506" owner="Member A" label="Admin case view" />
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
