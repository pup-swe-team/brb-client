// OWNER: Izzy | CP-701, CP-702
// Mock data for chat development. Used when EXPO_PUBLIC_USE_MOCK=true.

import { ChatConversation, ChatMessage } from './chatTypes';

export let mockConversations: ChatConversation[] = [
  {
    id: 'c1',
    participantId: 'u2',
    participantName: 'Princess Izzy Dancal',
    participantAvatar: undefined,
    lastMessage: 'Hi! Is the Basic Calculator still available for tomorrow?',
    lastMessageAt: '2026-02-24T10:30:00Z',
    unreadCount: 1,
    listingId: '5',
    listingTitle: 'Basic Calculator',
    isBlocked: false,
    blockedByMe: false,
  },
  {
    id: 'c2',
    participantId: 'u3',
    participantName: 'John Ezekiel Lacap',
    participantAvatar: undefined,
    lastMessage: 'Sure, let us meet near the PUP Main Gate for the handover.',
    lastMessageAt: '2026-02-23T15:20:00Z',
    unreadCount: 0,
    listingId: '2',
    listingTitle: 'Lab Coat (MEDIUM)',
    orderId: 'o9',
    isBlocked: false,
    blockedByMe: false,
  },
  {
    id: 'c3',
    participantId: 'u4',
    participantName: 'Lawrence Aragon',
    participantAvatar: undefined,
    lastMessage: 'Thank you for the quick return!',
    lastMessageAt: '2026-02-20T12:00:00Z',
    unreadCount: 0,
    listingId: '1',
    listingTitle: 'Laptop (i5 8th Gen)',
    isBlocked: false,
    blockedByMe: false,
  },
];

export let mockMessages: Record<string, ChatMessage[]> = {
  c1: [
    {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'u2',
      senderName: 'Princess Izzy Dancal',
      text: 'Good day! Inquiring about your calculator listing.',
      createdAt: '2026-02-24T10:25:00Z',
      read: true,
    },
    {
      id: 'm2',
      conversationId: 'c1',
      senderId: 'u2',
      senderName: 'Princess Izzy Dancal',
      text: 'Hi! Is the Basic Calculator still available for tomorrow?',
      createdAt: '2026-02-24T10:30:00Z',
      read: false,
    },
  ],
  c2: [
    {
      id: 'm3',
      conversationId: 'c2',
      senderId: 'me',
      senderName: 'You',
      text: 'Hi John, when can we meet for the lab coat pickup?',
      createdAt: '2026-02-23T15:15:00Z',
      read: true,
    },
    {
      id: 'm4',
      conversationId: 'c2',
      senderId: 'u3',
      senderName: 'John Ezekiel Lacap',
      text: 'Sure, let us meet near the PUP Main Gate for the handover.',
      createdAt: '2026-02-23T15:20:00Z',
      read: true,
    },
  ],
  c3: [
    {
      id: 'm5',
      conversationId: 'c3',
      senderId: 'u4',
      senderName: 'Lawrence Aragon',
      text: 'Thank you for the quick return!',
      createdAt: '2026-02-20T12:00:00Z',
      read: true,
    },
  ],
};

export let mockBlockedUserIds: string[] = [];
