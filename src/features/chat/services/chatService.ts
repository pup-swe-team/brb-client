// OWNER: Izzy | CP-701, CP-702
// Chat service supporting mock mode and real backend endpoints.

import { http, USE_MOCK } from '../../../services/http';
import { ChatConversation, ChatMessage, StartConversationPayload } from './chatTypes';
import {
  mockBlockedUserIds,
  mockConversations,
  mockMessages,
} from './mockChats';

export async function getConversations(): Promise<ChatConversation[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return mockConversations.map((c) => ({
      ...c,
      isBlocked: mockBlockedUserIds.includes(c.participantId),
      blockedByMe: mockBlockedUserIds.includes(c.participantId),
    }));
  }

  try {
    const { data } = await http.get('/chats/');
    const list = Array.isArray(data) ? data : data?.results || [];
    return list.map((item: any) => ({
      id: String(item.id || item.conversation_id),
      participantId: String(item.participant_id || item.other_user?.id || ''),
      participantName: item.participant_name || item.other_user?.full_name || 'User',
      participantAvatar: item.participant_avatar || item.other_user?.avatar || undefined,
      lastMessage: item.last_message?.text || item.last_message || undefined,
      lastMessageAt: item.last_message?.created_at || item.updated_at || undefined,
      unreadCount: Number(item.unread_count || 0),
      listingId: item.listing_id ? String(item.listing_id) : undefined,
      listingTitle: item.listing_title || item.listing?.title || undefined,
      orderId: item.order_id ? String(item.order_id) : undefined,
      isBlocked: Boolean(item.is_blocked),
      blockedByMe: Boolean(item.blocked_by_me),
    }));
  } catch (err) {
    console.warn('[chatService] Failed to fetch conversations from backend, using mock:', err);
    return mockConversations;
  }
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return mockMessages[conversationId] || [];
  }

  try {
    const { data } = await http.get(`/chats/${conversationId}/messages/`);
    const list = Array.isArray(data) ? data : data?.results || [];
    return list.map((m: any) => ({
      id: String(m.id),
      conversationId: String(m.conversation_id || conversationId),
      senderId: String(m.sender_id || m.sender?.id || ''),
      senderName: m.sender_name || m.sender?.full_name || 'User',
      text: m.text || m.content || '',
      createdAt: m.created_at || new Date().toISOString(),
      read: Boolean(m.read || m.is_read),
    }));
  } catch (err) {
    console.warn('[chatService] Failed to fetch messages, using mock:', err);
    return mockMessages[conversationId] || [];
  }
}

export async function sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      conversationId,
      senderId: 'me',
      senderName: 'You',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: true,
    };
    if (!mockMessages[conversationId]) {
      mockMessages[conversationId] = [];
    }
    mockMessages[conversationId].push(newMsg);

    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = text.trim();
      conv.lastMessageAt = newMsg.createdAt;
    }
    return newMsg;
  }

  const { data } = await http.post(`/chats/${conversationId}/messages/`, { text: text.trim() });
  return {
    id: String(data.id),
    conversationId: String(data.conversation_id || conversationId),
    senderId: String(data.sender_id || data.sender?.id || 'me'),
    senderName: data.sender_name || 'You',
    text: data.text || text.trim(),
    createdAt: data.created_at || new Date().toISOString(),
    read: true,
  };
}

export async function startConversation(payload: StartConversationPayload): Promise<ChatConversation> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const existing = mockConversations.find(
      (c) => c.participantId === payload.participantId && (!payload.listingId || c.listingId === payload.listingId),
    );
    if (existing) return existing;

    const newConv: ChatConversation = {
      id: `c_${Date.now()}`,
      participantId: payload.participantId,
      participantName: 'Lender / Borrower',
      unreadCount: 0,
      listingId: payload.listingId,
      orderId: payload.orderId,
      lastMessage: payload.initialMessage || 'Started conversation',
      lastMessageAt: new Date().toISOString(),
      isBlocked: false,
      blockedByMe: false,
    };
    mockConversations.unshift(newConv);
    return newConv;
  }

  const { data } = await http.post('/chats/', {
    participant_id: payload.participantId,
    listing_id: payload.listingId,
    order_id: payload.orderId,
    initial_message: payload.initialMessage,
  });

  return {
    id: String(data.id),
    participantId: String(data.participant_id || payload.participantId),
    participantName: data.participant_name || 'User',
    unreadCount: 0,
    listingId: data.listing_id || payload.listingId,
    orderId: data.order_id || payload.orderId,
    lastMessage: data.last_message?.text,
    lastMessageAt: data.last_message?.created_at,
    isBlocked: false,
    blockedByMe: false,
  };
}

export async function blockUser(userId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    if (!mockBlockedUserIds.includes(userId)) {
      mockBlockedUserIds.push(userId);
    }
    return;
  }

  await http.post(`/users/${userId}/block/`);
}

export async function unblockUser(userId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockBlockedUserIds.indexOf(userId);
    if (idx !== -1) mockBlockedUserIds.splice(idx, 1);
    return;
  }

  await http.post(`/users/${userId}/unblock/`);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  if (USE_MOCK) {
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) conv.unreadCount = 0;
    return;
  }

  try {
    await http.post(`/chats/${conversationId}/read/`);
  } catch {
    // Non-blocking
  }
}
