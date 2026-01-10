"use client"

import * as React from "react"
import type { FineTuneConfig, FineTuneJob, JobStatus } from "@/lib/finetune-types"
import { BACKEND_URL } from "@/lib/api"

interface FineTuneResponse {
  job_id: string
  status: JobStatus
  events_url: string
}

const buildFineTunePayload = (config: FineTuneConfig) => {
  return {
    base_model_id: config.base_model,
    checkpoint: config.resume ? config.resume_checkpoint ?? "best" : config.checkpoint || "best",
    dataset_ids: config.datasets,
    training_config: {
      epochs: config.epochs,
      num_train_loops: config.num_train_loops,
      img_size: config.img_size,
      layer_freeze: config.layer_freeze,
      batch_size: config.batch_size,
      learning_rate: config.learning_rate,
      patience: config.patience,
      dataset: {
        train_percentage: config.dataset_config.train_percentage,
        keep_empty_frames: config.dataset_config.keep_empty_frames,
        empty_frame_keep_ratio: config.dataset_config.empty_frame_keep_ratio,
        dataset_weights: config.dataset_config.dataset_weights,
      },
      augmentations: config.augmentation,
      model_init: {
        resume: config.resume,
        resume_checkpoint: config.resume_checkpoint ?? null,
        model_size: config.model_size,
      },
      tuning: {
        enabled: config.tuning.enable_tuning,
        use_ray: config.tuning.use_ray_tune,
        iterations: config.tuning.iterations,
      },
      export: {
        export_onnx: config.export.export_onnx,
        onnx_batch_size: config.export.onnx_batch_size,
      },
    },
  }
}

export function useFineTuneJob() {
  const [job, setJob] = React.useState<FineTuneJob | null>(null)
  const [eventsUrl, setEventsUrl] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const reset = React.useCallback(() => {
    setJob(null)
    setEventsUrl(null)
    setError(null)
  }, [])

  const startFineTune = React.useCallback(async (config: FineTuneConfig) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/api/finetune`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildFineTunePayload(config))
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        const message = payload?.detail || "Failed to start fine-tune job"
        throw new Error(message)
      }

      const data = (await res.json()) as FineTuneResponse
      const jobRes = await fetch(`${BACKEND_URL}/api/jobs/${data.job_id}`)

      if (!jobRes.ok) {
        throw new Error("Failed to load job details")
      }

      const jobData = (await jobRes.json()) as FineTuneJob
      setJob(jobData)
      setEventsUrl(data.events_url)
      return jobData
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start fine-tune job"
      setError(message)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    job,
    eventsUrl,
    isSubmitting,
    error,
    startFineTune,
    reset,
  }
}