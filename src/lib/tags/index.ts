// Client-side utilities
export {
    createTag,
    getTagById,
    getTagByName,
    listTags,
    updateTag,
    deleteTag,
    addTagToWord,
    removeTagFromWord,
    getTagsForWord,
    bulkAddTagsToWords,
} from './client-utils'

// Server-side utilities
export {
    createTag as createTagServer,
    getTagById as getTagByIdServer,
    getTagByName as getTagByNameServer,
    listTags as listTagsServer,
    updateTag as updateTagServer,
    deleteTag as deleteTagServer,
} from './server-utils'

// Types
export type { Tag, CreateTagInput, UpdateTagInput, ListTagsOptions } from '@/lib/types/tags'

