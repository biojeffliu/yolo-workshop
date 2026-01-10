"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wifi, WifiOff, XCircle, ArrowDown } from "lucide-react"
import { JobStatusBadge } from "@/components/finetune/job-status-badge"
import type { FineTuneJob, TrainingMetrics, SSEEvent } from "@/lib/finetune-types"
import { useJobEvents } from "@/hooks/use-job-events"

interface StageProgressProps {
  job: FineTuneJob
  eventsUrl?: string | null
  onCancel: () => void
}

const getEventColor = (type: SSEEvent["event"]) => {
  switch (type) {
    case "starting":
      return "text-blue-500"
    case "completed":
      return "text-green-500"
    case "failed":
      return "text-destructive"
    case "cancelled":
      return "text-yellow-500"
    default:
      return "text-foreground"
  }
}

const isEpochEvent = (
  event: SSEEvent
): event is Extract<SSEEvent, { event: "epoch_end" }> => event.event === "epoch_end"

const getTrainingConfig = (job: FineTuneJob) => {
  if (!job.params || typeof job.params !== "object") {
    return null
  }

  const params = job.params as {
    training_config?: {
      epochs?: number
      num_train_loops?: number
    }
  }

  return params.training_config ?? null
}

export function StageProgress({
  job,
  eventsUrl,
  onCancel,
}: StageProgressProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = React.useState(true)

  const { events, status } = useJobEvents({
    jobId: job.id,
    eventsUrl,
    enabled: Boolean(job.id)
  })

  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events, autoScroll])

  const epochEvents = React.useMemo(
    () => events.filter(isEpochEvent),
    [events]
  )

  const latestEpoch = epochEvents.length > 0
    ? epochEvents[epochEvents.length - 1]
    : null
  const trainingConfig = React.useMemo(() => getTrainingConfig(job), [job])
  const totalEpochs = trainingConfig?.epochs ?? 0
  const currentEpoch = latestEpoch?.data.epoch ?? 0
  const epochProgress = totalEpochs > 0 ? (currentEpoch / totalEpochs) * 100 : 0
  const latestMetrics = latestEpoch?.data.metrics ?? null
  const metricsRows = epochEvents.map((event) => ({
    epoch: event.data.epoch,
    metrics: event.data.metrics,
  }))

  const isConnected = status === "open"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Training Progress</CardTitle>
              <CardDescription>Job ID: {job.id}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "outline" : "destructive"} className="gap-1">
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? "Live" : "Disconnected"}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                <JobStatusBadge status={job.status} />
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Epoch {currentEpoch} / {totalEpochs || "?"}
              </span>
              <span className="font-medium">{Math.round(epochProgress)}%</span>
            </div>
            <Progress value={epochProgress} className="h-3" />
          </div>

          {job.status === "running" && (
            <Button variant="destructive" onClick={onCancel} className="w-full">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Training
            </Button>
          )}

          {job.status === "failed" && job.error && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="mt-1 text-sm text-destructive/80">{job.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {latestMetrics && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(latestMetrics).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-xs uppercase text-muted-foreground">{key}</p>
                  <p className="text-xl font-semibold">{value.toFixed(4)}</p>
                </div>
              ))}
            </div>

            {metricsRows.length > 1 && (
              <ScrollArea className="h-[150px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Epoch</TableHead>
                      {latestMetrics
                        ? Object.keys(latestMetrics).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))
                        : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...metricsRows]
                      .reverse()
                      .slice(0, 10)
                      .map((row) => (
                        <TableRow key={row.epoch}>
                          <TableCell className="font-medium">{row.epoch}</TableCell>
                          {latestMetrics
                            ? Object.keys(latestMetrics).map((key) => (
                                <TableCell key={key}>
                                  {(row.metrics[key] ?? 0).toFixed(4)}
                                </TableCell>
                              ))
                            : null}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Event Logs</CardTitle>
            <Button size="sm" variant={autoScroll ? "default" : "outline"} onClick={() => setAutoScroll(!autoScroll)}>
              <ArrowDown className="mr-1 h-4 w-4" />
              Auto-scroll
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea ref={scrollRef} className="h-[200px] rounded-md border bg-muted/30 p-4">
            {events.length > 0 ? (
              <div className="space-y-1 font-mono text-xs">
                {events.map((event, i) => (
                  <div key={`${event.timestamp}-${i}`} className="flex gap-2">
                    <span className="shrink-0 text-muted-foreground">
                      [{new Date(event.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`shrink-0 font-semibold uppercase ${getEventColor(event.event)}`}>
                      {event.event}
                    </span>
                    <span className="text-foreground">
                      {event.data && typeof event.data === "object"
                        ? JSON.stringify(event.data)
                        : String(event.data ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Waiting for events...
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}