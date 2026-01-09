"use client"

import * as React from "react"
import { BACKEND_URL } from "@/lib/api"
import { SegmentationsYOLOMetadata } from "@/lib/dataset-types"

export function useSegmentationDatasets() {
  const [datasets, setDatasets] = React.useState<SegmentationsYOLOMetadata[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDatasets = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/api/datasets`)
      if (!res.ok) {
        throw new Error(`Failed to fetch datasets (${res.status})`)
      }

      const data = await res.json()

      if (!Array.isArray(data.datasets)) {
        throw new Error("Malformed datasets response")
      }
      setDatasets(data.datasets)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Unknown error")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  return {
    datasets,
    isLoading,
    error,
    refetch: fetchDatasets,
  }
}