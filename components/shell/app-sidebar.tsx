"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, useClerk, useUser } from "@clerk/nextjs"
import {
  RiArrowDownSLine,
  RiLogoutBoxRLine,
  RiPlugLine,
  RiSparklingLine,
  RiUserAddLine,
  RiUserLine,
} from "@remixicon/react"

import { InviteMembersDialog } from "@/components/settings/invite-members-dialog"
import { ClientSelector } from "@/components/shell/client-selector"
import { useActivityBoard } from "@/components/providers/activity-board-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTenantConfig } from "@/hooks/use-tenant-config"
import {
  formatRelativeTime,
  RECENT_KIND_LABELS,
  useRecentItems,
} from "@/lib/navigation/recents"
import { getVisibleNavItems, isNavItemActive } from "@/lib/navigation/sidebar-nav"
import { cn } from "@/lib/utils"

function AthenaLogo() {
  return (
    <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <span className="block size-3 rounded-br-[0.7rem] rounded-tl-[0.7rem] bg-primary-foreground" />
    </div>
  )
}

function UserMenu() {
  const { user } = useUser()
  const { orgRole } = useAuth()
  const { signOut } = useClerk()
  const [inviteOpen, setInviteOpen] = useState(false)

  const email = user?.primaryEmailAddress?.emailAddress
  const isAdmin = orgRole === "org:admin" || orgRole === "admin"

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 shrink-0 text-muted-foreground group-data-[collapsible=icon]:size-8"
                aria-label="Account"
              >
                <RiUserLine className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            className="hidden group-data-[collapsible=icon]:block"
          >
            Account
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="top" align="start" className="w-56">
          {email ? (
            <>
              <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {isAdmin ? (
            <DropdownMenuItem onSelect={() => setInviteOpen(true)}>
              <RiUserAddLine className="size-3.5" />
              Invite teammates
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href="/settings/connections">
              <RiPlugLine className="size-3.5" />
              Connections
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void signOut({ redirectUrl: "/auth" })}>
            <RiLogoutBoxRLine className="size-3.5" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteMembersDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  )
}

function formatRecentLabel(label: string): string {
  const trimmed = label.trim()
  if (/prepaid.*amortization/i.test(trimmed) || /july 31.*month-end/i.test(trimmed)) {
    return "July 31 Month-End Adjustments"
  }
  if (/reconciliation/i.test(trimmed)) {
    return "Bank Reconciliation"
  }
  if (/payroll/i.test(trimmed)) {
    return "Payroll Clearance & Taxes"
  }
  if (trimmed.length > 34) {
    return trimmed.slice(0, 34).trim() + "…"
  }
  return trimmed
}

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { allCount } = useActivityBoard()
  const { isInHouse } = useTenantConfig()
  const navItems = getVisibleNavItems({ isInHouse })
  const recentItems = useRecentItems()
  const [recentOpen, setRecentOpen] = useState(true)

  return (
    <Sidebar
      collapsible="icon"
      className="!border-r-0 text-xs [&_[data-slot=sidebar-group-label]]:text-[11px] [&_[data-slot=sidebar-menu-badge]]:text-[10px] [&_[data-slot=sidebar-menu-button]]:text-xs [&_[data-slot=sidebar-menu-button]_svg]:size-3.5"
    >
      <SidebarHeader className="gap-2.5 p-2.5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center justify-between px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={isCollapsed ? toggleSidebar : undefined}
                className={cn(
                  "rounded-lg outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring/50",
                  isCollapsed && "cursor-pointer hover:scale-105 active:scale-95",
                )}
                aria-label={isCollapsed ? "Toggle Sidebar (Ctrl+B)" : "Athena"}
              >
                <AthenaLogo />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              className="hidden items-center gap-2 px-2.5 py-1 text-xs group-data-[collapsible=icon]:flex"
            >
              <span>Toggle Sidebar</span>
              <span className="text-[11px] text-background/60 font-mono">Ctrl+B</span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger
                className="size-6 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
                aria-label="Toggle Sidebar (Ctrl+B)"
              />
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              className="flex items-center gap-2 px-2.5 py-1 text-xs"
            >
              <span>Toggle Sidebar</span>
              <span className="text-[11px] text-background/60 font-mono">Ctrl+B</span>
            </TooltipContent>
          </Tooltip>
        </div>
        <ClientSelector />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isNavItemActive(pathname, item)
                const Icon = item.icon
                const badge =
                  item.id === "issues" && allCount > 0 ? allCount : item.badge

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="h-7"
                    >
                      <Link href={item.href}>
                        <Icon className="size-3.5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge ? (
                      <SidebarMenuBadge className="rounded-full bg-primary px-1.5 text-[10px] font-normal text-white peer-hover/menu-button:text-white peer-data-active/menu-button:text-white">
                        {badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {recentItems.length > 0 ? (
          <>
            <SidebarSeparator className="mx-2.5" />

            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <div className="flex items-center justify-between px-2 py-1">
                <SidebarGroupLabel className="p-0 text-[11px] font-medium text-muted-foreground">
                  Recent
                </SidebarGroupLabel>
                <button
                  type="button"
                  onClick={() => setRecentOpen((prev) => !prev)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label={recentOpen ? "Collapse recents" : "Expand recents"}
                >
                  <RiArrowDownSLine
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      !recentOpen && "-rotate-90",
                    )}
                  />
                </button>
              </div>

              {recentOpen ? (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild className="h-auto py-1.5">
                          <Link href={item.href} title={`${RECENT_KIND_LABELS[item.kind]} · ${item.label}`}>
                            <span className="flex-1 truncate text-xs">{formatRecentLabel(item.label)}</span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatRelativeTime(item.visitedAt)}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              ) : null}
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="p-2.5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-center">
          <UserMenu />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                className="h-8 flex-1 justify-center text-xs shadow-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:p-0"
              >
                <Link href="/home" aria-label="New chat">
                  <RiSparklingLine className="size-3.5 group-data-[collapsible=icon]:size-4" data-icon="inline-start" />
                  <span className="group-data-[collapsible=icon]:hidden">New chat</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              className="hidden group-data-[collapsible=icon]:block"
            >
              New chat
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
