import { createClient } from "@/lib/supabase/client"
import type { CreateUserProfileData, UpdateUserProfileData, UserProfile } from "@/lib/types/user-profile"

/**
 * CLIENT-SIDE: Create a new user profile in the database
 */
export async function createUserProfile(profileData: CreateUserProfileData) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('user_profiles')
        .insert({
            id: profileData.id,
            email: profileData.email,
            username: profileData.username,
            mother_tongues: profileData.mother_tongues,
            target_languages: profileData.target_languages,
            is_admin: profileData.is_admin || false,
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create user profile: ${error.message}`)
    }

    return data as UserProfile
}

/**
 * CLIENT-SIDE: Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows found
            return null
        }
        throw new Error(`Failed to get user profile: ${error.message}`)
    }

    return data as UserProfile
}

/**
 * CLIENT-SIDE: Update user profile
 */
export async function updateUserProfile(userId: string, updates: UpdateUserProfileData): Promise<UserProfile> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('user_profiles')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update user profile: ${error.message}`)
    }

    return data as UserProfile
}

/**
 * CLIENT-SIDE: Delete user profile
 */
export async function deleteUserProfile(userId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

    if (error) {
        throw new Error(`Failed to delete user profile: ${error.message}`)
    }
}

/**
 * CLIENT-SIDE: Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
    const supabase = createClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
        return null
    }

    return getUserProfile(session.user.id)
}