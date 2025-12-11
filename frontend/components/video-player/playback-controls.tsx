"use client"
import { Play, Pause, SkipBack, SkipForward, ChevronFirst, ChevronLast } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PlaybackControlsProps {
  currentFrame: number
  totalFrames: number
  isPlaying: boolean
  fps: number
  onFrameChange: (frame: number) => void
  onPlayPause: () => void
  onFpsChange: (fps: number) => void
}

export function PlaybackControls({
  currentFrame,
  totalFrames,
  isPlaying,
  fps,
  onFrameChange,
  onPlayPause,
  onFpsChange,
}: PlaybackControlsProps) {
  return (
    <div className="space-y-4">
      {/* Timeline slider */}
      <div className="space-y-2">
        <Slider
          value={[currentFrame]}
          min={0}
          max={Math.max(0, totalFrames - 1)}
          step={1}
          onValueChange={([val]) => onFrameChange(val)}
          disabled={totalFrames === 0}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Frame {currentFrame + 1}</span>
          <span>{totalFrames} frames</span>
        </div>
      </div>

      {/* Playback buttons */}
      <div className="flex items-center justify-center gap-1">
        <Button variant="outline" size="icon" onClick={() => onFrameChange(0)} disabled={totalFrames === 0}>
          <ChevronFirst className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onFrameChange(Math.max(0, currentFrame - 1))}
          disabled={totalFrames === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="default" size="icon" onClick={onPlayPause} disabled={totalFrames === 0}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onFrameChange(Math.min(totalFrames - 1, currentFrame + 1))}
          disabled={totalFrames === 0}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onFrameChange(totalFrames - 1)}
          disabled={totalFrames === 0}
        >
          <ChevronLast className="h-4 w-4" />
        </Button>
      </div>

      {/* FPS control */}
      <div className="flex items-center gap-2">
        <Label htmlFor="fps" className="text-sm whitespace-nowrap">
          FPS:
        </Label>
        <Input
          id="fps"
          type="number"
          min={1}
          max={60}
          value={fps}
          onChange={(e) => onFpsChange(Math.max(1, Math.min(60, Number.parseInt(e.target.value) || 1)))}
          className="w-20 h-8"
        />
      </div>
    </div>
  )
}