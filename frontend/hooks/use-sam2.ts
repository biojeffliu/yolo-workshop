"use client"

import * as React from "react"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"

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

interface ClickMaskResponse {
  frame_index: number
  updated_masks: {
    object_id: number
    mask_png: string
  }[]
}

interface FrameMasksResponse {
  frame_index: number
  masks: {
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

  const sendClick = React.useCallback(async (params: SegmentClickParams): Promise<ClickMaskResponse | null> => {
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
      
      const data: ClickMaskResponse = await res.json()
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

async function decodeMask(maskBase64: string): Promise<ImageBitmap> {
  const blob = await fetch(`data:image/png;base64,${maskBase64}`).then(r => r.blob())
  return await createImageBitmap(blob)
}

export function useFetchFrameMasks() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchFrameMasks = React.useCallback(
    async (
      folder: string,
      frameIdx: number
    ): Promise<Record<number, ImageBitmap> | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `${BACKEND_URL}/api/segmentation/masks?folder=${folder}&frame_idx=${frameIdx}`
        )

        if (!res.ok) {
          throw new Error(`Failed to fetch masks (${res.status})`)
        }

        const data: FrameMasksResponse = await res.json()

        const decoded: Record<number, ImageBitmap> = {}

        for (const m of data.masks) {
          decoded[m.object_id] = await decodeMask(m.mask_png)
        }

        return decoded
      } catch (e) {
        console.error("Mask fetch failed:", e)
        setError("Failed to load masks")
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { fetchFrameMasks, isLoading, error }
}

export function usePropagateMasks() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const propagateMasks = React.useCallback(
    async (
      folder: string,
      totalFrames: number
    ) => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `${BACKEND_URL}/api/segmentation/propagate-masks`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folder,
              total_frames: totalFrames,
            }),
          }
        )
      if (!res.ok) {
        throw new Error(`Propagation failed (${res.status})`)
      }

      const data = await res.json()
      return data
      } catch (e) {
        console.error("Propagation failed:", e)
        setError("Failed to propagate masks")
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )
  return { propagateMasks, isLoading, error }
}