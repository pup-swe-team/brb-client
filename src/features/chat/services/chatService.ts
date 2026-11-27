
// OWNER: Izzy | CP-701, CP-702
// Chat service supporting mock mode and real backend endpoints.

import { http, USE_MOCK } from '../../../services/http';
import {
  ChatConversation,
  ChatMessage,
  StartConversationPayload,
} from './chatTypes';
import {
  mockBlockedUserIds,
  mockConversations,
  mockMessages,
} from './mockChats';

// Retrieve all conversations.
export async function getConversations(): Promise<ChatConversation[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return mockConversations.map((conversation) => ({
      ...conversation,
      isBlocked: mockBlockedUserIds.includes(conversation.participantId),
      blockedByMe: mockBlockedUserIds.includes(conversation.participantId),
    }));
  }

  try {
    const { data } = await http.get('/chats/');
    const list = Array.isArray(data) ? data : data?.results || [];

    return list.map((item: any) => ({
      id: String(item.id || item.conversation_id),
      participantId: String(
        item.participant_id || item.other_user?.id || '',
      ),
      participantName:
        item.participant_name || item.other_user?.full_name || 'User',
      participantAvatar:
        item.participant_avatar || item.other_user?.avatar || undefined,
      lastMessage: item.last_message?.text || item.last_message || undefined,
      lastMessageAt:
        item.last_message?.created_at || item.updated_at || undefined,
      unreadCount: Number(item.unread_count || 0),
      listingId: item.listing_id ? String(item.listing_id) : undefined,
      listingTitle: item.listing_title || item.listing?.title || undefined,
      orderId: item.order_id ? String(item.order_id) : undefined,
      isBlocked: Boolean(item.is_blocked),
      blockedByMe: Boolean(item.blocked_by_me),
    }));
  } catch (error) {
    console.warn('[chatService] Failed to fetch conversations:', error);
    return mockConversations;
  }
}

// Retrieve messages for one conversation.
export async function getMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return [...(mockMessages[conversationId] || [])];
  }

  try {
    const { data } = await http.get(
      `/chats/${conversationId}/messages/`,
    );

    const list = Array.isArray(data) ? data : data?.results || [];

    return list.map((message: any) => ({
      id: String(message.id),
      conversationId: String(message.conversation_id || conversationId),
      senderId: String(
        message.sender_id || message.sender?.id || '',
      ),
      senderName:
        message.sender_name || message.sender?.full_name || 'User',
      text: message.text || message.content || '',
      createdAt: message.created_at || new Date().toISOString(),
      read: Boolean(message.read || message.is_read),
    }));
  } catch (error) {
    console.warn('[chatService] Failed to fetch messages:', error);
    return mockMessages[conversationId] || [];
  }
}

// Send a message.
export async function sendMessage(
  conversationId: string,
  text: string,
): Promise<ChatMessage> {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error('Message cannot be empty.');
  }

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!mockMessages[conversationId]) {
      mockMessages[conversationId] = [];
    }

    const newMessage: ChatMessage = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      conversationId,
      senderId: 'me',
      senderName: 'You',
      text: trimmedText,
      createdAt: new Date().toISOString(),
      read: true,
    };

    mockMessages[conversationId] = [...mockMessages[conversationId], newMessage];

    const conversation = mockConversations.find(
      (item) => item.id === conversationId,
    );

    if (conversation) {
      conversation.lastMessage = trimmedText;
      conversation.lastMessageAt = newMessage.createdAt;
    }

    return newMessage;
  }

  const { data } = await http.post(
    `/chats/${conversationId}/messages/`,
    { text: trimmedText },
  );

  return {
    id: String(data.id),
    conversationId: String(data.conversation_id || conversationId),
    senderId: String(data.sender_id || data.sender?.id || 'me'),
    senderName: data.sender_name || 'You',
    text: data.text || trimmedText,
    createdAt: data.created_at || new Date().toISOString(),
    read: true,
  };
}

// Start a conversation.
export async function startConversation(
  payload: StartConversationPayload,
): Promise<ChatConversation> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const existing = mockConversations.find(
      (conversation) =>
        (payload.orderId && conversation.orderId === payload.orderId) ||
        (payload.participantId &&
          conversation.participantId === payload.participantId &&
          (!payload.listingId ||
            conversation.listingId === payload.listingId)) ||
        (!payload.participantId &&
          payload.participantName &&
          conversation.participantName.toLowerCase() ===
            payload.participantName.toLowerCase()),
    );

    if (existing) return existing;

    const newConversation: ChatConversation = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      participantId:
        payload.participantId || `u_${Date.now().toString(36)}`,
      participantName: payload.participantName || 'Lender / Borrower',
      unreadCount: 0,
      listingId: payload.listingId,
      listingTitle: payload.listingTitle,
      orderId: payload.orderId,
      lastMessage: payload.initialMessage || 'Started conversation',
      lastMessageAt: new Date().toISOString(),
      isBlocked: false,
      blockedByMe: false,
    };

    mockConversations.unshift(newConversation);
    mockMessages[newConversation.id] = [];

    return newConversation;
  }

  const { data } = await http.post('/chats/', {
    ...(payload.participantId ? { participant_id: payload.participantId } : {}),
    ...(payload.listingId ? { listing_id: payload.listingId } : {}),
    ...(payload.orderId ? { order_id: payload.orderId } : {}),
    ...(payload.initialMessage ? { initial_message: payload.initialMessage } : {}),
  });

  return {
    id: String(data.id),
    participantId: String(data.participant_id || payload.participantId || ''),
    participantName:
      data.participant_name || payload.participantName || 'User',
    unreadCount: 0,
    listingId: data.listing_id ? String(data.listing_id) : payload.listingId,
    listingTitle: data.listing_title || payload.listingTitle,
    orderId: data.order_id ? String(data.order_id) : payload.orderId,
    lastMessage: data.last_message?.text,
    lastMessageAt: data.last_message?.created_at,
    isBlocked: false,
    blockedByMe: false,
  };
}

// Check whether a user is blocked.
export async function isUserBlocked(userId: string): Promise<boolean> {
  if (USE_MOCK) {
    return mockBlockedUserIds.includes(userId);
  }

  try {
    const { data } = await http.get(`/users/${userId}/block/`);
    return Boolean(data.is_blocked || data.blocked_by_me);
  } catch (error) {
    console.warn('[chatService] Failed to check block status:', error);
    return false;
  }
}

// Block a user.
export async function blockUser(userId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!mockBlockedUserIds.includes(userId)) {
      mockBlockedUserIds.push(userId);
    }

    const conversation = mockConversations.find(
      (item) => item.participantId === userId,
    );

    if (conversation) {
      conversation.isBlocked = true;
      conversation.blockedByMe = true;
    }

    return;
  }

  await http.post(`/users/${userId}/block/`);
}

// Unblock a user.
export async function unblockUser(userId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const index = mockBlockedUserIds.indexOf(userId);

    if (index !== -1) {
      mockBlockedUserIds.splice(index, 1);
    }

    const conversation = mockConversations.find(
      (item) => item.participantId === userId,
    );

    if (conversation) {
      conversation.isBlocked = false;
      conversation.blockedByMe = false;
    }

    return;
  }

  await http.post(`/users/${userId}/unblock/`);
}

// Mark a conversation as read.
export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  if (USE_MOCK) {
    const conversation = mockConversations.find(
      (item) => item.id === conversationId,
    );

    if (conversation) {
      conversation.unreadCount = 0;
    }

    return;
  }

  try {
    await http.post(`/chats/${conversationId}/read/`);
  } catch {
    // Marking as read is non-blocking.
  }
}
