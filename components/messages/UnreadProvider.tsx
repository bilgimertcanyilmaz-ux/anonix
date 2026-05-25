"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

interface UnreadContextValue {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const UnreadContext = createContext<UnreadContextValue>({
  unreadCount: 0,
  refresh: async () => {},
});

/** Okunmamış mesaj sayısını tutar; realtime ile yeni mesajlarda günceller. */
export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, [user]);

  useEffect(() => {
    refresh();

    if (!user) return;

    // Bana gelen yeni mesajlarda sayacı tazele
    const channel = supabase
      .channel(`unread:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return (
    <UnreadContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread(): UnreadContextValue {
  return useContext(UnreadContext);
}
