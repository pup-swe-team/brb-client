import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { VerificationStatus } from '../../../shared/hooks/useVerificationGate';
import { getLatestIdentityDocumentStatus, type IdentityDocumentStatus } from '../services/verification';

export function toVerificationStatus(status: IdentityDocumentStatus | undefined): VerificationStatus {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Verified';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unverified';
  }
}

// Reads the caller's identity review status and refetches every time the screen gains focus.
export function useVerificationStatus() {
  const [status, setStatus] = useState<VerificationStatus>('Unverified');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLatestIdentityDocumentStatus()
        .then((s) => {
          if (active) setStatus(toVerificationStatus(s));
        })
        .catch(() => {
          // Non-fatal: keep the current value.
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return { status, loading, isVerified: status === 'Verified' };
}
