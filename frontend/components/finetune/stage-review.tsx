"use client"

import * as React from "react"
import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Play, Check, X, Loader2 } from "lucide-react"
import { useSegmentationDatasets } from "@/hooks/use-fetch-datasets"
import type { FineTuneConfig } from "@/lib/finetune-types"

interface StageReviewProps {
  config: FineTuneConfig
  onBack: () => void
  onStart: () => void
  isSubmitting: boolean
}

interface ConfigRowProps {
  label: string
  value: ReactNode
}

function ConfigRow({ label, value }: ConfigRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function StageReview({
  config,
  onBack,
  onStart,
  isSubmitting,
}: StageReviewProps) {
  const { datasets, isLoading: datasetsLoading } = useSegmentationDatasets()

  const selectedDatasets = datasets.filter((d) => config.datasets.includes(d.dataset_id))

  const classDistribution = React.useMemo(() => {
    const acc = new Map<number, { name: string; labels_written: number }>()

    for (const dataset of selectedDatasets) {
      for (const cls of dataset.classes) {
        const existing = acc.get(cls.id)

        if (existing) {
          existing.labels_written += cls.labels_written
        } else {
          acc.set(cls.id, {
            name: cls.name,
            labels_written: cls.labels_written,
          })
        }
      }
    }

    return Array.from(acc.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.labels_written - a.labels_written)
  }, [selectedDatasets])

  const totalLabels = classDistribution.reduce(
    (sum, cls) => sum + cls.labels_written,
    0
  )

  return (
    <div className="space-y-6 w-full mx-auto">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle>Review Configuration</CardTitle>
          <CardDescription>Verify your settings before starting the fine-tuning job</CardDescription>
        </CardHeader>
      </Card>

      {/* Model & Mode */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Model Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <ConfigRow
            label="Training Mode"
            value={
              <Badge variant={config.resume ? "secondary" : "default"}>
                {config.resume ? "Resume Training" : "Fresh Training"}
              </Badge>
            }
          />
          {config.resume ? (
            <>
              <ConfigRow label="Base Model" value={config.base_model || "Not selected"} />
              <ConfigRow label="Resume Checkpoint" value={config.resume_checkpoint || "Not selected"} />
            </>
          ) : (
            <ConfigRow label="Model Size" value={`YOLOv8${config.model_size.toUpperCase()}-seg`} />
          )}
        </CardContent>
      </Card>

      {/* Datasets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Training Data</CardTitle>
              <CardDescription className="mt-1">
                {selectedDatasets.length} dataset{selectedDatasets.length !== 1 ? "s" : ""} •{" "}
                {totalLabels.toLocaleString()} total labels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedDatasets.length > 0 ? (
            <div className="space-y-4">
              {selectedDatasets.map((ds) => {
                const datasetLabels = ds.classes.reduce(
                  (sum, c) => sum + c.labels_written,
                  0
                )

                return (
                  <div key={ds.dataset_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{ds.dataset_id}</span>
                      <span className="text-xs text-muted-foreground">
                        {datasetLabels.toLocaleString()} labels
                      </span>
                    </div>

                    <div className="rounded-md border">
                      <div className="grid grid-cols-2 gap-px bg-border">
                        {ds.classes.map((cls) => (
                          <div
                            key={cls.id}
                            className="bg-background px-3 py-1.5 flex items-center justify-between"
                          >
                            <span className="text-xs text-muted-foreground">
                              {cls.name}
                            </span>
                            <span className="text-xs font-medium">
                              {cls.labels_written.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedDatasets.map((ds) => (
                <Badge key={ds.dataset_id} variant="outline">
                  {ds.dataset_id}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Parameters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Training Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <ConfigRow label="Epochs" value={config.epochs} />
          <ConfigRow label="Training Loops" value={config.num_train_loops} />
          <ConfigRow label="Image Size" value={`${config.img_size}px`} />
          <ConfigRow label="Layers to Freeze" value={config.layer_freeze} />
          <ConfigRow label="Batch Size" value={config.batch_size} />
          <ConfigRow label="Learning Rate" value={config.learning_rate} />
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Export Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <ConfigRow
            label="ONNX Export"
            value={
              config.export.export_onnx ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" /> Enabled (batch: {config.export.onnx_batch_size})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <X className="h-4 w-4" /> Disabled
                </span>
              )
            }
          />
          <ConfigRow
            label="Hyperparameter Tuning"
            value={
              config.tuning.enable_tuning ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" /> {config.tuning.iterations} iterations
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <X className="h-4 w-4" /> Disabled
                </span>
              )
            }
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Edit
        </Button>
        <Button onClick={onStart} disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Fine-Tuning
            </>
          )}
        </Button>
      </div>
    </div>
  )
}