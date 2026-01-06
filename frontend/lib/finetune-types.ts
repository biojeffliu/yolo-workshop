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