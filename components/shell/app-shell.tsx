"use client";

import type { CSSProperties, ReactNode } from "react";

import { ActivityBoardProvider } from "@/components/providers/activity-board-provider";
import { ApprovalQueueProvider } from "@/components/providers/approval-queue-provider";
import { ClientProvider } from "@/components/providers/client-provider";
import { NotificationsProvider } from "@/components/providers/notifications-provider";
import { AppRuntime } from "@/components/shell/app-runtime";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { MainContentPanel } from "@/components/shell/main-content-panel";
import { PendingInputBadge } from "@/components/shell/pending-input-badge";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SessionRegistryProvider } from "@/lib/session/session-registry";

const SIDEBAR_WIDTH = "13.75rem";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ClientProvider>
      <NotificationsProvider>
        <ActivityBoardProvider>
          <SessionRegistryProvider>
            <ApprovalQueueProvider>
              <AppRuntime />
              <SidebarProvider
                defaultOpen
                className="h-svh max-h-svh overflow-hidden bg-shell"
                style={{ "--sidebar-width": SIDEBAR_WIDTH } as CSSProperties}
              >
                <AppSidebar />
                <SidebarInset className="min-h-0 flex-1 overflow-hidden bg-shell p-2 pl-1.5">
                  <MainContentPanel>{children}</MainContentPanel>
                </SidebarInset>
                <PendingInputBadge />
              </SidebarProvider>
            </ApprovalQueueProvider>
          </SessionRegistryProvider>
        </ActivityBoardProvider>
      </NotificationsProvider>
    </ClientProvider>
  );
}
