// OWNER: Izzy | CP-701
// Chat tab screen: Displays conversation threads with counterparties, unread badges, and search/filter.

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, text } from '../../../theme';
import { ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { ChatConversation } from '../services/chatTypes';
import { getConversations } from '../services/chatService';

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  const openThread = (conv: ChatConversation) => {
    navigation.navigate('ChatThread', {
      conversationId: conv.id,
      recipientId: conv.participantId,
      recipientName: conv.participantName,
      listingId: conv.listingId,
      orderId: conv.orderId,
    });
  };

  return (
    <View style={s.container}>
      <TopBar title="Messages" />

      <ScreenContainer>
        <SlotPlaceholder
          ticket="CP-701"
          owner="Izzy"
          label="Chat Thread List & Unread Indicators"
        />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={s.convCard}
                onPress={() => openThread(item)}
                accessibilityRole="button"
                accessibilityLabel={`Chat with ${item.participantName}`}
              >
                <View style={s.avatar}>
                  <Ionicons name="person" size={20} color={colors.white} />
                </View>
                <View style={s.convInfo}>
                  <View style={s.row}>
                    <Text style={s.name}>{item.participantName}</Text>
                    {item.unreadCount > 0 ? (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{item.unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                  {item.listingTitle ? (
                    <Text style={s.listingTag} numberOfLines={1}>
                      Re: {item.listingTitle}
                    </Text>
                  ) : null}
                  <Text style={s.lastMsg} numberOfLines={1}>
                    {item.lastMessage || 'No messages yet'}
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                <Text style={s.emptyText}>No messages yet.</Text>
                <Text style={s.emptySubtext}>
                  Inquire on a listing or order to chat with borrowers and lenders.
                </Text>
              </View>
            }
          />
        )}
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingVertical: spacing.md, gap: spacing.sm },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convInfo: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...text.title, fontSize: 15 },
  listingTag: { ...text.caption, color: colors.primary, fontWeight: '600' },
  lastMsg: { ...text.body, color: colors.textSecondary, fontSize: 13 },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...text.title, color: colors.textSecondary },
  emptySubtext: { ...text.caption, color: colors.textMuted, textAlign: 'center', maxWidth: 260 },
});
