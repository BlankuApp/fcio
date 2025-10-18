/**
 * Supabase client mocks for testing
 */

import { vi } from "vitest"
import type { Session, User } from "@supabase/supabase-js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMockSupabaseClient = (): any => {
    const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    return {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
            signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            onAuthStateChange: vi.fn(),
        },
    }
}

export const createMockUser = (overrides?: Partial<User>): User => {
    return {
        id: "test-user-id",
        aud: "authenticated",
        email: "test@example.com",
        phone: "",
        confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: "authenticated",
        ...overrides,
    }
}

export const createMockSession = (user?: User): Session => {
    return {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_at: Date.now() + 1000 * 60 * 60,
        expires_in: 3600,
        token_type: "bearer",
        user: user || createMockUser(),
    }
}

export const mockSupabaseError = (message: string) => {
    return {
        message,
        code: "PGRST001",
        details: "",
        hint: "",
    }
}

export const PGRST_ERRORS = {
    NOT_FOUND: "No rows found",
    UNIQUE_VIOLATION: "duplicate key value violates unique constraint",
    FOREIGN_KEY_VIOLATION: "insert or update on table violates foreign key constraint",
    QUERY_TIMEOUT: "Query Timeout",
    UNDEFINED_TABLE: "relation does not exist",
}
