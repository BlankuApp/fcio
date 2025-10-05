import type { TargetLanguage } from "@/lib/constants/languages"
import { createClient } from "@/lib/supabase/server"

/**
 * SERVER-SIDE ONLY: Check if user is authenticated
 * Use this in Server Components, API routes, and Server Actions
 */
export async function checkAuth() {
    const supabase = await createClient()

    try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            console.error('Error checking auth:', error)
            return { isAuthenticated: false, user: null, session: null }
        }

        return {
            isAuthenticated: !!session,
            user: session?.user || null,
            session: session,
        }
    } catch (error) {
        console.error('Error in checkAuth:', error)
        return { isAuthenticated: false, user: null, session: null }
    }
}

/**
 * SERVER-SIDE ONLY: Get current user from Supabase session
 * Use this in Server Components, API routes, and Server Actions
 */
export async function getCurrentUser() {
    const supabase = await createClient()

    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('Error getting user:', error)
            return null
        }

        return user
    } catch (error) {
        console.error('Error in getCurrentUser:', error)
        return null
    }
}

/**
 * SERVER-SIDE ONLY: Check if current user is an admin
 * Use this in Server Components, API routes, and Server Actions
 */
export async function isAdmin() {
    const user = await getCurrentUser()
    return user?.user_metadata?.is_admin === true
}

/**
 * SERVER-SIDE ONLY: Require admin access - throws error if not admin
 * Use this in Server Components or API routes to protect admin-only content
 */
export async function requireAdmin() {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Authentication required')
    }

    if (user.user_metadata?.is_admin !== true) {
        throw new Error('Admin access required')
    }

    return user
}
