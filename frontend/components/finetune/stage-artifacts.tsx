"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, Weight, Box, Cpu, RotateCcw, Check, Clock } from "lucide-react"
import { FineTuneJob } from "@/lib/finetune-types"

interface StageArtifactsProps {
  job: FineTuneJob
  onExportTensorRT: () => void
  onNewJob: () => void
  isExporting: boolean
}

export function StageArtifacts({
  job,
  onExportTensorRT,
  onNewJob,
  isExporting
}: StageArtifactsProps) {
  const handleDownload = (path: string | undefined) => {
    
  }
}