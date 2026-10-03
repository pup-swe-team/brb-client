import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, CodeInput, ConfirmModal, EmptyState, Input, ScreenContainer, StatusBadge, TopBar } from '../../shared/components';
import { OrderStatus } from '../../shared/types';
import { text } from '../../theme';

const STATUSES: OrderStatus[] = ['Requested', 'Confirmed', 'Active', 'Overdue', 'Unreturned', 'Returned', 'Completed', 'Disputed', 'Declined', 'Expired', 'Cancelled'];
export function ComponentGallery({ navigation }: any) {
  const [code, setCode] = useState(''); const [m, setM] = useState<null | 'confirm' | 'blocked'>(null);
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Component Gallery" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll>
        <Text style={text.h2}>Buttons</Text>
        <Button title="Primary" /><Button title="Secondary" variant="secondary" /><Button title="Destructive" variant="destructive" /><Button title="Disabled" disabled />
        <Text style={text.h2}>Inputs</Text>
        <Input label="Email" placeholder="Enter your PUP webmail" /><Input label="Password" password placeholder="Enter your password" />
        <Input label="With error" error="Use your PUP webmail address." />
        <Text style={text.h2}>Status badges</Text>
        <View style={{ gap: 8 }}>{STATUSES.map((s) => <StatusBadge key={s} status={s} />)}</View>
        <Text style={text.h2}>Card</Text><Card><Text style={text.body}>Card content</Text></Card>
        <Text style={text.h2}>Code input</Text><CodeInput value={code} onChange={setCode} /><CodeInput value="123" onChange={() => {}} error="Incorrect code." />
        <Text style={text.h2}>Empty state</Text><EmptyState title="Nothing here yet" message="Items you borrow will show up here." actionLabel="Browse items" />
        <Text style={text.h2}>Dialogs</Text>
        <Button title="Confirm dialog" variant="secondary" onPress={() => setM('confirm')} /><Button title="Blocked dialog" variant="secondary" onPress={() => setM('blocked')} />
      </ScreenContainer>
      <ConfirmModal visible={m === 'confirm'} title="Cancel this order?" message="The dates will be released." destructive onConfirm={() => setM(null)} onCancel={() => setM(null)} />
      <ConfirmModal visible={m === 'blocked'} variant="blocked" title="Can't delete this listing" message="It has a Confirmed or Active order." onCancel={() => setM(null)} />
    </View>
  );
}
