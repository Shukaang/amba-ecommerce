"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function PageTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    // Skip tracking if SUPERADMIN
    if (user?.role === "SUPERADMIN") return;

    if (typeof window === "undefined") return;

    const trackVisit = async () => {
      // Check if session expired
      const lastTrackTime = localStorage.getItem("last_track_time");
      const now = Date.now();
      let sessionId = localStorage.getItem("visitor_session_id");

      // If no session or session expired (>30 min), create new session
      if (
        !sessionId ||
        !lastTrackTime ||
        now - parseInt(lastTrackTime) > SESSION_TIMEOUT
      ) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("visitor_session_id", sessionId);
      }

      // Update last track time
      localStorage.setItem("last_track_time", now.toString());

      try {
        await fetch("/api/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
          }),
        });
      } catch (error) {
        // Silent fail
      }
    };

    trackVisit();
  }, [pathname, user]); // Add user to dependencies

  return null;
}
