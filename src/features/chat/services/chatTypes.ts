// OWNER: Izzy | CP-701, CP-702
// Types for chat conversations, messages, and user blocking.

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
  isMine?: boolean;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAffiliation?: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  listingId?: string;
  listingTitle?: string;
  orderId?: string;
  isBlocked?: boolean;
  blockedByMe?: boolean;
  canBlock?: boolean;
  blockDisabledReason?: string | null;
}

export interface SendMessagePayload {
  conversationId: string;
  text: string;
}

export interface StartConversationPayload {
  participantId?: string;
  participantName?: string;
  listingId?: string;
  listingTitle?: string;
  orderId?: string;
  initialMessage?: string;
}
