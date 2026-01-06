"use client"

import * as React from "react"
import { StageStepper } from "@/components/finetune/stage-stepper"
import { StageConfigure } from "@/components/finetune/stage-configure"
import { useFetchModels } from "@/hooks/use-fetch-models"

const stages = [
  { id: 1, name: "Configure", description: "Set up training" },
  { id: 2, name: "Review", description: "Verify settings" },
  { id: 3, name: "Training", description: "Monitor progress" },
  { id: 4, name: "Artifacts", description: "Export & download" },
]

export default function FineTunePage() {
  const [currentStage, setCurrentStage] = React.useState(1)
  const [completedStages, setCompletedStages] = React.useState<number[]>([])


  // Hooks
  const { models, isLoading: modelsLoading } = useFetchModels()

  const handleStageClick = (stage: number) => {
    if (completedStages.includes(stage) || stage === currentStage) {
      setCurrentStage(stage)
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
          models={models}
          datasets={}
        />
      )}
    </div>
  )
}