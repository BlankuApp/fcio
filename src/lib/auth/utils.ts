import type { TargetLanguage } from "@/lib/constants/languages"
import { createClient } from "@/lib/supabase/client"

/**
 * Check if user is authenticated by checking Supabase session
 * This checks for JWT tokens stored in cookies
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
 * Get current user from Supabase session
 */
export async function getCurrentUser() {
    const supabase = createClient()

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
