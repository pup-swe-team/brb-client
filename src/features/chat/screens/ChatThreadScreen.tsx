
 // OWNER: Izzy | CP-701, CP-702
// One-to-one conversation thread with messaging and user blocking.

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ScreenContainer, TopBar } from '../../../shared/components';
import { ChatMessage } from '../services/chatTypes';
import {
  blockUser,
  getMessages,
  isUserBlocked,
  markConversationRead,
  sendMessage,
  unblockUser,
} from '../services/chatService';
import BlockUserModal from '../components/BlockUserModal';

const QUICK_REPLIES = [
  'Is this still available?',
  'When can we meet?',
  'Thank you!',
];

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

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
  const [blocking, setBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  useEffect(() => {
    let active = true;

    const loadConversation = async () => {
      try {
        const [messageData, blocked] = await Promise.all([
          getMessages(conversationId),
          recipientId
            ? isUserBlocked(recipientId)
            : Promise.resolve(false),
        ]);

        if (active) {
          setMessages(messageData);
          setIsBlocked(blocked);
        }
      } catch (error) {
        console.warn('[ChatThread] Failed to load conversation:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadConversation();
    markConversationRead(conversationId);

    return () => {
      active = false;
    };
  }, [conversationId, recipientId]);

  const handleSend = async () => {
    const messageText = inputText.trim();

    if (!messageText || sending || isBlocked || blocking) return;

    setSending(true);

    try {
      const sent = await sendMessage(conversationId, messageText);

      setMessages((previous) => [...previous, sent]);
      setInputText('');
    } catch (error) {
      console.warn('[ChatThread] Failed to send message:', error);
      Alert.alert('Message not sent', 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!recipientId || blocking) return;

    setBlocking(true);

    try {
      await blockUser(recipientId);
      setIsBlocked(true);
      setBlockModalVisible(false);
    } catch (error) {
      console.warn('[ChatThread] Failed to block user:', error);
      Alert.alert('Unable to block user', 'Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async () => {
    if (!recipientId || blocking) return;

    setBlocking(true);

    try {
      await unblockUser(recipientId);
      setIsBlocked(false);
      setMenuVisible(false);
    } catch (error) {
      console.warn('[ChatThread] Failed to unblock user:', error);
      Alert.alert('Unable to unblock user', 'Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  const handleMenuAction = (action: string) => {
    setMenuVisible(false);

    if (action === 'block') {
      if (!isBlocked) {
        setBlockModalVisible(true);
      }
      return;
    }

    if (action === 'unblock') {
      handleUnblock();
      return;
    }

    if (action === 'profile') {
      Alert.alert('View Profile', 'Profile viewing is not included in CP-701 or CP-702.');
      return;
    }

    if (action === 'clear') {
      Alert.alert('Clear Chat History', 'Chat history clearing is not included in CP-701 or CP-702.');
      return;
    }

    if (action === 'report') {
      Alert.alert('Report User', 'User reporting is not included in CP-701 or CP-702.');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === 'me' || item.senderName === 'You';

    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.messageWrapperMe : styles.messageWrapperThem,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleThem,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextMe : styles.messageTextThem,
            ]}
          >
            {item.text}
          </Text>
        </View>

        <Text
          style={[
            styles.messageTime,
            isMe ? styles.messageTimeMe : styles.messageTimeThem,
          ]}
        >
          {formatMessageTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopBar
        title={recipientName}
        onBack={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={() => setMenuVisible((previous) => !previous)}
            hitSlop={spacing.sm}
            accessibilityRole="button"
            accessibilityLabel="Chat options"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={colors.white}
            />
          </Pressable>
        }
      />

      {menuVisible ? (
        <>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />

          <View style={styles.menu}>
            <Text style={styles.menuHeading}>USER ACTIONS</Text>
            <Text style={styles.menuSubtitle}>{recipientName}</Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleMenuAction('profile')}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.menuText}>View Profile</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleMenuAction('clear')}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.menuText}>Clear Chat History</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleMenuAction('report')}
            >
              <Ionicons
                name="flag-outline"
                size={16}
                color={colors.warning}
              />
              <Text style={styles.menuText}>Report User</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => handleMenuAction(isBlocked ? 'unblock' : 'block')}
              disabled={blocking}
            >
              <Ionicons
                name={isBlocked ? 'lock-open-outline' : 'ban-outline'}
                size={16}
                color={colors.error}
              />
              <Text style={styles.blockMenuText}>
                {isBlocked ? 'Unblock User' : 'Block User'}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.error}
              />
            </Pressable>
          </View>
        </>
      ) : null}

      <ScreenContainer>
        <View style={styles.content}>
          {listingTitle ? (
            <View style={styles.listingCard}>
              <View style={styles.listingIcon}>
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.listingInfo}>
                <Text style={styles.listingLabel}>Conversation about</Text>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {listingTitle}
                </Text>
              </View>
            </View>
          ) : null}

          {isBlocked ? (
            <View style={styles.blockedBanner}>
              <Ionicons
                name="ban-outline"
                size={18}
                color={colors.error}
              />

              <Text style={styles.blockedText}>
                You have blocked this user.
              </Text>

              <Pressable onPress={handleUnblock} disabled={blocking}>
                <Text style={styles.unblockText}>
                  {blocking ? 'Please wait...' : 'Unblock'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyMessages}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={32}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    Start your conversation
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </ScreenContainer>

      {!isBlocked ? (
        <View style={styles.composer}>
          {!inputText.trim() ? (
            <View style={styles.quickReplies}>
              {QUICK_REPLIES.map((reply) => (
                <Pressable
                  key={reply}
                  style={styles.quickReply}
                  onPress={() => setInputText(reply)}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!sending && !blocking}
            />

            <Pressable
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending || blocking}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              {sending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={colors.white}
                />
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      <BlockUserModal
        visible={blockModalVisible}
        userName={recipientName}
        loading={blocking}
        onConfirm={handleConfirmBlock}
        onCancel={() => setBlockModalVisible(false)}
      />
    </KeyboardAvoidingView>
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
  menuBackdrop: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9,
},
  menu: {
    position: 'absolute',
    top: spacing.xxxl * 2,
    right: spacing.md,
    zIndex: 10,
    elevation: 8,
    width: spacing.xxxl * 5,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  menuHeading: {
    ...text.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  menuSubtitle: {
    ...text.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  menuText: {
    ...text.caption,
    color: colors.text,
    flex: 1,
  },
  blockMenuText: {
    ...text.caption,
    color: colors.error,
    flex: 1,
    fontWeight: '600',
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  listingIcon: {
    width: spacing.xxxl,
    height: spacing.xxxl,
    borderRadius: radius.input,
    backgroundColor: colors.primarySoftPressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  listingLabel: {
    ...text.caption,
    color: colors.textMuted,
  },
  listingTitle: {
    ...text.title,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoftPressed,
    padding: spacing.sm,
    borderRadius: radius.card,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  blockedText: {
    ...text.caption,
    color: colors.error,
    flex: 1,
  },
  unblockText: {
    ...text.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  loader: {
    marginTop: spacing.xl,
  },
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  messageWrapper: {
    maxWidth: '80%',
    gap: spacing.xs,
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageWrapperThem: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  bubbleThem: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    ...text.body,
  },
  messageTextMe: {
    color: colors.white,
  },
  messageTextThem: {
    color: colors.text,
  },
  messageTime: {
    ...text.caption,
    color: colors.textMuted,
  },
  messageTimeMe: {
    textAlign: 'right',
  },
  messageTimeThem: {
    textAlign: 'left',
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...text.caption,
    color: colors.textMuted,
  },
  composer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickReply: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickReplyText: {
    ...text.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: spacing.xxxl + spacing.sm,
    maxHeight: spacing.xxxl * 3,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...text.body,
  },
  sendButton: {
    width: spacing.xxxl + spacing.sm,
    height: spacing.xxxl + spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
