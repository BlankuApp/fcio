"use client"

import * as React from "react"
import {
  LibraryBig,
  BotMessageSquare,
  UserCircle,
} from "lucide-react"

import { MainNav } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const main_nav = [
  {
    name: "Decks",
    url: "/decks",
    icon: LibraryBig,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <a href="/" className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors px-2 py-2">
          <BotMessageSquare className="w-5 h-5" />
          <span>AI FlashCards</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <MainNav projects={main_nav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
