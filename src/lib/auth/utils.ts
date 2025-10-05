import type { TargetLanguage } from "@/lib/constants/languages"
import { createClient } from "@/lib/supabase/client"

/**
 * CLIENT-SIDE ONLY: Check if user is authenticated by checking Supabase session
 * Use this in Client Components (components with "use client" directive)
 * For Server Components, use checkAuth from @/lib/auth/server-utils instead
 */
export async function checkAuth() {
    const supabase = createClient()

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
 * CLIENT-SIDE ONLY: Get current user from Supabase session
 * Use this in Client Components (components with "use client" directive)
 * For Server Components, use getCurrentUser from @/lib/auth/server-utils instead
 */
export async function getCurrentUser() {
    const supabase = createClient()

    try {
        // Use getSession instead of getUser to avoid AuthSessionMissingError
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            console.error('Error getting session:', error)
            return null
        }

        return session?.user || null
    } catch (error) {
        console.error('Error in getCurrentUser:', error)
        return null
    }
}



/**
 * Sign in with email and password
 * Credentials are automatically saved to cookies by Supabase
 */
export async function signIn(email: string, password: string) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

/**
 * Sign up with email and password
 * Credentials are automatically saved to cookies by Supabase
 */
export async function signUp(
    email: string,
    password: string,
    username?: string,
    motherTongues?: string | string[],
    targetLanguages?: TargetLanguage[]
) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
                mother_tongue: Array.isArray(motherTongues) ? motherTongues : motherTongues ? [motherTongues] : [],
                target_languages: targetLanguages || [],
            },
        },
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

/**
 * Sign out user
 * Clears all session cookies
 */
export async function signOut() {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

/** 
 * CLIENT-SIDE ONLY: Check if current user is an admin
 * Use this in Client Components (components with "use client" directive)
 * For Server Components, use isAdmin from @/lib/auth/server-utils instead
 */
export async function isAdmin() {
    const user = await getCurrentUser()
    return user?.user_metadata?.is_admin === true
}

/**
 * Require admin access - throws error if not admin
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
