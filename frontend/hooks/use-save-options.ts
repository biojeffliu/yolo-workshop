"use client"

import * as React from "react"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"

interface StartExportArgs {
  folder: string
  minArea?: number
  simplify?: boolean
}

type ExportStatus = "idle" | "running" | "success" | "error"

export function useSaveSegmentationsYOLO() {
  const [status, setStatus] = React.useState<ExportStatus>("idle")
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)

  const pollRef = React.useRef<number | null>(null)

  const reset = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
    setStatus("idle")
    setProgress(0)
    setError(null)
  }

  const startExport = React.useCallback(async (args: StartExportArgs) => {
    setStatus("running")
    setProgress(0)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/api/save/segmentations-yolo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: args.folder,
          min_area: args.minArea ?? 100,
          simplify: args.simplify ?? true,
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      const { job_id } = await res.json()

      pollRef.current = window.setInterval(async () => {
        try {
          const p = await fetch(
            `${BACKEND_URL}/api/save/segmentations-yolo/progress?job_id=${job_id}`
          )
          if (!p.ok) return

          const data = await p.json()
          setProgress(Math.round(data.progress * 100))

          if (data.status === "completed") {
            reset()
            setProgress(100)
            setStatus("success")
          }

          if (data.status === "error") {
            throw new Error(data.error ?? "Export failed")
          }
        } catch (err: any) {
          reset()
          setStatus("error")
          setError(err.message)
        }
      }, 500)
    } catch (err: any) {
      setStatus("error")
      setError(err.message)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
      }
    }
  }, [])

  return {
    startExport,
    progress,
    status,
    error,
    reset,
  }
}