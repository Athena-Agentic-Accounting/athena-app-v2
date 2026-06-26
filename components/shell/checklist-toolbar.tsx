"use client"

import {
  ArrowUpDownIcon,
  FilterIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ChecklistToolbarProps = {
  assignedCount?: number
  allCount?: number
}

export function ChecklistToolbar({
  assignedCount = 5,
  allCount = 14,
}: ChecklistToolbarProps) {
  return (
    <div className="flex flex-col gap-3 px-5 pt-3.5 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs defaultValue="assigned">
        <TabsList className="h-8 gap-0.5 rounded-lg bg-muted/50 p-0.5">
          <TabsTrigger
            value="assigned"
            className="h-7 rounded-md px-3 text-[13px] data-active:bg-background data-active:shadow-xs"
          >
            Assigned to you ({assignedCount})
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="h-7 rounded-md px-3 text-[13px] data-active:bg-background data-active:shadow-xs"
          >
            All tasks ({allCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative min-w-[180px] flex-1 sm:max-w-[220px]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks"
            className="h-8 border-border/80 bg-background pl-8 text-[13px] shadow-none"
          />
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          className="size-8 border-border/80 shadow-none"
          aria-label="Filter tasks"
        >
          <FilterIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          className="size-8 border-border/80 shadow-none"
          aria-label="Sort tasks"
        >
          <ArrowUpDownIcon />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 border-border/80 text-[13px] shadow-none sm:inline-flex"
        >
          Status
        </Button>
        <div className="flex items-center overflow-hidden rounded-md border border-border/80 bg-background">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 rounded-none shadow-none"
            aria-label="Board view"
          >
            <LayoutGridIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 rounded-none border-l border-border/80 shadow-none"
            aria-label="List view"
          >
            <ListIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
