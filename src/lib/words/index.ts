/**
 * Words library - consolidated exports
 * 
 * Use server-side methods in Server Components and API routes:
 *   import { getWordByIdServer, createWordServer } from '@/lib/words'
 * 
 * Use client-side methods in "use client" components:
 *   import { getWordById, createWord } from '@/lib/words'
 */

// Types
export type { Word, CreateWordInput, UpdateWordInput, ListWordsOptions, Collocation, CollocationsPattern } from "@/lib/types/words"

// Server-side methods (with "Server" suffix for clarity)
export {
    createWord as createWordServer,
    getWordById as getWordByIdServer,
    getWordByLemmaAndLang as getWordByLemmaAndLangServer,
    listWords as listWordsServer,
    getWordsByLanguage as getWordsByLanguageServer,
    updateWord as updateWordServer,
    deleteWord as deleteWordServer,
    deleteWordByLemmaAndLang as deleteWordByLemmaAndLangServer,
    bulkCreateWords as bulkCreateWordsServer,
    upsertWord as upsertWordServer,
    searchWords as searchWordsServer,
    getAvailableLanguages as getAvailableLanguagesServer,
    countWordsByLanguage as countWordsByLanguageServer,
    getTotalWordCount as getTotalWordCountServer,
} from "@/lib/words/server-utils"

// Client-side methods (imported normally, no suffix needed)
// Re-export from client utils if using client-side operations:
// export { ... } from "@/lib/words/client-utils"
