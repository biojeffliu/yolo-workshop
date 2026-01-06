export interface YOLOModelMetadata {
  id: string
  name: string
  task: "segment" | "detect" | "classify"
  family: string
  size?: string
  params_m: number
  stride: number
  source: "ultralytics" | "finetuned"
  pretrained: boolean
  fine_tunable: boolean
  best_checkpoint_id: string
  num_checkpoints: number
}

export interface YOLOModelDetail {
  id: string
  name: string
  task: string
  family: string
  size: string | null
  params_m: number
  stride: number
  source: string
  pretrained: boolean
  fine_tunable: boolean
  datasets?: string[]
  created_at?: string
}

export interface ModelCheckpoint {
  id: string
  label: string
  epoch?: number
  recommended?: boolean
}