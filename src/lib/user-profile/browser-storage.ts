import type { UserProfile } from "@/lib/types/user-profile"

const USER_PROFILE_KEY = 'fcio_user_profile'

/**
 * Save user profile to browser localStorage
 */
export function saveUserProfileToStorage(profile: UserProfile): void {
    try {
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
    } catch (error) {
        console.error('Failed to save user profile to localStorage:', error)
    }
}

/**
 * Get user profile from browser localStorage
 */
export function getUserProfileFromStorage(): UserProfile | null {
    try {
        const stored = localStorage.getItem(USER_PROFILE_KEY)
        if (!stored) {
            return null
        }
        const profile = JSON.parse(stored) as UserProfile
        return profile
    } catch (error) {
        console.error('Failed to load user profile from localStorage:', error)
        return null
    }
}

/**
 * Remove user profile from browser localStorage
 */
export function removeUserProfileFromStorage(): void {
    try {
        localStorage.removeItem(USER_PROFILE_KEY)
    } catch (error) {
        console.error('Failed to remove user profile from localStorage:', error)
    }
}

/**
 * Check if user profile exists in browser localStorage
 */
export function hasUserProfileInStorage(): boolean {
    try {
        return localStorage.getItem(USER_PROFILE_KEY) !== null
    } catch (error) {
        console.error('Failed to check user profile in localStorage:', error)
        return false
    }
}
