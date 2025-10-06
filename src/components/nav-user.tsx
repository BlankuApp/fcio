"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"

import { AuthDialog } from "@/components/auth-dialog"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { getCurrentUserProfile } from "@/lib/user-profile/client-utils"
import { getUserProfileFromStorage, saveUserProfileToStorage, removeUserProfileFromStorage } from "@/lib/user-profile/browser-storage"

interface User {
  name: string
  email: string
  avatar: string
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try to get profile from localStorage first (instant, synchronous)
        const cachedProfile = getUserProfileFromStorage()
        if (cachedProfile) {
          const userData = {
            name: cachedProfile.username || cachedProfile.email?.split('@')[0] || 'User',
            email: cachedProfile.email,
            avatar: '',
          }
          setUser(userData)
          return
        }

        // If no cache, check authentication and fetch profile
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const profile = await getCurrentUserProfile()
          if (profile) {
            const userData = {
              name: profile.username || profile.email?.split('@')[0] || 'User',
              email: profile.email,
              avatar: '',
            }
            setUser(userData)
            saveUserProfileToStorage(profile) // Cache for future loads
          }
        }
      } catch (error) {
        console.error('NavUser: Error loading user:', error)
      }
    }

    loadUser()

    // Listen to auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        removeUserProfileFromStorage()
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    removeUserProfileFromStorage() // Remove profile from localStorage
    setUser(null)
    router.push('/')
    router.refresh()
  }

  // Show login button if user is not authenticated
  if (!user) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => setAuthDialogOpen(true)}
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <LogIn className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Sign In</span>
                <span className="truncate text-xs text-muted-foreground">
                  Access your flashcards
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserCircle />
                <a href="/profile"> Profile</a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}