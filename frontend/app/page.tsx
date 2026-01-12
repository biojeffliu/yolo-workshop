import Head from "next/head"
import type { AppProps } from "next/app"
import { AppSidebar } from "@/components/app-sidebar"

export default function Page() {
  return (
    
    <div className="min-h-screen bg-background">
      <AppSidebar />
    </div>
  )
}