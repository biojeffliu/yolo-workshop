"use client"

import * as React from "react"
import { ChevronRight, Database, Folders, Home, Play } from "lucide-react"
import Link from "next/link"
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
            <SidebarMenuButton asChild size="lg">
              <Link href="/" className="flex items-center group-data-[collapsible=icon]:justify-center">
                <img
                  src="/icon.ico"
                  alt="AI Racing Tech"
                  className="h-6 w-6"
                />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">SAM2 Autolabeler</span>
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
                <SidebarMenuButton asChild isActive={pathname === "/datasets"}>
                  <Link href="/datasets">
                    <Database />
                    <span className="whitespace-nowrap">Datasets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Video Player Tab (Expandable) */}
              <Collapsible open={isVideoPlayerOpen} onOpenChange={setIsVideoPlayerOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={pathname.startsWith("/video-player")}>
                      <Play />
                      <span>Video Player</span>
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