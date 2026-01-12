"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { BACKEND_URL } from "@/lib/api"

export default function ZipUploader({ onUploaded }: { onUploaded?: (folder: string) => void }) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith(".zip")) {
      toast.error("Please upload a .zip file")
      return
    }
    const form = new FormData()
    form.append("file", file)

    try {
      toast("Uploading...")
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      toast.success("Upload complete!")

      onUploaded?.(data.folder)
    } catch (err) {
      console.error(err)
      toast.error("Failed to upload ZIP")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/zip": [".zip"] },
    multiple: false,
  })

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-2">
            <CardTitle>Upload Dataset</CardTitle>
            <CardDescription>Upload a ZIP file containing your dataset</CardDescription>
          </div>
      </CardHeader>
        <CardContent>
          <Card className="border border-muted">
            <CardContent
              {...getRootProps()}
              className="relative flex items-center justify-center py-10 cursor-pointer text-center h-40"
            >
              <input {...getInputProps()} />

              <div className="opacity-0 pointer-events-none">
                <p className="text-sm mb-3">placeholder</p>
                <Button variant="secondary">Choose File</Button>
              </div>

              {/* Overlay changes on drag state */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isDragActive ? (
                  <p className="text-sm text-muted-foreground">Drop the ZIP file here</p>
                ) : (
                  <>
                    <p className="text-sm mb-3 text-muted-foreground">
                      Drag & drop a ZIP file, or click to upload
                    </p>
                    <Button variant="secondary">Choose File</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
    </Card>
  )
}