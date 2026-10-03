import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadow } from '../../theme';

export function Card({ style, ...rest }: ViewProps) { return <View style={[s.card, style]} {...rest} />; }
const s = StyleSheet.create({ card: { backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, ...shadow.card } });
