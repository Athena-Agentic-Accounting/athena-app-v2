"use client";

import { useEffect } from "react";

import { useSessionRegistry } from "@/lib/session/session-registry";

export function useActivitySessionRegistration(activityId: string) {
  const { clearActivityNeedsInput, detachActivitySession } =
    useSessionRegistry();

  useEffect(() => {
    detachActivitySession(activityId);
    clearActivityNeedsInput(activityId);
  }, [activityId, clearActivityNeedsInput, detachActivitySession]);
}
