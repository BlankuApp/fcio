import { createClient } from "@/lib/supabase/server"
import type { CreateUserProfileData } from "@/lib/types/user-profile"

/**
 * SERVER-SIDE: Migrate user from auth metadata to profile table
 * This function can be used to migrate existing users to the new profile system
 */
export async function migrateUserToProfile(userId: string): Promise<boolean> {
    const supabase = await createClient()

    try {
        // Get user from auth
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)
        
        if (authError || !user) {
            console.error('Failed to get user from auth:', authError)
            return false
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', userId)
            .single()

        if (existingProfile) {
            console.log('Profile already exists for user:', userId)
            return true
        }

        // Create profile from auth metadata
        const profileData: CreateUserProfileData = {
            id: user.id,
            email: user.email || '',
            username: user.user_metadata?.username || '',
            mother_tongues: Array.isArray(user.user_metadata?.mother_tongue) 
                ? user.user_metadata.mother_tongue 
                : user.user_metadata?.mother_tongue 
                    ? [user.user_metadata.mother_tongue] 
                    : [],
            target_languages: user.user_metadata?.target_languages || [],
            is_admin: user.user_metadata?.is_admin === true,
        }

        const { error: insertError } = await supabase
            .from('user_profiles')
            .insert(profileData)

        if (insertError) {
            console.error('Failed to create profile:', insertError)
            return false
        }

        console.log('Successfully migrated user to profile table:', userId)
        return true
    } catch (error) {
        console.error('Error migrating user to profile:', error)
        return false
    }
}

/**
 * SERVER-SIDE: Migrate all users from auth metadata to profile table
 * This function migrates all existing users to the new profile system
 */
export async function migrateAllUsersToProfiles(): Promise<{ success: number; failed: number }> {
    const supabase = await createClient()
    let success = 0
    let failed = 0

    try {
        // Get all users (this requires service role key)
        const { data: { users }, error } = await supabase.auth.admin.listUsers()

        if (error) {
            console.error('Failed to list users:', error)
            return { success: 0, failed: 0 }
        }

        for (const user of users) {
            const migrated = await migrateUserToProfile(user.id)
            if (migrated) {
                success++
            } else {
                failed++
            }
        }

        console.log(`Migration complete: ${success} successful, ${failed} failed`)
        return { success, failed }
    } catch (error) {
        console.error('Error during batch migration:', error)
        return { success, failed }
    }
}