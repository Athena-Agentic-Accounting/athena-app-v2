"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiHistoryLine, RiSparklingLine } from "@remixicon/react"

import { ClientSelector } from "@/components/shell/client-selector"
import { useActivityBoard } from "@/components/providers/activity-board-provider"
import { Button } from "@/components/ui/button"
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
  getVisibleNavItems,
  isNavItemActive,
  RECENT_NAV_ITEMS,
} from "@/lib/navigation/sidebar-nav"
import { cn } from "@/lib/utils"

function AthenaLogo() {
  return (
    <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <span className="block size-3 rounded-br-[0.7rem] rounded-tl-[0.7rem] bg-primary-foreground" />
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { allCount } = useActivityBoard()
  const { isInHouse } = useTenantConfig()
  const navItems = getVisibleNavItems({ isInHouse })

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

        <SidebarSeparator className="mx-2.5" />

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {RECENT_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild className="h-auto py-1.5">
                    <Link href={item.href}>
                      <span
                        className={cn("size-1.5 shrink-0 rounded-full", item.dotColor)}
                      />
                      <span className="flex-1 truncate text-xs">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {item.timeAgo}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2.5">
        <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:flex-col">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0 text-muted-foreground"
            aria-label="Chat history"
          >
            <RiHistoryLine className="size-3.5" />
          </Button>
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
