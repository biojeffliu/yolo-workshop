"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Database, Layers } from "lucide-react"
import type { FineTuneConfig, ModelSize } from "@/lib/finetune-types"

interface Model {
  id: string
  name: string
  task: string
  checkpoints: { id: string; name: string; mAP?: number }[]
}

interface Dataset {
  id: string
  name: string
  frames: number
}

interface StageConfigureProps {
  config: FineTuneConfig
  onChange: (config: FineTuneConfig) => void
  onNext: () => void
  models: Model[]
  datasets: Dataset[]
}

export function StageConfigure({
  config,
  onChange,
  onNext,
  models,
  datasets
}: StageConfigureProps) {
  const updateConfig = <K extends keyof FineTuneConfig>(key: K, value: FineTuneConfig[K]) => {
    onChange({ ...config, [key]: value })
  }

  const updateAugmentation = (key: string, value: number) => {
    onChange({ ...config, augmentation: { ...config.augmentation, [key]: value } })
  }

  const updateDatasetConfig = (key: string, value: any) => {
    onChange({ ...config, dataset_config: { ...config.dataset_config, [key]: value } })
  }

  const updateTuning = (key: string, value: any) => {
    onChange({ ...config, tuning: { ...config.tuning, [key]: value } })
  }

  const updateExport = (key: string, value: any) => {
    onChange({ ...config, export: { ...config.export, [key]: value } })
  }

  const toggleDataset = (datasetId: string) => {
    const current = config.datasets
    if (current.includes(datasetId)) {
      updateConfig(
        "datasets",
        current.filter((d) => d !== datasetId),
      )
    } else {
      updateConfig("datasets", [...current, datasetId])
    }
  }

  const selectedModel = models.find((m) => m.id === config.base_model)
  const isValid = config.datasets.length > 0 && (config.resume || config.model_size)

  return (
    <div className="space-y-6">
      {/* Core Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Model Selection
          </CardTitle>
          <CardDescription>Choose your base model and training mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resume Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Resume Training</Label>
              <p className="text-sm text-muted-foreground">Continue from an existing checkpoint</p>
            </div>
            <Switch checked={config.resume} onCheckedChange={(v) => updateConfig("resume", v)} />
          </div>

          {config.resume ? (
            /* Resume Mode */
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Base Model</Label>
                <Select value={config.base_model} onValueChange={(v) => updateConfig("base_model", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resume Checkpoint</Label>
                <Select
                  value={config.resume_checkpoint}
                  onValueChange={(v) => updateConfig("resume_checkpoint", v)}
                  disabled={!selectedModel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select checkpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedModel?.checkpoints.map((cp) => (
                      <SelectItem key={cp.id} value={cp.id}>
                        {cp.name} {cp.mAP && `(mAP: ${cp.mAP})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* Fresh Training Mode */
            <div className="space-y-2">
              <Label>Model Size</Label>
              <div className="grid grid-cols-5 gap-2">
                {(["n", "s", "m", "l", "x"] as ModelSize[]).map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={config.model_size === size ? "default" : "outline"}
                    onClick={() => updateConfig("model_size", size)}
                    className="flex flex-col h-auto py-3"
                  >
                    <span className="text-lg font-bold uppercase">{size}</span>
                    <span className="text-xs text-muted-foreground">
                      {size === "n" && "3.4M"}
                      {size === "s" && "11.8M"}
                      {size === "m" && "27.3M"}
                      {size === "l" && "46.0M"}
                      {size === "x" && "71.8M"}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dataset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dataset Selection
          </CardTitle>
          <CardDescription>Select one or more datasets to merge into a unified training set</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={dataset.id}
                      checked={config.datasets.includes(dataset.id)}
                      onCheckedChange={() => toggleDataset(dataset.id)}
                    />
                    <label htmlFor={dataset.id} className="cursor-pointer">
                      <p className="text-sm font-medium">{dataset.name}</p>
                      <p className="text-xs text-muted-foreground">{dataset.frames} frames</p>
                    </label>
                  </div>
                  {config.datasets.includes(dataset.id) && <Badge variant="secondary">Selected</Badge>}
                </div>
              ))}
            </div>
          </ScrollArea>
          {config.datasets.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              {config.datasets.length} dataset(s) selected for training
            </p>
          )}
        </CardContent>
      </Card>

      {/* Training Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Training Settings</CardTitle>
          <CardDescription>Configure training hyperparameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="epochs">Epochs</Label>
              <Input
                id="epochs"
                type="number"
                min={1}
                value={config.epochs}
                onChange={(e) => updateConfig("epochs", Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loops">Training Loops</Label>
              <Input
                id="loops"
                type="number"
                min={1}
                value={config.num_train_loops}
                onChange={(e) => updateConfig("num_train_loops", Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="img_size">Image Size</Label>
              <Input
                id="img_size"
                type="number"
                min={32}
                step={32}
                value={config.img_size}
                onChange={(e) => updateConfig("img_size", Number.parseInt(e.target.value) || 640)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freeze">Layers to Freeze</Label>
              <Input
                id="freeze"
                type="number"
                min={0}
                value={config.layer_freeze}
                onChange={(e) => updateConfig("layer_freeze", Number.parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings Accordion */}
      <Accordion type="multiple" className="space-y-2">
        {/* Augmentation Config */}
        <AccordionItem value="augmentation" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Augmentation</span>
              <Badge variant="outline" className="text-xs">
                Advanced
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(config.augmentation).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key} className="text-xs">
                    {key.split("_")[0]}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    value={value}
                    onChange={(e) => updateAugmentation(key, Number.parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Dataset Config */}
        <AccordionItem value="dataset" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Dataset Processing</span>
              <Badge variant="outline" className="text-xs">
                Advanced
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="train_pct" className="text-xs">
                  Train %
                </Label>
                <Input
                  id="train_pct"
                  type="number"
                  step={0.05}
                  min={0}
                  max={1}
                  value={config.dataset_config.train_percentage}
                  onChange={(e) => updateDatasetConfig("train_percentage", Number.parseFloat(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="empty_ratio" className="text-xs">
                  Empty Ratio
                </Label>
                <Input
                  id="empty_ratio"
                  type="number"
                  step={0.05}
                  min={0}
                  max={1}
                  value={config.dataset_config.empty_frame_keep_ratio}
                  onChange={(e) => updateDatasetConfig("empty_frame_keep_ratio", Number.parseFloat(e.target.value))}
                  disabled={!config.dataset_config.keep_empty_frames}
                  className="h-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="keep_empty"
                  checked={config.dataset_config.keep_empty_frames}
                  onCheckedChange={(v) => updateDatasetConfig("keep_empty_frames", v)}
                />
                <Label htmlFor="keep_empty" className="text-xs cursor-pointer">
                  Keep Empty
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tuning Config */}
        <AccordionItem value="tuning" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">HP Tuning</span>
              <Badge variant="outline" className="text-xs">
                Advanced
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="enable_tune"
                  checked={config.tuning.enable_tuning}
                  onCheckedChange={(v) => updateTuning("enable_tuning", v)}
                />
                <Label htmlFor="enable_tune" className="text-xs cursor-pointer">
                  Enable Tuning
                </Label>
              </div>
              {config.tuning.enable_tuning && (
                <>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="use_ray"
                      checked={config.tuning.use_ray_tune}
                      onCheckedChange={(v) => updateTuning("use_ray_tune", v)}
                    />
                    <Label htmlFor="use_ray" className="text-xs cursor-pointer">
                      Use Ray
                    </Label>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="iterations" className="text-xs">
                      Iterations
                    </Label>
                    <Input
                      id="iterations"
                      type="number"
                      min={1}
                      value={config.tuning.iterations}
                      onChange={(e) => updateTuning("iterations", Number.parseInt(e.target.value) || 10)}
                      className="h-8"
                    />
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Export Config */}
        <AccordionItem value="export" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Export Options</span>
              <Badge variant="outline" className="text-xs">
                Advanced
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="export_onnx"
                  checked={config.export.export_onnx}
                  onCheckedChange={(v) => updateExport("export_onnx", v)}
                />
                <Label htmlFor="export_onnx" className="text-xs cursor-pointer">
                  Export ONNX
                </Label>
              </div>
              {config.export.export_onnx && (
                <div className="space-y-1.5">
                  <Label htmlFor="onnx_batch" className="text-xs">
                    Batch Size
                  </Label>
                  <Input
                    id="onnx_batch"
                    type="number"
                    min={1}
                    value={config.export.onnx_batch_size}
                    onChange={(e) => updateExport("onnx_batch_size", Number.parseInt(e.target.value) || 1)}
                    className="h-8"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Next Button */}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid} size="lg">
          Review Configuration
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}