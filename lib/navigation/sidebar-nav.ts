import type { RemixiconComponentType } from "@remixicon/react"
import {
  RiBankCardLine,
  RiBarChartLine,
  RiBookOpenLine,
  RiBuildingLine,
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
    id: "financial-reports",
    label: "Financial reports",
    href: "/financial-reports",
    icon: RiBarChartLine,
  },
  {
    id: "bank-transactions",
    label: "Bank transactions",
    href: "/bank-transactions",
    icon: RiBankCardLine,
  },
  { id: "knowledge", label: "Knowledge", href: "/knowledge", icon: RiBookOpenLine },
  { id: "company", label: "Company", href: "/company", icon: RiBuildingLine },
  { id: "demo", label: "Demo", href: "/demo", icon: RiFlaskLine },
]

export type RecentNavItem = {
  id: string
  label: string
  href: string
  dotColor: string
  timeAgo: string
}

export const RECENT_NAV_ITEMS: RecentNavItem[] = [
  {
    id: "unearned-deferred",
    label: "Unearned/Deferred Reve...",
    href: "/knowledge/unearned-deferred",
    dotColor: "bg-violet-500",
    timeAgo: "1h",
  },
  {
    id: "fixed-asset",
    label: "Fixed Asset Management",
    href: "/knowledge/fixed-asset",
    dotColor: "bg-blue-500",
    timeAgo: "2h",
  },
  {
    id: "book-payroll",
    label: "Book payroll entries",
    href: "/knowledge/book-payroll",
    dotColor: "bg-violet-500",
    timeAgo: "2h",
  },
]

export function isNavItemActive(pathname: string, item: SidebarNavItem): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }
  return pathname === item.href
}
