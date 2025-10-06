"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
import { checkAuth } from "@/lib/auth/utils"
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
    // Check for existing session on mount
    const checkInitialSession = () => {
      try {
        // Try to get profile from localStorage first (instant, synchronous)
        const cachedProfile = getUserProfileFromStorage()
        if (cachedProfile) {
          console.log('NavUser: Using cached profile from localStorage (instant load)')
          const userData = {
            name: cachedProfile.username || cachedProfile.email?.split('@')[0] || 'User',
            email: cachedProfile.email,
            avatar: '',
          }
          setUser(userData)
          // Note: onAuthStateChange listener will verify the session in background
          // and update the UI if the session is invalid or expired
        }
        // If no cache, do nothing - onAuthStateChange will handle initial session check
        // This avoids an unnecessary API call on every page load
      } catch (error) {
        console.error('NavUser: Error checking initial session:', error)
      }
    }

    checkInitialSession()

    // Subscribe to auth changes - this will handle both initial load and auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('NavUser: Auth state changed:', event, session?.user?.email)
      
      if (session?.user) {
        console.log('NavUser: Processing signed in user...')
        
        // Always create user data from session first (guaranteed to work)
        const fallbackUserData = {
          name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatar: '',
        }
        
        // Set the fallback data immediately to ensure UI updates
        console.log('NavUser: Setting fallback user data immediately:', fallbackUserData)
        setUser(fallbackUserData)
        
        try {
          // Try to get profile from database to enhance the data (with timeout)
          console.log('NavUser: Fetching user profile...')
          
          const profilePromise = getCurrentUserProfile()
          const timeoutPromise = new Promise<null>((resolve) => 
            setTimeout(() => {
              console.log('NavUser: Profile fetch timeout')
              resolve(null)
            }, 3000) // 3 second timeout
          )
          
          const profile = await Promise.race([profilePromise, timeoutPromise])
          console.log('NavUser: Profile result:', profile)
          
          if (profile) {
            const userData = {
              name: profile.username || fallbackUserData.name,
              email: profile.email,
              avatar: '',
            }
            console.log('NavUser: Setting enhanced user data from profile:', userData)
            setUser(userData)
            
            // Save profile to localStorage for future use
            saveUserProfileToStorage(profile)
          }
          // If profile is null (timeout or no profile), we keep the fallback data that's already set
        } catch (error) {
          console.error('Error fetching user profile in auth change:', error)
          // Fallback data is already set, so no need to do anything
        }
      } else {
        console.log('NavUser: No session, setting user to null')
        setUser(null)
      }
    })

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
