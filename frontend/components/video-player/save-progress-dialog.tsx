"use client"

import * as React from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BACKEND_URL } from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface SaveProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  progress: number
  status: "idle" | "running" | "success" | "error"
}

export function SaveProgressDialog({ open, onOpenChange, progress, status }: SaveProgressDialogProps) {
  const isComplete = status === "success"
  const isRunning = status === "running"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={isComplete}>
        <DialogHeader>
          <DialogTitle>{isComplete ? "Save Complete" : "Saving Segmentations"}</DialogTitle>
          <DialogDescription>
            {isComplete
              ? "Your segmentations have been saved successfully."
              : "Please wait while your segmentations are being saved."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Status icon and message */}
          <div className="flex items-center justify-center gap-2 py-4">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Saved successfully</span>
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Saving in progress...</span>
              </>
            )}
          </div>
        </div>

        {/* Close button (only when complete) */}
        {isComplete && (
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
