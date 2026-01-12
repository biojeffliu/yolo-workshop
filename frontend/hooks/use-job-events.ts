"use client"

import * as React from "react"
import { BACKEND_URL } from "@/lib/api"
import type { FineTuneJob, SSEEvent } from "@/lib/finetune-types"

export type JobEventConnectionStatus = "idle" | "connecting" | "open" | "closed" | "error"

export interface UseJobEventsOptions {
  jobId?: string | null
  eventsUrl?: string | null
  enabled?: boolean
  preserveEvents?: boolean
  onEvent?: (event: SSEEvent) => void
  onError?: (error: Event) => void
}

const normalizeEventsUrl = (eventsUrl: string) => {
  if (eventsUrl.startsWith("http://") || eventsUrl.startsWith("https://")) {
    return eventsUrl
  }

  if (eventsUrl.startsWith("/api/")) {
    return `${BACKEND_URL}${eventsUrl}`
  }

  if (eventsUrl.startsWith("/")) {
    return `${BACKEND_URL}/api${eventsUrl}`
  }

  return `${BACKEND_URL}/api/${eventsUrl.replace(/^\/+/, "")}`
}

const parseEvent = (raw: string): SSEEvent | null => {
  try {
    return JSON.parse(raw) as SSEEvent
  } catch (error) {
    console.error("Failed to parse job event", error)
    return null
  }
}

export function useJobStatus(jobId?: string) {
  const [job, setJob] = React.useState<FineTuneJob | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!jobId) {
      setJob(null)
      return
    }

    let cancelled = false

    const fetchJob = async (): Promise<FineTuneJob> => {
      const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`)
      if (!res.ok) {
        throw new Error("Failed to fetch job")
      }
      return res.json()
    }

    const tick = async () => {
      try {
        const data = await fetchJob()
        if (!cancelled) setJob(data)

        if (["completed", "failed", "cancelled"].includes(data.status)) {
          clearInterval(interval)
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message)
      }
    }

    tick()
    const interval = setInterval(tick, 2000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [jobId])

  return { job, error }
}

export const useJobEvents = ({
  jobId,
  eventsUrl,
  enabled = true,
  preserveEvents = true,
  onEvent,
  onError,
}: UseJobEventsOptions) => {
  const [events, setEvents] = React.useState<SSEEvent[]>([])
  const [latestEvent, setLatestEvent] = React.useState<SSEEvent | null>(null)
  const [status, setStatus] = React.useState<JobEventConnectionStatus>("idle")
  const [error, setError] = React.useState<string | null>(null)

  const reset = React.useCallback(() => {
    setEvents([])
    setLatestEvent(null)
    setError(null)
  }, [])

  React.useEffect(() => {
    reset()
  }, [jobId, eventsUrl, reset])

  React.useEffect(() => {
    if (!enabled) {
      setStatus("idle")
      return
    }

    const resolvedUrl = eventsUrl
      ? normalizeEventsUrl(eventsUrl)
      : jobId
        ? `${BACKEND_URL}/api/jobs/${jobId}/events`
        : null

    if (!resolvedUrl) {
      setStatus("idle")
      return
    }

    setStatus("connecting")
    setError(null)

    const source = new EventSource(resolvedUrl)

    source.onopen = () => {
      setStatus("open")
    }

    source.onmessage = (message) => {
      const parsed = parseEvent(message.data)
      if (!parsed) {
        return
      }

      setLatestEvent(parsed)
      if (preserveEvents) {
        setEvents((prev) => [...prev, parsed])
      } else {
        setEvents([parsed])
      }

      onEvent?.(parsed)
    }

    source.onerror = (evt) => {
      setStatus("error")
      setError("Unable to connect to job events")
      onError?.(evt)
      source.close()
    }

    return () => {
      source.close()
      setStatus("closed")
    }
  }, [enabled, eventsUrl, jobId, onError, onEvent, preserveEvents])

  return {
    events,
    latestEvent,
    status,
    error,
    reset,
  }
}