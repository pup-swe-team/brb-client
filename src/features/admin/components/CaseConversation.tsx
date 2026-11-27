import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';
import { Button } from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { CaseMessage, getCaseConversation } from '../services/caseConversationService';

type Props = {
  caseId: string;
  borrowerName: string;
  lenderName: string;
};

const ROLE_LABELS = { borrower: 'Borrower', lender: 'Lender' } as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatSentAt(iso: string) {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${hours % 12 || 12}:${minutes} ${period}`;
}

function MessageBubble({ message, senderName }: { message: CaseMessage; senderName: string }) {
  const fromLender = message.sender === 'lender';
  return (
    <View style={[s.bubbleRow, fromLender && s.bubbleRowEnd]}>
      <View style={[s.bubble, fromLender ? s.bubbleLender : s.bubbleBorrower]}>
        <Text style={s.sender}>
          {ROLE_LABELS[message.sender]} · {senderName}
        </Text>
        <Text style={s.messageText}>{message.text}</Text>
        <Text style={s.time}>{formatSentAt(message.sentAt)}</Text>
      </View>
    </View>
  );
}

export function CaseConversation({ caseId, borrowerName, lenderName }: Props) {
  const [messages, setMessages] = useState<CaseMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    getCaseConversation(caseId)
      .then((data) => {
        if (active) {
          setError(null);
          setMessages(data);
        }
      })
      .catch((e) => {
        if (active) setError(extractApiError(e));
      });

    return () => {
      active = false;
    };
  }, [caseId, attempt]);

  if (error) {
    return (
      <View style={s.card}>
        <Text style={s.errorText}>{error}</Text>
        <Button
          title="Try again"
          variant="secondary"
          onPress={() => {
            setMessages(null);
            setError(null);
            setAttempt((n) => n + 1);
          }}
        />
      </View>
    );
  }

  if (messages === null) {
    return (
      <View style={s.card}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View style={s.card}>
        <Text style={s.muted}>No messages were exchanged for this case.</Text>
      </View>
    );
  }

  const names = { borrower: borrowerName, lender: lenderName };

  return (
    <View style={s.card}>
      <Text style={s.note}>Read-only. Retained because this case is linked to a report.</Text>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} senderName={names[message.sender]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  note: { color: colors.textSecondary, fontSize: 9 },
  muted: { color: colors.textSecondary, fontSize: 10 },
  errorText: { color: colors.error, fontSize: 10, textAlign: 'center' },

  bubbleRow: { flexDirection: 'row' },
  bubbleRowEnd: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.sm,
    gap: 2,
  },
  bubbleBorrower: { backgroundColor: colors.bg, borderColor: colors.border },
  bubbleLender: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  sender: { color: colors.primary, fontSize: 9, fontWeight: '700' },
  messageText: { color: colors.text, fontSize: 10, lineHeight: 14 },
  time: { color: colors.textSecondary, fontSize: 8 },
});