"use client"

import * as React from "react"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"
import { YOLOModelDetail, YOLOModelMetadata, ModelCheckpoint } from "@/lib/model-types"

export function useFetchModels() {
  const [models, setModels] = React.useState<YOLOModelMetadata[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchModels = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/api/ml_models`)
      if (!res.ok) {
        throw new Error(`Failed to fetch models (${res.status})`)
      }
      const data = await res.json()
      setModels(data.models ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      toast.error("Failed to load models")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return { models, isLoading, error, refetch: fetchModels }
}

export function useFetchModel(modelId?: string) {
  const [model, setModel] = React.useState<YOLOModelDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchModel = React.useCallback(async () => {
    if (!modelId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/api/ml_models/${modelId}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch model (${res.status})`)
      }

      const data = await res.json()
      setModel(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      toast.error("Failed to load model")
    } finally {
      setIsLoading(false)
    }
  }, [modelId])

  React.useEffect(() => {
    fetchModel()
  }, [fetchModel])

  return {
    model,
    isLoading,
    error,
    refetch: fetchModel,
  }
}

export function useFetchCheckpoints(modelId?: string) {
  const [checkpoints, setCheckpoints] = React.useState<ModelCheckpoint[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchCheckpoints = React.useCallback(async () => {
    if (!modelId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/ml_models/${modelId}/checkpoints`
      )
      if (!res.ok) {
        throw new Error(`Failed to fetch checkpoints (${res.status})`)
      }

      const data = await res.json()
      setCheckpoints(data.checkpoints ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error"
      setError(message)
      toast.error("Failed to load checkpoints")
    } finally {
      setIsLoading(false)
    }
  }, [modelId])

  React.useEffect(() => {
    fetchCheckpoints()
  }, [fetchCheckpoints])

  return {
    checkpoints,
    isLoading,
    error,
    refetch: fetchCheckpoints,
  }
}