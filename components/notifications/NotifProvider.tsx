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

interface NotifContextValue {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const NotifContext = createContext<NotifContextValue>({
  unreadCount: 0,
  refresh: async () => {},
});

/** Okunmamış bildirim sayısını tutar; realtime ile yeni bildirimlerde günceller. */
export function NotifProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;

    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return (
    <NotifContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotif(): NotifContextValue {
  return useContext(NotifContext);
}
