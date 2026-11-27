
// OWNER: Izzy | CP-701
// Chat tab screen: Displays searchable conversations, latest messages, and unread indicators.

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, text } from '../../../theme';
import {
  EmptyState,
  ScreenContainer,
  TopBar,
} from '../../../shared/components';
import { AffiliationBadge } from '../../../shared/components/VerifiedLabel';
import { ChatConversation } from '../services/chatTypes';
import { getConversations } from '../services/chatService';

function formatTimestamp(value?: string) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

export default function ChatListScreen() {
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getConversations()
      .then((data) => {
        setConversations(data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...conversations]
      .filter((conversation) => {
        if (!query) return true;

        return (
          conversation.participantName.toLowerCase().includes(query) ||
          conversation.listingTitle?.toLowerCase().includes(query) ||
          conversation.lastMessage?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastMessageAt || 0).getTime();
        const dateB = new Date(b.lastMessageAt || 0).getTime();

        return dateB - dateA;
      });
  }, [conversations, searchQuery]);

  const openThread = (conversation: ChatConversation) => {
    navigation.navigate('ChatThread', {
      conversationId: conversation.id,
      recipientId: conversation.participantId,
      recipientName: conversation.participantName,
      recipientAffiliation: conversation.participantAffiliation,
      listingId: conversation.listingId,
      listingTitle: conversation.listingTitle,
      orderId: conversation.orderId,
    });
  };

  const renderConversation = ({
    item,
  }: {
    item: ChatConversation;
  }) => (
    <Pressable
      style={styles.convCard}
      onPress={() => openThread(item)}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${item.participantName}`}
    >
      <View style={styles.avatar}>
        <Ionicons
          name="person"
          size={20}
          color={colors.white}
        />
      </View>

      <View style={styles.convInfo}>
        <View style={styles.row}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.participantName}
            </Text>
            {item.participantAffiliation ? (
              <AffiliationBadge affiliation={item.participantAffiliation} compact />
            ) : null}
          </View>

          <View style={styles.messageMeta}>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.lastMessageAt)}
            </Text>

            {item.unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {item.listingTitle ? (
          <Text style={styles.listingTag} numberOfLines={1}>
            Re: {item.listingTitle}
          </Text>
        ) : null}

        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <TopBar title="Messages" />

      <ScreenContainer>
        <View style={styles.content}>
          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textMuted}
            />

            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={spacing.sm}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            ) : null}
          </View>

          {/* CONVERSATION LIST */}
          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.loader}
            />
          ) : error ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Unable to load messages"
              message="Please try again later."
            />
          ) : (
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.id}
              renderItem={renderConversation}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <EmptyState
                  icon="chatbubbles-outline"
                  title={
                    searchQuery.trim()
                      ? 'No matching conversations'
                      : 'No messages yet'
                  }
                  message={
                    searchQuery.trim()
                      ? 'Try searching with another name or listing.'
                      : 'Inquire on a listing or order to chat with borrowers and lenders.'
                  }
                />
              }
            />
          )}
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.md,
    minHeight: spacing.xxxl + spacing.sm,
  },
  searchInput: {
  flex: 1,
  paddingVertical: spacing.sm,
  ...text.body,
  color: colors.text,
},
  loader: {
    marginTop: spacing.xl,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
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
    width: spacing.xxxl + spacing.sm,
    height: spacing.xxxl + spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  name: {
    ...text.title,
    flexShrink: 1,
  },
  messageMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  timestamp: {
    ...text.caption,
    color: colors.textMuted,
  },
  listingTag: {
    ...text.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  lastMsg: {
    ...text.body,
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minWidth: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  badgeText: {
    ...text.caption,
    color: colors.white,
    fontWeight: '700',
  },
});
