"use client"

import {
    type LucideIcon,
    ChevronRight,
    Plus,
} from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { listUserDecks } from "@/lib/decks/client-utils"
import { getCurrentUser } from "@/lib/auth/utils"
import type { Deck } from "@/lib/types/deck"

type NavItem = {
    name: string
    url: string
    icon: LucideIcon
}

interface DecksNavProps {
    icon: LucideIcon
}

export function DecksNav({ icon: Icon }: DecksNavProps) {
    const [decks, setDecks] = useState<Deck[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const loadUserAndDecks = async () => {
            try {
                setIsLoading(true)
                setError(null)

                const user = await getCurrentUser()
                if (!user) {
                    setIsAuthenticated(false)
                    setDecks([])
                    setIsLoading(false)
                    return
                }

                setIsAuthenticated(true)

                const userDecks = await listUserDecks(user.id)
                setDecks(userDecks)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load decks")
                setDecks([])
            } finally {
                setIsLoading(false)
            }
        }

        loadUserAndDecks()
    }, [])

    if (!isAuthenticated) {
        return null
    }

    const items: NavItem[] = [
        {
            name: "New Deck",
            url: "/decks",
            icon: Plus,
        },
        ...decks.map((deck) => ({
            name: deck.name,
            url: `/decks/${deck.id}`,
            icon: Icon,
        })),
    ]

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
                <SidebarMenuItem>
                    <Collapsible
                        defaultOpen
                        className="group/collapsible"
                    >
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="Decks" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                                <Icon />
                                <span>Decks</span>
                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {isLoading ? (
                                    <SidebarMenuSubItem>
                                        <div className="text-xs text-muted-foreground px-2 py-1.5">
                                            Loading...
                                        </div>
                                    </SidebarMenuSubItem>
                                ) : error ? (
                                    <SidebarMenuSubItem>
                                        <div className="text-xs text-destructive px-2 py-1.5">
                                            Error loading decks
                                        </div>
                                    </SidebarMenuSubItem>
                                ) : (
                                    items.map((item) => (
                                        <SidebarMenuSubItem key={item.url}>
                                            <SidebarMenuSubButton asChild>
                                                <Link href={item.url}>
                                                    <item.icon />
                                                    <span>{item.name}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))
                                )}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    )
}
