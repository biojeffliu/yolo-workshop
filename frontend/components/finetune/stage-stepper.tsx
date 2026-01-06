"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Stage {
  id: number
  name: string
  description: string
}

interface StageStepperProps {
  stages: Stage[]
  currentStage: number
  completedStages: number[]
  onStageClick?: (stage: number) => void
}

export function StageStepper({ stages, currentStage, completedStages, onStageClick }: StageStepperProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isCompleted = completedStages.includes(stage.id)
          const isCurrent = currentStage === stage.id
          const isClickable = isCompleted || stage.id <= Math.max(...completedStages, 0) + 1

          return (
            <li key={stage.id} className="flex-1 relative">
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute top-5 left-0 right-1/2 h-0.5 -translate-y-1/2",
                    completedStages.includes(stages[index - 1].id) ? "bg-primary" : "bg-border",
                  )}
                />
              )}
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-1/2 right-0 h-0.5 -translate-y-1/2",
                    isCompleted ? "bg-primary" : "bg-border",
                  )}
                />
              )}

              <button
                onClick={() => isClickable && onStageClick?.(stage.id)}
                disabled={!isClickable}
                className={cn(
                  "relative flex flex-col items-center gap-2 w-full group",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed",
                )}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-background border-primary text-primary"
                        : "bg-background border-border text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stage.id}</span>
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isCurrent ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {stage.name}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{stage.description}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}