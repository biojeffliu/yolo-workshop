"use client"

import DatasetDirectory from "@/components/datasets/dataset-directory"
import ZipUploader from "@/components/datasets/upload-zip"

export default function DatasetPage(){
  return (
    <div className="mx-auto w-full p-6 space-y-8">
      <ZipUploader />
      <DatasetDirectory />
    </div>
  )
}