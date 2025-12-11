"use client"
import { MousePointer, MousePointerClick } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ClickMode = "positive" | "negative"

interface ClickModeSelectorProps {
  mode: ClickMode
  onModeChange: (mode: ClickMode) => void
  disabled: boolean
}

export function ClickModeSelector({ mode, onModeChange, disabled }: ClickModeSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Click Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            variant={mode === "positive" ? "default" : "outline"}
            size="sm"
            className={`flex-1 ${mode === "positive" ? "bg-green-600 hover:bg-green-700" : ""}`}
            onClick={() => onModeChange("positive")}
            disabled={disabled}
          >
            <MousePointerClick className="h-4 w-4 mr-1 text-green-300" />
            Positive
          </Button>
          <Button
            variant={mode === "negative" ? "default" : "outline"}
            size="sm"
            className={`flex-1 ${mode === "negative" ? "bg-red-600 hover:bg-red-700" : ""}`}
            onClick={() => onModeChange("negative")}
            disabled={disabled}
          >
            <MousePointer className="h-4 w-4 mr-1 text-red-300" />
            Negative
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {disabled
            ? "Select an object to add clicks"
            : mode === "positive"
              ? "Click to include region in mask"
              : "Click to exclude region from mask"}
        </p>
      </CardContent>
    </Card>
  )
}