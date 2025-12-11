"use client"

import * as React from "react"
import { BrainCircuit, Loader2, Save, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VideoCanvas } from "@/components/video-player/video-canvas"
import { PlaybackControls } from "@/components/video-player/playback-controls"
import { ObjectsPanel } from "@/components/video-player/objects-panel"
import { ClickModeSelector } from "@/components/video-player/click-mode-selector"
import { useFetchFolders, useFetchImages, FolderMetadata } from "@/hooks/use-backend"
import { useLoadSam2 } from "@/hooks/use-sam2"


interface Click {
  x: number
  y: number
  type: "positive" | "negative"
  objectId: string
  frame: number
}

interface SegmentObject {
  id: string
  name: string
  className: string
  labelCount: number
  visible: boolean
}

export default function VideoPlayerPage({ params }: { params: Promise<{ dataset: string }> }) {
  const resolvedParams = React.use(params)
  const { folders, folderNames, isLoading: foldersLoading, error: foldersError } = useFetchFolders()
  

  // Dataset and frame state
  const [selectedDataset, setSelectedDataset] = React.useState(resolvedParams.dataset)
  const [currentFrame, setCurrentFrame] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [fps, setFps] = React.useState(24)

  // Objects and clicks state
  const [objects, setObjects] = React.useState<SegmentObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = React.useState<string | null>(null)
  const [clickMode, setClickMode] = React.useState<"positive" | "negative">("positive")
  const [clicks, setClicks] = React.useState<Click[]>([])
  const [masks, setMasks] = React.useState<Record<string, ImageData | null>>({})

  const { loadSam2, isLoading: isSam2Loading, error: sam2Error, modelState } = useLoadSam2()

  const isSam2Loaded = Boolean(modelState)

  // Get current dataset info
  // const currentDatasetInfo = mockDatasets.find((f) => f.name === selectedDataset)
  const totalFrames = 0

  // Generate placeholder image URLs (replace with actual backend URLs)
  const { images, isLoading: imagesLoading, error: imagesError, refetch } = useFetchImages(selectedDataset)
  // Playback loop
  React.useEffect(() => {
    if (!isPlaying || totalFrames === 0) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= totalFrames - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [isPlaying, fps, totalFrames])

  // Handle canvas click
  const handleCanvasClick = React.useCallback(
    (x: number, y: number) => {
      if (!selectedObjectId) return

      const newClick: Click = {
        x,
        y,
        type: clickMode,
        objectId: selectedObjectId,
        frame: currentFrame,
      }

      setClicks((prev) => [...prev, newClick])

      // Update label count for the object
      setObjects((prev) =>
        prev.map((obj) => (obj.id === selectedObjectId ? { ...obj, labelCount: obj.labelCount + 1 } : obj)),
      )

      // TODO: Call backend to generate mask
    },
    [selectedObjectId, clickMode, currentFrame],
  )

  // Object management
  const handleCreateObject = (name: string, className: string) => {
    const newObject: SegmentObject = {
      id: crypto.randomUUID(),
      name,
      className,
      labelCount: 0,
      visible: true,
    }
    setObjects((prev) => [...prev, newObject])
    setSelectedObjectId(newObject.id)
  }

  const handleDeleteObject = (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id))
    setClicks((prev) => prev.filter((click) => click.objectId !== id))
    if (selectedObjectId === id) {
      setSelectedObjectId(null)
    }
  }

  const handleToggleVisibility = (id: string) => {
    setObjects((prev) => prev.map((obj) => (obj.id === id ? { ...obj, visible: !obj.visible } : obj)))
  }

  // Propagate masks
  const handlePropagateMasks = () => {
    // TODO: Call backend endpoint to propagate masks
    console.log("Propagating masks...")
  }

  // Save labels
  const handleSave = () => {
    // TODO: Call backend endpoint to save labels
    console.log("Saving labels...", { objects, clicks })
  }

  // Filter clicks for current frame and visible objects
  const visibleClicks = clicks.filter(
    (click) => click.frame === currentFrame && objects.find((obj) => obj.id === click.objectId)?.visible,
  )

  const visibleObjects = objects.filter((obj) => obj.visible)

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      {/* Top bar with dataset selector and action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedDataset} onValueChange={setSelectedDataset}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select dataset" />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder: FolderMetadata) => (
                <SelectItem key={folder.name} value={folder.name}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {/* Load SAM2 Model Button */}
          <Button
            variant={isSam2Loaded ? "secondary" : "outline"}
            onClick={() => loadSam2(selectedDataset)}
            disabled={isSam2Loading || isSam2Loaded}
          >
            {isSam2Loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BrainCircuit className="h-4 w-4 mr-2" />
            )}
            {isSam2Loading ? "Loading..." : isSam2Loaded ? "SAM2 Loaded" : "Load SAM2 Model"}
          </Button>
          <Button variant="outline" onClick={handlePropagateMasks}>
            <Wand2 className="h-4 w-4 mr-2" />
            Propagate Masks
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Video canvas and controls */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <VideoCanvas
            images={images}
            currentFrame={currentFrame}
            clicks={visibleClicks}
            objects={visibleObjects}
            masks={masks}
            onCanvasClick={handleCanvasClick}
          />
          <Card>
            <CardContent className="pt-4">
              <PlaybackControls
                currentFrame={currentFrame}
                totalFrames={totalFrames}
                isPlaying={isPlaying}
                fps={fps}
                onFrameChange={setCurrentFrame}
                onPlayPause={() => setIsPlaying((prev) => !prev)}
                onFpsChange={setFps}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar with tools */}
        <div className="w-[280px] flex flex-col gap-4 shrink-0">
          <ClickModeSelector mode={clickMode} onModeChange={setClickMode} disabled={!selectedObjectId} />
          <ObjectsPanel
            objects={objects}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onCreateObject={handleCreateObject}
            onDeleteObject={handleDeleteObject}
            onToggleVisibility={handleToggleVisibility}
          />
        </div>
      </div>
    </div>
  )
}
