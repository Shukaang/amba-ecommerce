"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const TRACK_DELAY = 60000; // 3 seconds

export default function PageTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip tracking for admins
    if (user?.role === "SUPERADMIN" || user?.role === "ADMIN") return;

    if (typeof window === "undefined") return;

    const trackVisit = async () => {
      const lastTrackTime = localStorage.getItem("last_track_time");
      const now = Date.now();
      let sessionId = localStorage.getItem("visitor_session_id");

      if (
        !sessionId ||
        !lastTrackTime ||
        now - parseInt(lastTrackTime) > SESSION_TIMEOUT
      ) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("visitor_session_id", sessionId);
      }

      localStorage.setItem("last_track_time", now.toString());

      try {
        await fetch("/api/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userId: user?.id || null,
          }),
        });
      } catch (error) {
        // Silent fail
      }
    };

    // Clear previous timeout and set new one
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(trackVisit, TRACK_DELAY);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname, user]);

  return null;
}
