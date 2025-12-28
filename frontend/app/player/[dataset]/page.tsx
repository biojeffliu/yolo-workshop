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
import { SaveProgressDialog } from "@/components/video-player/save-progress-dialog"
import { useFetchFolders, useFetchImages, FolderMetadata } from "@/hooks/use-backend"
import { useLoadSam2, usePropagateMasks, useFetchFrameMasks, useSegmentationClick } from "@/hooks/use-sam2"
import { useSaveSegmentationsYOLO } from "@/hooks/use-save-options"

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
  const resolvedParams = React.use(params)
  const { folders, folderMap } = useFetchFolders()
  

  // Dataset and frame state
  const [selectedDataset, setSelectedDataset] = React.useState(resolvedParams.dataset)
  const [currentFrame, setCurrentFrame] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [fps, setFps] = React.useState(24)

  const maskCacheRef = React.useRef<
    Map<number, Record<number, ImageBitmap>>
  >(new Map())

  const [maskVersion, setMaskVersion] = React.useState(0)

  const getMasksForFrame = React.useCallback((frameIdx: number) => {
    return maskCacheRef.current.get(frameIdx) ?? null
  }, [])

  // Objects and clicks state
  const [objects, setObjects] = React.useState<SegmentObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = React.useState<number | null>(null)
  const [nextObjectId, setNextObjectId] = React.useState(0)
  const [clickMode, setClickMode] = React.useState<"positive" | "negative">("positive")
  const [clicks, setClicks] = React.useState<Click[]>([])

  // Saving 
  const [saveJobId, setSaveJobId] = React.useState<string | null>(null)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false)

  const {
    startExport: saveSegmentationsYOLOStartExport,
    progress: saveSegmentationsYOLOProgress,
    status: saveSegmentationsYOLOStatus,
    error: saveSegmentationsYOLOError,
    reset: saveSegmentationsYOLOReset } = useSaveSegmentationsYOLO()

  const { loadSam2, isLoading: isSam2Loading, modelState } = useLoadSam2()

  const isSam2Loaded = Boolean(modelState)
  const { images } = useFetchImages(selectedDataset)

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

    const start = currentFrame
    const end = Math.min(totalFrames - 1, currentFrame + 48)

    const framesToFetch: number[] = []
    for (let f = start; f <= end; f++) {
      if (!maskCacheRef.current.has(f)) {
        framesToFetch.push(f)
      }
    }

    if (!framesToFetch.length) return

    const controller = new AbortController()

    const prefetchBatch = async () => {
      const concurrency = 4
      for (let i = 0; i < framesToFetch.length; i += concurrency) {
        const batch = framesToFetch.slice(i, i + concurrency)
        const results = await Promise.all(
          batch.map((frameIdx) => fetchFrameMasks(selectedDataset, frameIdx, controller.signal))
        )

        results.forEach((masks, idx) => {
          if (!masks) return
          const frameIdx = batch[idx]
          maskCacheRef.current.set(frameIdx, masks)
          setMaskVersion((v) => v + 1)
        })
      }
    }

    prefetchBatch()

    return () => controller.abort()
  }, [currentFrame, selectedDataset, totalFrames, fetchFrameMasks])

  React.useEffect(() => {
    maskCacheRef.current.clear()
    setMaskVersion((v) => v + 1)
    setCurrentFrame(0)
  }, [selectedDataset])

  // Handle canvas click
  const { sendClick } = useSegmentationClick()
  const handleCanvasClick = React.useCallback(
    async (normalizedX: number, normalizedY: number) => {
      if (selectedObjectId === null || !isSam2Loaded || !currentFolderMetadata) return
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

      const frameIdx = res.frame_index
      const frameMasks = maskCacheRef.current.get(frameIdx) ?? {}

      for (const obj of res.updated_masks) {
        frameMasks[obj.object_id] = await decodeMask(obj.mask_png)
      }

      maskCacheRef.current.set(frameIdx, frameMasks)

      setMaskVersion(v => v + 1)

      setClicks(prev => [
        ...prev,
        {
          normalizedX,
          normalizedY,
          type: clickMode,
          objectId: selectedObjectId,
          frame: currentFrame,
        },
      ])

      setObjects(prev =>
        prev.map(obj =>
          obj.id === selectedObjectId 
            ? { ...obj, labelCount: obj.labelCount + 1 }
            : obj
        )
      )
    },
    [
      selectedDataset,
      currentFrame,
      selectedObjectId,
      clickMode,
      isSam2Loaded,
      sendClick,
      currentFolderMetadata,
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

    maskCacheRef.current.clear()
    setMaskVersion((v) => v + 1)
  }

  // Save labels
  const handleSave = () => {
    if (!selectedDataset) return
    saveSegmentationsYOLOStartExport({
      folder: selectedDataset,
      minArea: 10,
      simplify: true
    })
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
          <Button onClick={handleSave} disabled={saveSegmentationsYOLOStatus === "running"}>
            <Save className="h-4 w-4 mr-2" />
            {saveSegmentationsYOLOStatus === "running" ? "Saving..." : "Save"}
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
            getMasksForFrame={getMasksForFrame}
            maskVersion={maskVersion}
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
      <SaveProgressDialog 
        open={saveSegmentationsYOLOStatus === "running" || saveSegmentationsYOLOStatus === "success"}
        onOpenChange={(open) => {
          if (!open) saveSegmentationsYOLOReset()
        }}
        progress={saveSegmentationsYOLOProgress}
        status={saveSegmentationsYOLOStatus}
      />
    </div>
  )
}
