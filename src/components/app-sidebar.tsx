"use client"

import {
  BotMessageSquare,
  LibraryBig,
  Shield,
  TypeOutline,
  UploadCloud,
  DownloadCloud,
  Plus
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { MainNav } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { isAdmin } from "@/lib/auth/utils"

type NavItem = {
  name: string
  url: string
  icon: typeof LibraryBig
  items?: NavItem[]
}

const main_nav: NavItem[] = [
  {
    name: "Decks",
    url: "/decks",
    icon: LibraryBig,
  },
]

const wordsSubNav: NavItem[] = [
  {
    name: "Add",
    url: "/words/add",
    icon: Plus,
  },
  {
    name: "Generate JSONL",
    url: "/words/generate",
    icon: DownloadCloud,
  },
  {
    name: "Upload Results",
    url: "/words/upload",
    icon: UploadCloud,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isAdminUser, setIsAdminUser] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isAdmin()
        setIsAdminUser(adminStatus)
      } catch {
        // Silently fail - user is not admin or not logged in
        setIsAdminUser(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  const navItems = React.useMemo(() => {
    const items = [...main_nav]
    if (isAdminUser) {
      items.push({
        name: "Admin",
        url: "/admin",
        icon: Shield,
      })
      items.push({
        name: "Words",
        url: "/words/batch",
        icon: TypeOutline,
        items: wordsSubNav,
      })
    }
    return items
  }, [isAdminUser])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors px-2 py-2">
          <BotMessageSquare className="w-5 h-5" />
          <span>AI FlashCards</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {!isLoading && <MainNav projects={navItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
