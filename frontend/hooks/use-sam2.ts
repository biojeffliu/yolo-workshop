"use client"

import * as React from "react"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"
import { Parkinsans } from "next/font/google"

interface SegmentClickParams {
  folder: string
  frameIndex: number
  x: number
  y: number
  isPositive: boolean
  objectId: number
}

interface MaskUpdate {
  objectId: number
  maskPng: string
}

interface SegmentationResponse {
  frame_index: number
  updated_masks: {
    object_id: number
    mask_png: string
  }[]
}

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

export function useSegmentationClick() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const sendClick = React.useCallback(async (params: SegmentClickParams): Promise<SegmentationResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/api/segmentation/click`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          frame_index: params.frameIndex,
          folder: params.folder,
          x: params.x,
          y: params.y,
          is_positive: params.isPositive,
          object_id: params.objectId
        }),
      })

      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      
      const data: SegmentationResponse = await res.json()
      return data
    } catch (err) {
      console.error("Segmentation click failed:", err)
      setError("Segmentation failed")
      toast.error("Segmentation failed", { description: `${err}` })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])
  return { sendClick, isLoading, error }
}