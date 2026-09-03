import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../supabase';
import { useAuth, UserSlot } from './AuthContext';

interface PersonPresence {
  online: boolean;
  typing: boolean;
  lastSeenAt: string | null;
}

interface PresenceContextType {
  presence: Record<UserSlot, PersonPresence>;
  setTyping: (typing: boolean) => void;
}

const LAST_SEEN_KEY = 'presence_last_seen_v1';

function loadLastSeen(): Partial<Record<UserSlot, string>> {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function emptyPresence(lastSeen: Partial<Record<UserSlot, string>>): Record<UserSlot, PersonPresence> {
  return {
    user1: { online: false, typing: false, lastSeenAt: lastSeen.user1 ?? null },
    user2: { online: false, typing: false, lastSeenAt: lastSeen.user2 ?? null },
  };
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { session, currentUser } = useAuth();
  const [presence, setPresence] = useState<Record<UserSlot, PersonPresence>>(() => emptyPresence(loadLastSeen()));
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSeenRef = useRef<Partial<Record<UserSlot, string>>>(loadLastSeen());

  useEffect(() => {
    if (!session?.user || !currentUser) {
      channelRef.current = null;
      return;
    }

    const channel = supabase.channel('presence-couple', {
      config: { presence: { key: currentUser } },
    });
    channelRef.current = channel;

    const applySync = () => {
      const state = channel.presenceState<{ typing?: boolean }>();
      setPresence((prev) => {
        const next = { ...prev };
        (['user1', 'user2'] as UserSlot[]).forEach((slot) => {
          const entries = state[slot];
          if (entries && entries.length > 0) {
            next[slot] = {
              online: true,
              typing: entries.some((entry) => Boolean(entry.typing)),
              lastSeenAt: next[slot].lastSeenAt,
            };
          } else if (next[slot].online) {
            // Só cai pra offline aqui se não veio pelo evento "leave" (que já grava o lastSeenAt).
            next[slot] = { online: false, typing: false, lastSeenAt: next[slot].lastSeenAt };
          }
        });
        return next;
      });
    };

    channel
      .on('presence', { event: 'sync' }, applySync)
      .on('presence', { event: 'join' }, applySync)
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        const slot = key as UserSlot;
        if (slot !== 'user1' && slot !== 'user2') return;

        const now = new Date().toISOString();
        lastSeenRef.current = { ...lastSeenRef.current, [slot]: now };
        try {
          localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(lastSeenRef.current));
        } catch {}

        setPresence((prev) => ({
          ...prev,
          [slot]: { online: false, typing: false, lastSeenAt: now },
        }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ slot: currentUser, typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [session?.user?.id, currentUser]);

  const setTyping = useCallback((typing: boolean) => {
    if (!currentUser) return;
    channelRef.current?.track({ slot: currentUser, typing });
  }, [currentUser]);

  return (
    <PresenceContext.Provider value={{ presence, setTyping }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider');
  return ctx;
}
