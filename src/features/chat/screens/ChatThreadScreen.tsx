// OWNER: Izzy | CP-701, CP-702
// One-to-one conversation thread: Message bubbles, sending input, and user block control.

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, text } from '../../../theme';
import { ScreenContainer, SlotPlaceholder, TopBar } from '../../../shared/components';
import { ChatMessage } from '../services/chatTypes';
import {
  blockUser,
  getMessages,
  markConversationRead,
  sendMessage,
  unblockUser,
} from '../services/chatService';
import BlockUserModal from '../components/BlockUserModal';

export default function ChatThreadScreen({ navigation, route }: any) {
  const {
    conversationId = 'c1',
    recipientName = 'Conversation',
    recipientId = '',
    listingTitle,
  } = route?.params || {};

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  useEffect(() => {
    getMessages(conversationId)
      .then(setMessages)
      .finally(() => setLoading(false));

    markConversationRead(conversationId);
  }, [conversationId]);

  const handleSend = async () => {
    if (!inputText.trim() || sending || isBlocked) return;
    const txt = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const sent = await sendMessage(conversationId, txt);
      setMessages((prev) => [...prev, sent]);
    } finally {
      setSending(false);
    }
  };

  const handleConfirmBlock = async () => {
    setBlockModalVisible(false);
    if (recipientId) {
      await blockUser(recipientId);
      setIsBlocked(true);
    }
  };

  const handleUnblock = async () => {
    if (recipientId) {
      await unblockUser(recipientId);
      setIsBlocked(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopBar
        title={recipientName}
        onBack={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={() => setBlockModalVisible(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Block user options"
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </Pressable>
        }
      />

      <ScreenContainer>
        <SlotPlaceholder
          ticket="CP-701 / CP-702"
          owner="Izzy"
          label="One-to-One Thread View & Block User Control"
        />

        {listingTitle ? (
          <View style={s.listingHeader}>
            <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
            <Text style={s.listingText} numberOfLines={1}>
              Regarding: {listingTitle}
            </Text>
          </View>
        ) : null}

        {isBlocked ? (
          <View style={s.blockedBanner}>
            <Ionicons name="ban-outline" size={18} color={colors.error} />
            <Text style={s.blockedText}>You have blocked this user.</Text>
            <Pressable onPress={handleUnblock}>
              <Text style={s.unblockLink}>Unblock</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.messageList}
            renderItem={({ item }) => {
              const isMe = item.senderId === 'me' || item.senderName === 'You';
              return (
                <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                  <Text style={[s.msgText, isMe ? s.msgTextMe : s.msgTextThem]}>
                    {item.text}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </ScreenContainer>

      {/* INPUT BAR */}
      {!isBlocked ? (
        <View style={s.inputBar}>
          <TextInput
            style={s.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable
            style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      ) : null}

      <BlockUserModal
        visible={blockModalVisible}
        userName={recipientName}
        onConfirm={handleConfirmBlock}
        onCancel={() => setBlockModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.card,
    gap: spacing.xs,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listingText: { ...text.caption, color: colors.textSecondary, fontWeight: '600' },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: radius.card,
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  blockedText: { ...text.caption, color: colors.error, flex: 1 },
  unblockLink: { ...text.caption, color: colors.primary, fontWeight: '700' },
  messageList: { paddingVertical: spacing.md, gap: spacing.xs },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    marginVertical: 2,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 2,
  },
  msgText: { ...text.body, fontSize: 14 },
  msgTextMe: { color: colors.white },
  msgTextThem: { color: colors.text },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...text.body,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
