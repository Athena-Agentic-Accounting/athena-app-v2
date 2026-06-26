"use client"

import Link from "next/link"
import { useState } from "react"
import { RiFlaskLine } from "@remixicon/react"

import { CardRenderer } from "@/components/genui/card-renderer"
import { CardSkeleton } from "@/components/genui/card-skeleton"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DEMO_DECIDED_APPROVAL,
  DEMO_STREAM_EVENTS,
} from "@/lib/genui/mock-stream-events"
import type { ApprovalDecisionRecord } from "@/lib/genui/types"

export function DemoView() {
  const [decidedMap, setDecidedMap] = useState<Record<string, ApprovalDecisionRecord>>({
    "demo-gate-decided": {
      decision: "approve",
      decidedBy: "J. Smith",
      decidedAt: "9:27 AM",
    },
  })
  const [questionChoice, setQuestionChoice] = useState<{
    selectedOptionId?: string
    stepIndex: number
  }>({
    selectedOptionId: "upload-now",
    stepIndex: 1,
  })

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title="Demo"
        description="Preview GenUI cards with mock activity stream data"
        icon={RiFlaskLine}
        showSearch={false}
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background p-5">
        <div className="mx-auto mb-4 flex w-full max-w-3xl items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Card previews and the split session workspace used during live activity runs.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/demo/session">Session workspace</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/demo/session/plan">Plan review</Link>
          </Button>
        </div>

        <Tabs defaultValue="stream" className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <TabsList className="h-9 w-fit">
            <TabsTrigger value="stream">Activity stream</TabsTrigger>
            <TabsTrigger value="states">States</TabsTrigger>
            <TabsTrigger value="skeletons">Skeletons</TabsTrigger>
          </TabsList>

          <TabsContent value="stream" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mock cards for screens that do not have live backend data yet. Uses the shared{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">CardRenderer</code> only.
            </p>
            {DEMO_STREAM_EVENTS.map((event) => (
              <CardRenderer
                key={event.id}
                event={
                  event.event.type === "question_choice"
                    ? {
                        ...event,
                        event: {
                          ...event.event,
                          data: {
                            ...event.event.data,
                            selectedOptionId: questionChoice.selectedOptionId,
                            stepIndex: questionChoice.stepIndex,
                          },
                        },
                      }
                    : event
                }
                options={{
                  activityId: event.activityId,
                  isLive: event.event.type === "progress" && event.id === "evt-1",
                  canDecide: true,
                  decision:
                    event.event.type === "approval_gate" && event.event.data.gateId
                      ? decidedMap[event.event.data.gateId]
                      : undefined,
                  onDecision: async (gateId, payload) => {
                    setDecidedMap((current) => ({
                      ...current,
                      [gateId]: {
                        decision: payload.decision,
                        decidedBy: "You",
                        decidedAt: new Date().toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        }),
                        notes: payload.notes,
                      },
                    }))
                  },
                  questionChoice:
                    event.event.type === "question_choice"
                      ? {
                          selectedOptionId: questionChoice.selectedOptionId,
                          onSelect: (optionId) =>
                            setQuestionChoice((current) => ({
                              ...current,
                              selectedOptionId: optionId,
                            })),
                          onSkip: () =>
                            setQuestionChoice((current) => ({
                              ...current,
                              selectedOptionId: undefined,
                            })),
                          onStepChange: (direction) =>
                            setQuestionChoice((current) => ({
                              ...current,
                              stepIndex:
                                direction === "prev"
                                  ? Math.max(1, current.stepIndex - 1)
                                  : Math.min(2, current.stepIndex + 1),
                            })),
                        }
                      : undefined,
                }}
              />
            ))}
          </TabsContent>

          <TabsContent value="states" className="space-y-4">
            <CardRenderer
              event={DEMO_DECIDED_APPROVAL}
              options={{
                decision: decidedMap["demo-gate-decided"],
              }}
            />
            <CardRenderer
              event={DEMO_STREAM_EVENTS.find((event) => event.id === "evt-10")!}
              options={{ canDecide: false }}
            />
          </TabsContent>

          <TabsContent value="skeletons" className="grid gap-4">
            <CardSkeleton />
            <CardSkeleton variant="table" />
            <CardSkeleton variant="chart" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
