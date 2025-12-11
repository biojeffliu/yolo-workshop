"use client"

import * as React from "react"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"

export function useLoadSam2() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [modelState, setModelState] = React.useState<any>(null)

  const loadSam2 = React.useCallback(async (folderName: string) => {
    if (!folderName) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/api/segmentation/load-model`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folder: folderName }),
      })

      if (!res.ok) {
        throw new Error(`Failed to load SAM2 for ${folderName}`)
      }

      const data = await res.json()
      setModelState(data)

      toast.success("SAM2 Model Loaded", {
        description: `Loaded model for ${folderName}. Frames: ${data.frames}`,
      })

      return data
    } catch (err) {
        console.error("SAM2 load error:", err)
        setError("Failed to load SAM2 model")
        toast.error("Failed to Load Model", {
          description: `Could not load SAM2 for ${folderName}`
        })
      } finally {
        setIsLoading(false)
      }
  }, [])

  return { loadSam2, isLoading, error, modelState }
}