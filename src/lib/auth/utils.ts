import type { TargetLanguage } from "@/lib/constants/languages"
import { createClient } from "@/lib/supabase/client"
import { createUserProfile, getCurrentUserProfile } from "@/lib/user-profile/client-utils"

/**
 * CLIENT-SIDE ONLY: Check if user is authenticated by checking Supabase session
 * Use this in Client Components (components with "use client" directive)
 * For Server Components, use checkAuth from @/lib/auth/server-utils instead
 */
export async function checkAuth() {
    console.log('checkAuth: Checking authentication status')
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
    console.log('signIn: Starting sign in process')
    const supabase = createClient()

    console.log('signIn: Calling signInWithPassword...')
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    console.log('signIn: Result received:', { success: !error, error: error?.message })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

/**
 * Sign up with email and password
 * Creates user in auth.users and corresponding profile in user_profiles table
 */
export async function signUp(
    email: string,
    password: string,
    username?: string,
    motherTongues?: string | string[],
    targetLanguages?: TargetLanguage[]
) {
    const supabase = createClient()

    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError) {
        return { success: false, error: authError.message }
    }

    // If user was created successfully, create the profile
    if (authData.user) {
        try {
            await createUserProfile({
                id: authData.user.id,
                email: email,
                username: username || '',
                mother_tongues: Array.isArray(motherTongues) ? motherTongues : motherTongues ? [motherTongues] : [],
                target_languages: targetLanguages || [],
            })
        } catch (profileError) {
            console.error('Failed to create user profile:', profileError)
            // Note: The auth user was already created, so we don't return an error here
            // The profile can be created later if needed
        }
    }

    return { success: true, data: authData }
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
 * For Server Components, use isAdmin from @/lib/user-profile/server-utils instead
 */
export async function isAdmin() {
    const profile = await getCurrentUserProfile()
    return profile?.is_admin === true
}

/**
 * Require admin access - throws error if not admin
 * Use this in Client Components to protect admin-only content
 */
export async function requireAdmin() {
    const profile = await getCurrentUserProfile()

    if (!profile) {
        throw new Error('Authentication required')
    }

    if (!profile.is_admin) {
        throw new Error('Admin access required')
    }

    return profile
}
