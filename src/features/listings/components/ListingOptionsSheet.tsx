import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, text } from '../../../theme';
import { Button } from '../../../shared/components';
import type { ManagedListing } from '../services/listingManagementService';

type Props = {
  listing: ManagedListing | null;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onClose: () => void;
};

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  danger?: boolean;
  onPress: () => void;
};

function OptionRow({ icon, label, hint, danger, onPress }: RowProps) {
  const color = danger ? colors.error : colors.text;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={s.row}>
      <Ionicons name={icon} size={22} color={color} />
      <View style={s.rowText}>
        <Text style={[text.title, { color }]}>{label}</Text>
        {hint ? <Text style={text.caption}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

// Bottom sheet opened from the "..." button on a listing row.
export function ListingOptionsSheet({ listing, onEdit, onToggleActive, onDelete, onClose }: Props) {
  const isActive = listing?.status === 'Active';
  return (
    <Modal transparent visible={!!listing} animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close options">
        {/* Inner Pressable stops taps on the sheet from closing it. */}
        <Pressable style={s.sheet} onPress={() => undefined}>
          <Text style={[text.title, s.title]} numberOfLines={2}>
            {listing?.title}
          </Text>
          <OptionRow icon="create-outline" label="Edit Listing" onPress={onEdit} />
          <OptionRow
            icon={isActive ? 'eye-off-outline' : 'eye-outline'}
            label={isActive ? 'Deactivate Listing' : 'Activate Listing'}
            hint={isActive ? 'Hide it from search and requests' : 'Show it in search again'}
            onPress={onToggleActive}
          />
          <OptionRow
            icon="trash-outline"
            label="Delete Listing"
            danger
            onPress={onDelete}
          />
          <Button title="Cancel" variant="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  title: { marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, gap: 2 },
});
