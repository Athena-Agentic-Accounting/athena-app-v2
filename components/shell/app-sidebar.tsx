"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, useClerk, useUser } from "@clerk/nextjs"
import {
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useTenantConfig } from "@/hooks/use-tenant-config"
import {
  formatRelativeTime,
  RECENT_DOT_COLORS,
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
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0 text-muted-foreground"
            aria-label="Account"
          >
            <RiUserLine className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
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

export function AppSidebar() {
  const pathname = usePathname()
  const { allCount } = useActivityBoard()
  const { isInHouse } = useTenantConfig()
  const navItems = getVisibleNavItems({ isInHouse })
  const recentItems = useRecentItems()

  return (
    <Sidebar
      collapsible="icon"
      className="!border-r-0 text-xs [&_[data-slot=sidebar-group-label]]:text-[11px] [&_[data-slot=sidebar-menu-badge]]:text-[10px] [&_[data-slot=sidebar-menu-button]]:text-xs [&_[data-slot=sidebar-menu-button]_svg]:size-3.5"
    >
      <SidebarHeader className="gap-2.5 p-2.5">
        <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center">
          <AthenaLogo />
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
              <SidebarGroupLabel>Recent</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {recentItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild className="h-auto py-1.5">
                        <Link href={item.href}>
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              RECENT_DOT_COLORS[item.kind] ?? "bg-muted-foreground",
                            )}
                          />
                          <span className="flex-1 truncate text-xs">{item.label}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(item.visitedAt)}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="p-2.5">
        <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:flex-col">
          <UserMenu />
          <Button asChild className="h-8 flex-1 justify-center text-xs shadow-none">
            <Link href="/home">
              <RiSparklingLine className="size-3.5" data-icon="inline-start" />
              New chat
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
