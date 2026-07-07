import type { RemixiconComponentType } from "@remixicon/react"
import {
  RiBookOpenLine,
  RiCalendarScheduleLine,
  RiFlaskLine,
  RiGroupLine,
  RiHomeLine,
  RiListCheck2,
} from "@remixicon/react"

export type SidebarNavItem = {
  id: string
  label: string
  href: string
  icon: RemixiconComponentType
  badge?: number
  matchPrefix?: boolean
}

export const MAIN_NAV_ITEMS: SidebarNavItem[] = [
  { id: "home", label: "Home", href: "/home", icon: RiHomeLine },
  {
    id: "clients",
    label: "Clients",
    href: "/clients",
    icon: RiGroupLine,
    matchPrefix: true,
  },
  {
    id: "issues",
    label: "Issues",
    href: "/board",
    icon: RiListCheck2,
  },
  {
    id: "schedules",
    label: "Schedules",
    href: "/schedules",
    icon: RiCalendarScheduleLine,
    matchPrefix: true,
  },
  { id: "skills", label: "Skills", href: "/skills", icon: RiBookOpenLine, matchPrefix: true },
  { id: "demo", label: "Demo", href: "/demo", icon: RiFlaskLine },
]

export function isNavItemActive(pathname: string, item: SidebarNavItem): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }
  return pathname === item.href
}

export function getVisibleNavItems(options: {
  isInHouse: boolean
}): SidebarNavItem[] {
  return MAIN_NAV_ITEMS.filter((item) => {
    if (item.id === "clients" && options.isInHouse) return false
    // Demo pages are mock-data walkthroughs — dev/preview only.
    if (item.id === "demo" && process.env.NODE_ENV === "production") return false
    return true
  })
}
