"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import type { JobStatus } from "@/lib/finetune-types"

interface JobStatusBadgeProps {
  status: JobStatus
  className?: string
}

const statusConfig: Record<
  JobStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  queued: {
    label: "Queued",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  running: {
    label: "Running",
    variant: "default",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    label: "Completed",
    variant: "outline",
    icon: <CheckCircle className="h-3 w-3 text-green-500" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "secondary",
    icon: <AlertCircle className="h-3 w-3" />,
  },
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={className}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </Badge>
  )
}