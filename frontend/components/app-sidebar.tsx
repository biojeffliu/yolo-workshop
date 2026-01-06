"use client"

import * as React from "react"
import { ChevronRight, Database, Play, Layers, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useFetchFolders } from "@/hooks/use-backend"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"

export function AppSidebar() {
  const pathname = usePathname()
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = React.useState(false)

  const { folders, folderNames, isLoading, error } = useFetchFolders()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Home" size="lg" asChild>
              <Link href="/" className="flex w-full items-center group-data-[collapsible=icon]:justify-center">
                <Image
                  src="/icon.ico"
                  alt="AI Racing Tech"
                  className="h-6 w-6"
                />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">YOLO Workshop</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dataset Tab */}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Datasets" asChild isActive={pathname === "/datasets"}>
                  <Link href="/datasets">
                    <Database />
                    <span className="whitespace-nowrap overflow-hidden">Datasets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Video Player Tab (Expandable) */}
              <Collapsible open={isVideoPlayerOpen} onOpenChange={setIsVideoPlayerOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Video Player" isActive={pathname.startsWith("/video-player")}>
                      <Play />
                      <span className="whitespace-nowrap overflow-hidden">Video Player</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                  <SidebarMenuSub>

                    {isLoading && (
                      <SidebarMenuSubItem>
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Loading folders...
                        </div>
                      </SidebarMenuSubItem>
                    )}

                    {error && (
                      <SidebarMenuSubItem>
                        <div className="px-2 py-1.5 text-sm text-red-500">
                          Failed to load folders
                        </div>
                      </SidebarMenuSubItem>
                    )}

                    {!isLoading && !error && folders.length > 0 ? (
                      folders.map((folder) => (
                        <SidebarMenuSubItem key={folder.name}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `/player/${folder.name}`}
                          >
                            <Link href={`/player/${folder.name}`}>
                              {folder.name}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))
                    ) : null}

                    {!isLoading && !error && folders.length === 0 && (
                      <SidebarMenuSubItem>
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No folders found
                        </div>
                      </SidebarMenuSubItem>
                    )}

                  </SidebarMenuSub>
                </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Model Registry" asChild isActive={pathname === "/models"}>
                  <Link href="/models">
                    <Layers />
                    <span className="whitespace-nowrap overflow-hidden">Model Registry</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Fine Tune" asChild isActive={pathname === "/finetune"}>
                  <Link href="/finetune">
                    <Sparkles />
                    <span className="whitespace-nowrap overflow-hidden">Fine Tune</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">v1.0.0 AI Racing Tech</p>
      </SidebarFooter>
    </Sidebar>
  )
}