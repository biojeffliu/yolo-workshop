"use client"

import { useState } from "react"
import { useFetchFolders, useDeleteFolder, useRenameFolder, useUpdateDescription, FolderMetadata } from "@/hooks/use-backend"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Play, FileJson, ImageIcon, Loader2, RefreshCw, ChevronDown, Pencil } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"

interface Dataset {
  id: string
  name: string
  folder: string
  uploadedAt: Date
}

export default function DatasetDirectory() {
  // Hooks
  const { folders, folderNames, isLoading, error, refetch } = useFetchFolders()
  const { deleteFolder } = useDeleteFolder()
  const { renameFolder } = useRenameFolder()
  const { updateDescription } = useUpdateDescription()

  // Local State
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [openDatasets, setOpenDatasets] = useState<Set<string>>(new Set())

  const handleStartRename = (folder: FolderMetadata) => {
    setRenamingId(folder.name)
    setRenameValue(folder.name)
  }

  const handleRename = async (oldName: string) => {
    if (!renameValue.trim() || renameValue === oldName) {
      setRenamingId(null)
      return
    }

    const success = await renameFolder(oldName, renameValue.trim())
    if (success) {
      toast.success("Renamed successfully")
      refetch()
    }
    setRenamingId(null)
    setRenameValue("")
  }

  const handleCancelRename = () => {
    setRenamingId(null)
    setRenameValue("")
  }

  const handleDelete = async (folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}"?`)) return

    setDeletingId(folderName)

    const success = await deleteFolder(folderName)

    if (success) {
      toast.success("Folder deleted successfully")
      refetch()
    } else {
      toast.error("Failed to delete folder")
    }

    setDeletingId(null)
  }

  const handleDescriptionChange = (name: string, value: string) => {
    setDescriptions(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveDescription = async (folder: FolderMetadata) => {
    const descriptionToSave = descriptions[folder.name] ?? folder.description ?? ""
    
    const success = await updateDescription(folder.name, descriptionToSave)
    if (success) {
        refetch()
        const newDescs = {...descriptions}
        delete newDescs[folder.name]
        setDescriptions(newDescs)
    }
  }

  const toggleDataset = (name: string) => {
    const newOpen = new Set(openDatasets)
    if (newOpen.has(name)) {
      newOpen.delete(name)
    } else {
      newOpen.add(name)
    }
    setOpenDatasets(newOpen)
  }

  const handleViewInPlayer = (folderName: string) => {
    window.location.href = `/player/${encodeURIComponent(folderName)}`
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>Your Datasets</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading..."
              : `${folders.length} dataset${folders.length === 1 ? "" : "s"} available`}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-full max-h-[600px] min-h-[120px] pr-4">
          {isLoading && folders.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ( 
            <div className="space-y-3">
              {folders.map((folder, index) => (
                <div key={folder.name}>
                  <Collapsible 
                    open={openDatasets.has(folder.name)} 
                    onOpenChange={() => toggleDataset(folder.name)}
                  >
                    <div className="border rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm">
                      
                      {/* --- Row Header (Always Visible) --- */}
                      <div className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  openDatasets.has(folder.name) ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                          </CollapsibleTrigger>

                          {renamingId === folder.name ? (
                            // Rename Mode
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRename(folder.name)
                                  if (e.key === "Escape") handleCancelRename()
                                }}
                                className="h-8"
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleRename(folder.name)}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelRename}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            // Normal Display Mode
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate" title={folder.name}>
                                  {folder.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Uploaded {new Date(folder.upload_date).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-primary"
                                onClick={() => handleStartRename(folder)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Quick Action Button */}
                        <div className="flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleViewInPlayer(folder.name)}>
                            <Play className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                      {/* --- Collapsible Content (Metadata & Details) --- */}
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-4 border-t bg-muted/20">
                          
                          {/* Description Editor */}
                          <div className="space-y-2 pt-4">
                            <Label htmlFor={`description-${folder.name}`}>Description</Label>
                            <Textarea
                              id={`description-${folder.name}`}
                              placeholder="Add a description..."
                              value={descriptions[folder.name] ?? folder.description ?? ""}
                              onChange={(e) => handleDescriptionChange(folder.name, e.target.value)}
                              className="min-h-[80px] resize-none"
                            />
                            <Button size="sm" onClick={() => handleSaveDescription(folder)}>
                              Save Description
                            </Button>
                          </div>

                          {/* Object Stats */}
                          {folder.objects && Object.keys(folder.objects).length > 0 && (
                             <div className="space-y-2">
                                <Label>Objects</Label>
                                <div className="flex gap-2 flex-wrap">
                                  {Object.entries(folder.objects).map(([objId, count]) => (
                                    <span key={objId} className="text-xs bg-background border px-2 py-1 rounded-md text-muted-foreground">
                                      {objId}: {count}
                                    </span>
                                  ))}
                                </div>
                             </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap pt-2">
                            <Button variant="outline" size="sm" onClick={() => console.log("JSON", folder.name)}>
                              <FileJson className="h-4 w-4 mr-1" />
                              JSON
                            </Button>

                            <Button variant="outline" size="sm" onClick={() => console.log("PNGs", folder.name)}>
                              <ImageIcon className="h-4 w-4 mr-1" />
                              PNGs
                            </Button>

                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDelete(folder.name)}
                              disabled={deletingId === folder.name}
                              className="ml-auto"
                            >
                              {deletingId === folder.name ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                  {index < folders.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}