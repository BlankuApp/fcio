import type { TargetLanguage } from "@/lib/constants/languages"
import type { DefaultPrompts } from "@/lib/constants/default-prompts"

export interface UserProfile {
    id: string
    email: string
    username: string
    mother_tongues: string[]
    target_languages: TargetLanguage[]
    prompts: DefaultPrompts
    is_admin: boolean
    created_at: string
    updated_at: string
}

export interface CreateUserProfileData {
    id: string
    email: string
    username: string
    mother_tongues: string[]
    target_languages: TargetLanguage[]
    prompts?: DefaultPrompts
    is_admin?: boolean
}

export interface UpdateUserProfileData {
    username?: string
    mother_tongues?: string[]
    target_languages?: TargetLanguage[]
    prompts?: DefaultPrompts
    is_admin?: boolean
}