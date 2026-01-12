export type JobStatus = "queued" | "running" | "cancelled" | "completed" | "failed"

export type ModelSize = "n" | "s" | "m" | "l" | "x"

export interface AugmentationConfig {
  hsv_h: number
  hsv_s: number
  hsv_v: number
  degrees: number
  translate: number
  scale: number
  shear: number
  perspective: number
  flipud: number
  fliplr: number
  mosaic: number
  mixup: number
  copy_paste: number
  erasing: number
  crop_fraction: number
}

export interface DatasetConfig {
  train_percentage: number
  keep_empty_frames: boolean
  empty_frame_keep_ratio: number
  dataset_weights: Record<string, number>
}

export interface TuningConfig {
  enable_tuning: boolean
  use_ray_tune: boolean
  iterations: number
}

export interface ExportConfig {
  export_onnx: boolean
  onnx_batch_size: number
  export_tensorrt: boolean
}

export interface FineTuneConfig {
  // Core config
  base_model: string
  checkpoint: string
  resume: boolean
  resume_checkpoint?: string
  model_size: ModelSize
  datasets: string[]

  // Training settings
  epochs: number
  save_period: number
  num_train_loops: number
  img_size: number
  layer_freeze: number
  batch_size: number
  learning_rate: number
  patience: number

  // Advanced configs
  augmentation: AugmentationConfig
  dataset_config: DatasetConfig
  tuning: TuningConfig
  export: ExportConfig

  // Output
  data_dest_dir: string
}


export const defaultAugmentationConfig: AugmentationConfig = {
  hsv_h: 0.015,
  hsv_s: 0.7,
  hsv_v: 0.4,
  degrees: 0.0,
  translate: 0.1,
  scale: 0.5,
  shear: 0.0,
  perspective: 0.0,
  flipud: 0.0,
  fliplr: 0.5,
  mosaic: 1.0,
  mixup: 0.0,
  copy_paste: 0.0,
  erasing: 0.4,
  crop_fraction: 1.0,
}

export const defaultDatasetConfig: DatasetConfig = {
  train_percentage: 0.8,
  keep_empty_frames: false,
  empty_frame_keep_ratio: 0.1,
  dataset_weights: {},
}

export const defaultTuningConfig: TuningConfig = {
  enable_tuning: false,
  use_ray_tune: false,
  iterations: 10,
}

export const defaultExportConfig: ExportConfig = {
  export_onnx: false,
  onnx_batch_size: 1,
  export_tensorrt: false,
}

export interface FineTuneJob {
  id: string
  status: JobStatus
  base_model_id: string
  checkpoint: string
  dataset_ids: string[]
  params: Record<string, unknown>
  created_at: string
  updated_at: string
  started_at?: string | null
  finished_at?: string | null
  error?: string | null
}

export type TrainingMetrics = Record<string, number>

export interface DatasetReportSummary {
  datasets_selected: number
  datasets_valid: number
  datasets_invalid: number
  total_samples: number
  used_samples: number
  skipped_samples: number
}

export interface DatasetReportEntry {
  dataset_id: string
  status: "valid" | "invalid"
  total_samples: number
  used_samples: number
  skipped_samples: number
  issues: Record<string, number>
}

export interface DatasetReport {
  datasets: DatasetReportEntry[]
  summary: DatasetReportSummary
  warnings: string[]
}

export type FineTuneEventType =
  | "starting"
  | "model_loaded"
  | "dataset_ready"
  | "epoch_end"
  | "completed"
  | "failed"
  | "cancelled"

export type SSEEvent =
  | {
      job_id: string
      event: "starting" | "completed" | "cancelled"
      timestamp: string
      data: Record<string, never>
    }
  | {
      job_id: string
      event: "model_loaded"
      timestamp: string
      data: {
        base_model_id: string
        checkpoint: string
      }
    }
  | {
      job_id: string
      event: "dataset_ready"
      timestamp: string
      data: DatasetReport
    }
  | {
      job_id: string
      event: "epoch_end"
      timestamp: string
      data: {
        epoch: number
        metrics: TrainingMetrics
      }
    }
  | {
      job_id: string
      event: "failed"
      timestamp: string
      data: {
        error: string
      }
    }
  | {
      job_id: string
      event: FineTuneEventType | string
      timestamp: string
      data: unknown
    }

export interface FineTuneRequest {
  base_model_id: string
  checkpoint: string
  resume: boolean
  resume_checkpoint?: string
  model_size: ModelSize
  dataset_ids: string[]

  epochs: number
  save_period: number
  num_train_loops: number
  img_size: number
  layer_freeze: number
  batch_size: number
  learning_rate: number
  patience: number

  augmentation: AugmentationConfig
  dataset_config: DatasetConfig
  tuning: TuningConfig
  export: ExportConfig

  data_dest_dir: string
}

export interface FineTuneResponse {
  job_id: string
  status: "queued"
  events_url: string
}