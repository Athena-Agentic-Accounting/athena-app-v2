"use client"

import type { CSSProperties, ReactNode } from "react"

import { ActivityBoardProvider } from "@/components/providers/activity-board-provider"
import { ApprovalQueueProvider } from "@/components/providers/approval-queue-provider"
import { ClientProvider } from "@/components/providers/client-provider"
import { NotificationsProvider } from "@/components/providers/notifications-provider"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { MainContentPanel } from "@/components/shell/main-content-panel"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const SIDEBAR_WIDTH = "13.75rem"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ClientProvider>
      <NotificationsProvider>
        <ActivityBoardProvider>
          <ApprovalQueueProvider>
            <SidebarProvider
              defaultOpen
              className="h-svh max-h-svh overflow-hidden bg-shell"
              style={{ "--sidebar-width": SIDEBAR_WIDTH } as CSSProperties}
            >
              <AppSidebar />
              <SidebarInset className="min-h-0 flex-1 overflow-hidden bg-shell p-2 pl-1.5">
                <MainContentPanel>{children}</MainContentPanel>
              </SidebarInset>
            </SidebarProvider>
          </ApprovalQueueProvider>
        </ActivityBoardProvider>
      </NotificationsProvider>
    </ClientProvider>
  )
}
