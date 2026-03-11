"use client";

import { useEffect, useRef } from "react";
import { getOrCreateSessionId } from "@/lib/tracking/session";
import { useAuth } from "@/lib/auth/context";

export default function PageTracker() {
  const { user } = useAuth();
  const initialized = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Skip admin users
    if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) {
      return;
    }

    const sessionId = getOrCreateSessionId();

    const sendInit = (finalUserId: string | null) => {
      fetch("/api/track/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId: finalUserId }),
      }).catch(console.error);
    };

    // If not yet initialized, start the timer
    if (!initialized.current) {
      initialized.current = true;
      timerRef.current = setTimeout(() => {
        sendInit(user?.id || null);
      }, 30000); // 30 seconds
    }

    // If user becomes available (logged in) before timer fires, cancel and send immediately
    if (user && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
      sendInit(user.id);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user]);

  return null;
}
