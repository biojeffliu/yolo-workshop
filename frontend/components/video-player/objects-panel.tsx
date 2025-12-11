"use client"

import * as React from "react"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COCO_CLASSES, getClassColor } from "@/lib/cocos-classes"

interface SegmentObject {
  id: string
  name: string
  className: string
  labelCount: number
  visible: boolean
}

interface ObjectsPanelProps {
  objects: SegmentObject[]
  selectedObjectId: string | null
  onSelectObject: (id: string | null) => void
  onCreateObject: (name: string, className: string) => void
  onDeleteObject: (id: string) => void
  onToggleVisibility: (id: string) => void
}

export function ObjectsPanel({
  objects,
  selectedObjectId,
  onSelectObject,
  onCreateObject,
  onDeleteObject,
  onToggleVisibility,
}: ObjectsPanelProps) {
  const [newObjectName, setNewObjectName] = React.useState("")
  const [newObjectClass, setNewObjectClass] = React.useState<string>("")

  const handleCreate = () => {
    if (newObjectName.trim() && newObjectClass) {
      onCreateObject(newObjectName.trim(), newObjectClass)
      setNewObjectName("")
      setNewObjectClass("")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Objects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new object */}
        <div className="space-y-2">
          <Input
            placeholder="Object name"
            value={newObjectName}
            onChange={(e) => setNewObjectName(e.target.value)}
            className="h-8 text-sm"
          />
          <Select value={newObjectClass} onValueChange={setNewObjectClass}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {COCO_CLASSES.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getClassColor(cls) }} />
                    {cls}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="w-full"
            onClick={handleCreate}
            disabled={!newObjectName.trim() || !newObjectClass}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Object
          </Button>
        </div>

        {/* Objects list */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {objects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No objects created</p>
            ) : (
              objects.map((obj) => (
                <div
                  key={obj.id}
                  className={`p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedObjectId === obj.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => onSelectObject(selectedObjectId === obj.id ? null : obj.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: getClassColor(obj.className) }}
                      />
                      <span className="text-sm font-medium truncate">{obj.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleVisibility(obj.id)
                        }}
                      >
                        {obj.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteObject(obj.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {obj.className}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{obj.labelCount} labels</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}