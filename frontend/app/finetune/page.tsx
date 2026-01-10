"use client"

import * as React from "react"
import { StageStepper } from "@/components/finetune/stage-stepper"
import { StageConfigure } from "@/components/finetune/stage-configure"
import { StageReview } from "@/components/finetune/stage-review"
import { useFineTuneJob } from "@/hooks/use-finetune"
import { StageProgress } from "@/components/finetune/stage-progress"
import {
  FineTuneConfig,
  defaultAugmentationConfig,
  defaultDatasetConfig,
  defaultExportConfig,
  defaultTuningConfig
} from "@/lib/finetune-types"

const stages = [
  { id: 1, name: "Configure", description: "Set up training" },
  { id: 2, name: "Review", description: "Verify settings" },
  { id: 3, name: "Training", description: "Monitor progress" },
  { id: 4, name: "Artifacts", description: "Export & download" },
]

export default function FineTunePage() {
  const [currentStage, setCurrentStage] = React.useState(1)
  const [completedStages, setCompletedStages] = React.useState<number[]>([])
  const [config, setConfig] = React.useState<FineTuneConfig>({
    base_model: "",
    checkpoint: "",
    resume: false,
    resume_checkpoint: undefined,
    model_size: "s",
    datasets: [],
    epochs: 100,
    num_train_loops: 1,
    img_size: 640,
    layer_freeze: 0,
    batch_size: 16,
    learning_rate: 0.001,
    patience: 10,
    augmentation: defaultAugmentationConfig,
    dataset_config: defaultDatasetConfig,
    tuning: defaultTuningConfig,
    export: defaultExportConfig,
    data_dest_dir: "",
  })

  const {
    job: currentJob,
    eventsUrl,
    isSubmitting,
    startFineTune,
  } = useFineTuneJob()


  // Hooks

  const handleConfigNext = () => {
    setCompletedStages([1])
    setCurrentStage(2)
  }

  const handleReviewBack = () => {
    setCompletedStages([])
    setCurrentStage(1)
  }


  const handleStageClick = (stage: number) => {
    if (completedStages.includes(stage) || stage === currentStage) {
      setCurrentStage(stage)
    }
  }

  const handleStartJob = async () => {
    try {
      const job = await startFineTune(config)
      if (job) {
        setCompletedStages([1, 2])
        setCurrentStage(3)
      }
    } catch (err) {
      console.error("Failed to start fine-tune job", err)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">YOLO Fine-Tuning</h1>
      </div>

      {/* Stepper */}
      <StageStepper
        stages={stages}
        currentStage={currentStage}
        completedStages={completedStages}
        onStageClick={handleStageClick}
      />

      {/* Stage Content */}
      {currentStage === 1 && (
        <StageConfigure
          config={config}
          onChange={setConfig}
          onNext={handleConfigNext}
        />
      )}

      {currentStage === 2 && (
        <StageReview 
          config={config}
          onBack={handleReviewBack}
          onStart={handleStartJob}
          isSubmitting={isSubmitting}
        />
      )}

      {currentStage === 3 && currentJob && (
        <StageProgress
          job={currentJob}
          eventsUrl={eventsUrl}
          onCancel={() => {}}
        />
      )}
    </div>
  )
}