"use client"

import * as React from "react"
import { BACKEND_URL } from "@/lib/api"
import type { SSEEvent } from "@/lib/finetune-types"

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