export interface YOLOObjectStats {
  object_id: string
  class_id: number | null
  class_name: string | null
  labels_written: number
}

export interface YOLOClassStats {
  id: number
  name: string
  labels_written: number
}

export interface YOLOCounts {
  frames_total: number
  frames_written: number
  frames_empty: number
  labels_total: number
}

export interface SegmentationsYOLOMetadata {
  dataset_id: string
  created_at: string
  job_id: string
  type: string
  counts: YOLOCounts
  objects: YOLOObjectStats[]
  classes: YOLOClassStats[]
  export_config: {
    min_area: number
    simplify: boolean
  }
}