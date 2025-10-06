// Client-side utilities (use in components with "use client")
export {
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    getCurrentUserProfile,
} from './client-utils'

// Server-side utilities (use in Server Components, API routes, Server Actions)
export {
    createUserProfile as createUserProfileServer,
    getUserProfile as getUserProfileServer,
    updateUserProfile as updateUserProfileServer,
    deleteUserProfile as deleteUserProfileServer,
    getCurrentUserProfile as getCurrentUserProfileServer,
    isAdmin as isAdminServer,
    requireAdmin as requireAdminServer,
} from './server-utils'

// Types
export type {
    UserProfile,
    CreateUserProfileData,
    UpdateUserProfileData,
} from '../types/user-profile'