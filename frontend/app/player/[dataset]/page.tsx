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
import { useLoadSam2, usePropagateMasks, useFetchFrameMasks, useSegmentationClick } from "@/hooks/use-sam2"


interface Click {
  normalizedX: number
  normalizedY: number
  type: "positive" | "negative"
  objectId: number
  frame: number
}

interface SegmentObject {
  id: number
  name: string
  className: string
  labelCount: number
  visible: boolean
}

async function decodeMask(maskBase64: string): Promise<ImageBitmap> {
  const blob = await fetch(`data:image/png;base64,${maskBase64}`).then(r => r.blob())
  return await createImageBitmap(blob)
}

export default function VideoPlayerPage({ params }: { params: Promise<{ dataset: string }> }) {
  type MaskStore = {
    [frameIndex: number]: {
      [objectId: number]: ImageBitmap
    }
  }
  const resolvedParams = React.use(params)
  const { folders, folderMap, folderNames, isLoading: foldersLoading, error: foldersError } = useFetchFolders()
  

  // Dataset and frame state
  const [selectedDataset, setSelectedDataset] = React.useState(resolvedParams.dataset)
  const [currentFrame, setCurrentFrame] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [fps, setFps] = React.useState(24)

  // Objects and clicks state
  const [objects, setObjects] = React.useState<SegmentObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = React.useState<number | null>(null)
  const [nextObjectId, setNextObjectId] = React.useState(0)
  const [clickMode, setClickMode] = React.useState<"positive" | "negative">("positive")
  const [clicks, setClicks] = React.useState<Click[]>([])
  const [masks, setMasks] = React.useState<MaskStore>({})

  const { loadSam2, isLoading: isSam2Loading, error: sam2Error, modelState } = useLoadSam2()

  const isSam2Loaded = Boolean(modelState)
  const { images, isLoading: imagesLoading, error: imagesError, refetch } = useFetchImages(selectedDataset)

  const { fetchFrameMasks } = useFetchFrameMasks()

  const totalFrames = images.length
  const currentFolderMetadata = folderMap[selectedDataset]

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


  React.useEffect(() => {
    if (!selectedDataset) return

    let cancelled = false

    async function loadMasks() {
      const res = await fetchFrameMasks(selectedDataset, currentFrame)
      if (!res || cancelled) return

      setMasks(prev => ({
        ...prev,
        [currentFrame]: res,
      }))
    }

    loadMasks()

    return () => {
      cancelled = true
    }
  }, [selectedDataset, currentFrame])

  // Handle canvas click
  const { sendClick, isLoading: isSegLoading, error: segError } = useSegmentationClick()
  const handleCanvasClick = React.useCallback(
    async (normalizedX: number, normalizedY: number) => {
      if (selectedObjectId === null || !isSam2Loaded) return
      const x = Math.round(normalizedX * currentFolderMetadata.width)
      const y = Math.round(normalizedY * currentFolderMetadata.height)

      // send click to backend
      const res = await sendClick({
        folder: selectedDataset,
        frameIndex: currentFrame,
        x: x,
        y: y,
        isPositive: clickMode === "positive",
        objectId: selectedObjectId,
      })

      if (!res) return

      for (const obj of res.updated_masks) {
        const bitmap = await decodeMask(obj.mask_png)

        setMasks(prev => ({
          ...prev,
          [res.frame_index]: {
            ...(prev[res.frame_index] ?? {}),
            [obj.object_id]:bitmap,
          },
        }))
      }

      // Update local click markers
      const newClick: Click = {
        normalizedX,
        normalizedY,
        type: clickMode,
        objectId: selectedObjectId,
        frame: currentFrame,
      }

      setClicks((prev) => [...prev, newClick])

      // Update object label count
      setObjects((prev) =>
        prev.map((obj) =>
          obj.id === selectedObjectId ? { ...obj, labelCount: obj.labelCount + 1 } : obj,
        ),
      )
    },
    [
      selectedDataset,
      currentFrame,
      selectedObjectId,
      clickMode,
      isSam2Loaded,
      sendClick,
    ]
  )
  const handleCreateObject = (name: string, className: string) => {
    setObjects((prev) => {
      const newObject: SegmentObject = {
        id: nextObjectId,
        name,
        className,
        labelCount: 0,
        visible: true,
      }
      return [...prev, newObject]
    })

    setSelectedObjectId(nextObjectId)
    setNextObjectId((id) => id + 1)
  }

  const handleDeleteObject = (id: number) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id))
    setClicks((prev) => prev.filter((click) => click.objectId !== id))
    if (selectedObjectId === id) {
      setSelectedObjectId(null)
    }
  }

  const handleToggleVisibility = (id: number) => {
    setObjects((prev) => prev.map((obj) => (obj.id === id ? { ...obj, visible: !obj.visible } : obj)))
  }

  const { propagateMasks, isLoading: isPropagating } = usePropagateMasks()

  const handlePropagateMasks = async () => {
    if (!selectedDataset) return

    const res = await propagateMasks(selectedDataset, totalFrames)
    if (!res) return

    setMasks({})
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
          <Button
            variant="outline"
            onClick={handlePropagateMasks}
            disabled={isPropagating}
          >
            {isPropagating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            {isPropagating ? "Propagating Masks..." : "Propagate Masks"}
            {/* <Wand2 className="h-4 w-4 mr-2" />
            Propagate Masks */}
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
            masks={masks[currentFrame] ?? {}}
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
          <ClickModeSelector mode={clickMode} onModeChange={setClickMode} disabled={selectedObjectId === null} />
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
