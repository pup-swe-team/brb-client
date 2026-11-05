import { useCallback, useEffect, useState } from 'react';
import {
  CODE_LOCKOUT_MAX_ATTEMPTS,
  CodeKind,
  getCodeLockout,
  OrderCodeError,
} from '../services/ordersService';

// Fallback only if the backend reports a lockout without any expiry information.
const FALLBACK_LOCKOUT_MS = 15 * 60 * 1000;

// Server-backed lockout state for the handover / return code entry screens (FE-BUG-3003).
// The server owns the clock: `refresh()` re-reads it whenever the screen mounts or regains
// focus, so leaving the screen, refreshing or restarting the app cannot bypass the lockout.
export function useCodeLockout(kind: CodeKind, orderId: string) {
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  const lock = useCallback((until: number) => {
    setLockedUntil(until);
    setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
  }, []);

  const clear = useCallback(() => {
    setLockedUntil(null);
    setRemaining(0);
    setAttempts(0);
  }, []);

  // GET lockout status without sending a guess.
  const refresh = useCallback(async () => {
    try {
      const state = await getCodeLockout(kind, orderId);
      setAttempts(state.failedAttempts);
      if (state.isLockedOut && state.remainingLockoutSeconds > 0) {
        lock(Date.now() + state.remainingLockoutSeconds * 1000);
      } else if (state.isLockedOut && state.lockedUntil && new Date(state.lockedUntil).getTime() > Date.now()) {
        lock(new Date(state.lockedUntil).getTime());
      } else {
        setLockedUntil(null);
        setRemaining(0);
      }
    } catch {
      // If the status call fails, the server still enforces the lockout on submit (HTTP 429).
    }
  }, [kind, orderId, lock]);

  // Apply a lockout reported by a failed submit (HTTP 429 `lockout_active`).
  const applyError = useCallback(
    (error: OrderCodeError) => {
      setAttempts(error.failedAttempts ?? CODE_LOCKOUT_MAX_ATTEMPTS);
      if (error.remainingSeconds && error.remainingSeconds > 0) {
        lock(Date.now() + error.remainingSeconds * 1000);
        return;
      }
      const parsed = error.lockedUntil ? new Date(error.lockedUntil).getTime() : NaN;
      lock(Number.isFinite(parsed) && parsed > Date.now() ? parsed : Date.now() + FALLBACK_LOCKOUT_MS);
    },
    [lock],
  );

  // Records a wrong guess; returns attempts left before the lockout.
  const registerIncorrect = useCallback(
    (error: OrderCodeError) => {
      const next = error.failedAttempts ?? attempts + 1;
      setAttempts(next);
      return Math.max(0, CODE_LOCKOUT_MAX_ATTEMPTS - next);
    },
    [attempts],
  );

  useEffect(() => {
    if (lockedUntil === null) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) clear();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil, clear]);

  return {
    locked: lockedUntil !== null && remaining > 0,
    remaining,
    attempts,
    refresh,
    applyError,
    registerIncorrect,
  };
}

export function formatLockoutTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
