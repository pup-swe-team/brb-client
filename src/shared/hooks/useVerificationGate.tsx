import React, { useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

export type VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

const reasons: Record<Exclude<VerificationStatus, 'Verified'>, string> = {
  Unverified: 'Verify your identity first. Upload your PUP ID or a government-issued ID from your profile.',
  Pending: 'Your ID is still being reviewed. You can use this once you are verified.',
  Rejected: 'Your ID was not approved. Upload a new ID from your profile to get verified.',
};

// Usage:
//   const { guard, gateModal } = useVerificationGate(user.verificationStatus);
//   <Button title="Request item" onPress={() => guard(() => requestItem())} />
//   {gateModal}
export function useVerificationGate(status: VerificationStatus) {
  const [message, setMessage] = useState<string | null>(null);

  const guard = (action: () => void) => {
    if (status === 'Verified') return action();
    setMessage(reasons[status]);
  };

  const gateModal = (
    <ConfirmModal
      visible={message !== null}
      variant="blocked"
      title="Verification required"
      message={message ?? ''}
      onCancel={() => setMessage(null)}
    />
  );

  return { guard, gateModal };
}