"use client"

import * as React from "react"
import { useFetchModels, useFetchModel } from "@/hooks/use-fetch-models"
import { ModelCard } from "@/components/model-registry/model-card"
import { ModelDetailDialog } from "@/components/model-registry/model-detail-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import type { YOLOModelMetadata } from "@/hooks/use-fetch-models"

const taskColors = {
  segmentation: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  detection: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  pose: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
}

export default function ModelsPage() {
  const { models, isLoading: isFetchModelsLoading } = useFetchModels()
  const [selectedModelId, setSelectedModelId] = React.useState<string | null>(null)
  const { model: selectedModel } = useFetchModel(selectedModelId || undefined)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [taskFilter, setTaskFilter] = React.useState("all")
  const [modelTypeFilter, setModelTypeFilter] = React.useState("all")
  const [expandedModels, setExpandedModels] = React.useState<Set<string>>(new Set())

  const checkpointMap = React.useMemo(() => {
    const map: Record<string, any[]> = {}
    models.forEach((model) => {
      if (!model.pretrained && model.num_checkpoints && model.num_checkpoints > 0) {
        map[model.id] = []
      }
    })
    return map
  }, [models])

  const handleViewDetails = (model: YOLOModelMetadata) => {
    setSelectedModelId(model.id)
    setDialogOpen(true)
  }

  const handleFineTune = (modelId: string) => {

  }

  const handleInference = (modelId: string) => {

  }

  const handleDelete = (modelId: string) => {

  }

  const toggleExpanded = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedModels((prev) => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        next.delete(modelId)
      } else {
        next.add(modelId)
      }
      return next
    })
  }

  const filteredModels = React.useMemo(() => {
    return models.filter((model) => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTask = taskFilter === "all" || model.task === taskFilter
      const matchesType =
        modelTypeFilter === "all" ||
        (modelTypeFilter === "pretrained" && model.pretrained) ||
        (modelTypeFilter === "finetuned" && !model.pretrained)
      return matchesSearch && matchesTask && matchesType
    })
  }, [models, searchQuery, taskFilter, modelTypeFilter])

  const pretrainedCount = models.filter((m) => m.pretrained).length
  const fineTunedCount = models.filter((m) => !m.pretrained).length

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Model Registry</h1>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Replaced Tabs with button groups */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                size="sm"
                variant={taskFilter === "all" ? "default" : "ghost"}
                onClick={() => setTaskFilter("all")}
              >
                All Tasks
              </Button>
              <Button
                size="sm"
                variant={taskFilter === "segmentation" ? "default" : "ghost"}
                onClick={() => setTaskFilter("segmentation")}
              >
                Segmentation
              </Button>
              <Button
                size="sm"
                variant={taskFilter === "detection" ? "default" : "ghost"}
                onClick={() => setTaskFilter("detection")}
              >
                Detection
              </Button>
              <Button
                size="sm"
                variant={taskFilter === "pose" ? "default" : "ghost"}
                onClick={() => setTaskFilter("pose")}
              >
                Pose
              </Button>
            </div>

            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                size="sm"
                variant={modelTypeFilter === "all" ? "default" : "ghost"}
                onClick={() => setModelTypeFilter("all")}
              >
                All Models ({models.length})
              </Button>
              <Button
                size="sm"
                variant={modelTypeFilter === "pretrained" ? "default" : "ghost"}
                onClick={() => setModelTypeFilter("pretrained")}
              >
                Pretrained ({pretrainedCount})
              </Button>
              <Button
                size="sm"
                variant={modelTypeFilter === "finetuned" ? "default" : "ghost"}
                onClick={() => setModelTypeFilter("finetuned")}
              >
                Fine-tuned ({fineTunedCount})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isFetchModelsLoading && <div className="text-center py-12 text-muted-foreground">Loading models...</div>}

      {/* Models Grid */}
      {!isFetchModelsLoading && filteredModels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              checkpoints={checkpointMap[model.id] || []}
              onFineTune={handleFineTune}
              onInference={handleInference}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isFetchModelsLoading && filteredModels.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No models found matching your filters.</div>
      )}

      {/* Model Details Dialog */}
      <ModelDetailDialog
        model={selectedModel}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onFineTune={handleFineTune}
        onInference={handleInference}
        onDelete={handleDelete}
      />
    </div>
  )
}