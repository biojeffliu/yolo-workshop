"use client"

import * as React from "react"
import {
  MoreVertical,
  Play,
  Zap,
  Trash2,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import type { YOLOModelMetadata, ModelCheckpoint } from "@/hooks/use-fetch-models"
import { Separator } from "@/components/ui/separator"

const taskColors = {
  segmentation: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  detection: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  pose: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
  classification: "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400",
}

interface ModelCardProps {
  model: YOLOModelMetadata
  checkpoints?: ModelCheckpoint[]
  onFineTune: (modelId: string) => void
  onInference: (modelId: string) => void
  onDelete: (modelId: string) => void
  onViewDetails: (model: YOLOModelMetadata) => void
}

export function ModelCard({
  model,
  checkpoints = [],
  onFineTune,
  onInference,
  onDelete,
  onViewDetails,
} : ModelCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const hasCheckpoints = checkpoints.length > 0

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className="font-semibold text-lg truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => onViewDetails(model)}
              >
                {model.name}
              </h3>
              <Badge variant="outline" className={taskColors[model.task as keyof typeof taskColors] || ""}>
                {model.task}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">{model.family}</span>
              {model.size && (
                <>
                  <span>•</span>
                  <span className="font-mono">{model.size}</span>
                </>
              )}
              <span>•</span>
              <span>{model.params_m}M params</span>
            </div>
          </div>
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onInference(model.id)}>
                <Play className="h-4 w-4 mr-2" />
                Run Inference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFineTune(model.id)}>
                <Zap className="h-4 w-4 mr-2" />
                Fine Tune
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(model.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Model
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <Badge variant={model.pretrained ? "secondary" : "default"}>
            {model.pretrained ? "Pretrained" : "Fine-tuned"}
          </Badge>
          {model.created_at && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{new Date(model.created_at).toLocaleDateString()}</span>
            </>
          )}
          {hasCheckpoints && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{checkpoints.length} checkpoints</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onInference(model.id)} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Inference
          </Button>
          <Button size="sm" variant="outline" onClick={() => onFineTune(model.id)} className="flex-1">
            <Zap className="h-4 w-4 mr-2" />
            Fine Tune
          </Button>
        </div>

        {/* Checkpoints Section */}
        {hasCheckpoints && (
          <>
            <Separator className="my-4" />
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Checkpoints ({checkpoints.length})
              </button>
              {expanded && (
                <div className="mt-3 space-y-2">
                  {checkpoints.map((checkpoint) => (
                    <div
                      key={checkpoint.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">{checkpoint.label}</p>
                          {checkpoint.epoch && (
                            <p className="text-xs text-muted-foreground">Epoch {checkpoint.epoch}</p>
                          )}
                        </div>
                        {checkpoint.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Best
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onInference(checkpoint.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Run Inference
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => onDelete(checkpoint.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}