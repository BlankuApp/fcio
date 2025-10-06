import { createClient } from "@/lib/supabase/server"
import type { CreateUserProfileData, UpdateUserProfileData, UserProfile } from "@/lib/types/user-profile"

/**
 * SERVER-SIDE: Create a new user profile in the database
 */
export async function createUserProfile(profileData: CreateUserProfileData) {
    const supabase = await createClient()

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
 * SERVER-SIDE: Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createClient()

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
 * SERVER-SIDE: Update user profile
 */
export async function updateUserProfile(userId: string, updates: UpdateUserProfileData): Promise<UserProfile> {
    const supabase = await createClient()

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
 * SERVER-SIDE: Delete user profile
 */
export async function deleteUserProfile(userId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

    if (error) {
        throw new Error(`Failed to delete user profile: ${error.message}`)
    }
}

/**
 * SERVER-SIDE: Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
        return null
    }

    return getUserProfile(user.id)
}

/**
 * SERVER-SIDE: Check if user is admin from profile table
 */
export async function isAdmin(userId?: string): Promise<boolean> {
    const supabase = await createClient()

    let targetUserId = userId
    if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false
        targetUserId = user.id
    }

    const profile = await getUserProfile(targetUserId)
    return profile?.is_admin === true
}

/**
 * SERVER-SIDE: Require admin access - throws error if not admin
 */
export async function requireAdmin(userId?: string): Promise<UserProfile> {
    const supabase = await createClient()

    let targetUserId = userId
    if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error('Authentication required')
        }
        targetUserId = user.id
    }

    const profile = await getUserProfile(targetUserId)
    if (!profile) {
        throw new Error('User profile not found')
    }

    if (!profile.is_admin) {
        throw new Error('Admin access required')
    }

    return profile
}