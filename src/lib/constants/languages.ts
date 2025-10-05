/**
 * Dictionary of frequently used languages for the application
 * Used for selecting mother tongue during signup
 */

export interface Language {
    code: string
    name: string
    nativeName: string
}

export interface ProficiencyLevel {
    value: string
    label: string
    description: string
}

export interface TargetLanguage {
    languageCode: string
    proficiency: string
}

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
    {
        value: "elementary",
        label: "Elementary",
        description: "Basic words and phrases",
    },
    {
        value: "intermediate",
        label: "Intermediate",
        description: "Can handle everyday situations",
    },
    {
        value: "upper_intermediate",
        label: "Upper Intermediate",
        description: "Comfortable in most situations",
    },
    {
        value: "advanced",
        label: "Advanced",
        description: "Fluent with minor gaps",
    },
    {
        value: "native",
        label: "Native",
        description: "Native speaker level",
    },
]

export const LANGUAGES: Language[] = [
    {
        code: "en",
        name: "English",
        nativeName: "English",
    },
    {
        code: "ja",
        name: "Japanese",
        nativeName: "日本語",
    },
    {
        code: "fa",
        name: "Persian",
        nativeName: "فارسی",
    },
    {
        code: "ar",
        name: "Arabic",
        nativeName: "العربية",
    },
    {
        code: "hi",
        name: "Hindi",
        nativeName: "हिन्दी",
    },
    {
        code: "my",
        name: "Myanmar (Burmese)",
        nativeName: "မြန်မာ",
    },
    {
        code: "es",
        name: "Spanish",
        nativeName: "Español",
    },
    {
        code: "fr",
        name: "French",
        nativeName: "Français",
    },
    {
        code: "de",
        name: "German",
        nativeName: "Deutsch",
    },
    {
        code: "zh",
        name: "Chinese (Mandarin)",
        nativeName: "中文",
    },
    {
        code: "ko",
        name: "Korean",
        nativeName: "한국어",
    },
    {
        code: "pt",
        name: "Portuguese",
        nativeName: "Português",
    },
    {
        code: "ru",
        name: "Russian",
        nativeName: "Русский",
    },
    {
        code: "it",
        name: "Italian",
        nativeName: "Italiano",
    },
    {
        code: "tr",
        name: "Turkish",
        nativeName: "Türkçe",
    },
]

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): Language | undefined {
    return LANGUAGES.find((lang) => lang.code === code)
}

/**
 * Get language display name (includes both English and native name)
 */
export function getLanguageDisplayName(lang: Language): string {
    return lang.name === lang.nativeName
        ? lang.name
        : `${lang.name} (${lang.nativeName})`
}
