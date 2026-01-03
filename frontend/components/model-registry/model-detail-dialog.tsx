"use client"
import { Play, Zap, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { YOLOModelDetail } from "@/hooks/use-fetch-models"

const taskColors = {
  segmentation: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  detection: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  pose: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
  classification: "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400",
}

interface ModelDetailDialogProps {
  model: YOLOModelDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFineTune: (modelId: string) => void
  onInference: (modelId: string) => void
  onDelete: (modelId: string) => void
}

export function ModelDetailDialog({
  model,
  open,
  onOpenChange,
  onFineTune,
  onInference,
  onDelete,
}: ModelDetailDialogProps) {
  if (!model) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{model.name}</DialogTitle>
          <DialogDescription>Complete model specifications and metadata</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Primary Info */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={taskColors[model.task as keyof typeof taskColors] || ""}>
              {model.task}
            </Badge>
            <Badge variant={model.pretrained ? "secondary" : "default"}>
              {model.pretrained ? "Pretrained" : "Fine-tuned"}
            </Badge>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Model Family</p>
              <p className="font-mono">{model.family}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Model Size</p>
              <p className="font-mono">{model.size || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Parameters</p>
              <p>{model.params_m}M</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Stride</p>
              <p className="font-mono">{model.stride}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Source</p>
              <p>{model.source}</p>
            </div>
            {model.created_at && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{new Date(model.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Datasets */}
          {model.datasets && model.datasets.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Training Datasets</p>
                <div className="flex flex-wrap gap-2">
                  {model.datasets.map((dataset, i) => (
                    <Badge key={i} variant="outline">
                      {dataset}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(model.id)
                onOpenChange(false)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => {
                onFineTune(model.id)
                onOpenChange(false)
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Fine Tune
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onInference(model.id)
                onOpenChange(false)
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Inference
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}