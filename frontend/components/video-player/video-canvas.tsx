"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { useFrameBuffer } from "@/hooks/use-frame-buffer"
import { getClassColor } from "@/lib/cocos-classes"

interface Click {
  normalizedX: number
  normalizedY: number
  type: "positive" | "negative"
  objectId: number
}

interface SegmentObject {
  id: number
  name: string
  className: string
  labelCount: number
}

interface VideoCanvasProps {
  images: string[]
  currentFrame: number
  clicks: Click[]
  objects: SegmentObject[]
  getMasksForFrame: (frameIdx: number) => Record<number, ImageBitmap> | null
  maskVersion: number
  onCanvasClick: (normalizedX: number, normalizedY: number) => void
}

export function VideoCanvas({
  images,
  currentFrame,
  clicks,
  objects,
  getMasksForFrame,
  maskVersion,
  onCanvasClick,
}: VideoCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { getImage, isReady } = useFrameBuffer(images, currentFrame)

  const [imageDimensions, setImageDimensions] =
    React.useState<{ width: number; height: number } | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageDimensions) return

    const rect = canvasRef.current.getBoundingClientRect()
    const displayX = e.clientX - rect.left
    const displayY = e.clientY - rect.top

    const displayAspect = rect.width / rect.height
    const imageAspect = imageDimensions.width / imageDimensions.height

    let displayWidth: number
    let displayHeight: number
    let offsetX: number
    let offsetY: number

    if (displayAspect > imageAspect) {
      displayHeight = rect.height
      displayWidth = displayHeight * imageAspect
      offsetX = (rect.width - displayWidth) / 2
      offsetY = 0
    } else {
      displayWidth = rect.width
      displayHeight = displayWidth / imageAspect
      offsetX = 0
      offsetY = (rect.height - displayHeight) / 2
    }

    const imageX = displayX - offsetX
    const imageY = displayY - offsetY

    if (
      imageX < 0 ||
      imageY < 0 ||
      imageX > displayWidth ||
      imageY > displayHeight
    ) {
      return
    }

    onCanvasClick(imageX / displayWidth, imageY / displayHeight)
  }

  React.useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const image = getImage(currentFrame)
    if (!image) return

    if (
      !imageDimensions ||
      imageDimensions.width !== image.width ||
      imageDimensions.height !== image.height
    ) {
      setImageDimensions({ width: image.width, height: image.height })
    }

    canvas.width = image.width
    canvas.height = image.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)

    const frameMasks = getMasksForFrame(currentFrame)
    if (!frameMasks) return

    objects.forEach(obj => {
      const mask = frameMasks[obj.id]
      if (!mask) return

      // --- OFFSCREEN LAYER ---
      const overlay = document.createElement("canvas")
      overlay.width = canvas.width
      overlay.height = canvas.height

      const octx = overlay.getContext("2d")!
      octx.clearRect(0, 0, overlay.width, overlay.height)

      // 1. draw mask alpha
      octx.drawImage(mask, 0, 0, overlay.width, overlay.height)

      // 2. colorize masked pixels ONLY
      octx.globalCompositeOperation = "source-in"
      octx.fillStyle = getClassColor(obj.className)
      octx.fillRect(0, 0, overlay.width, overlay.height)

      // --- COMPOSITE ON TOP ---
      ctx.save()
      ctx.globalAlpha = 0.4
      ctx.drawImage(overlay, 0, 0)
      ctx.restore()
    })

  }, [currentFrame, images, objects, getImage, getMasksForFrame, maskVersion])

  const renderStars = () => {
    if (!imageDimensions || !containerRef.current) return null

    const container = containerRef.current.getBoundingClientRect()
    const imageAspect = imageDimensions.width / imageDimensions.height
    const containerAspect = container.width / container.height

    let displayWidth: number
    let displayHeight: number
    let offsetX: number
    let offsetY: number

    if (containerAspect > imageAspect) {
      displayHeight = container.height
      displayWidth = displayHeight * imageAspect
      offsetX = (container.width - displayWidth) / 2
      offsetY = 0
    } else {
      displayWidth = container.width
      displayHeight = displayWidth / imageAspect
      offsetX = 0
      offsetY = (container.height - displayHeight) / 2
    }

    return clicks.map((click, index) => {
      const left = offsetX + click.normalizedX * displayWidth
      const top = offsetY + click.normalizedY * displayHeight

      return (
        <div
          key={index}
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left,
            top,
            color: click.type === "positive" ? "#22c55e" : "#ef4444",
          }}
        >
          <Star className="h-4 w-4 fill-current drop-shadow" />
        </div>
      )
    })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full object-contain cursor-crosshair"
      />

      {renderStars()}

      {!isReady && images.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <p className="text-sm text-muted-foreground">Loading frame…</p>
        </div>
      )}

      {images.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Select a dataset to view
          </p>
        </div>
      )}
    </div>
  )
}
