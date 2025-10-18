/**
 * Tests for src/lib/auth/utils.ts
 * TIER 2 HIGH: Authentication & Authorization
 */

import { describe, it, expect, vi } from "vitest"
import { createClient } from "@/lib/supabase/client"
import * as authUtils from "@/lib/auth/utils"

// Mock the Supabase client
vi.mock("@/lib/supabase/client")

// Mock user profile utilities
vi.mock("@/lib/user-profile/client-utils")

describe("checkAuth", () => {
    it("should return authenticated state with session", async () => {
        const mockSession = {
            user: { id: "user-1", email: "test@example.com" },
            access_token: "token",
        }

        const mockQueryBuilder = {
            getSession: vi.fn().mockResolvedValue({
                data: { session: mockSession },
                error: null,
            }),
        }

        const mockSupabase = {
            auth: mockQueryBuilder,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.checkAuth()

        expect(result.isAuthenticated).toBe(true)
        expect(result.user).toEqual(mockSession.user)
        expect(result.session).toEqual(mockSession)
    })

    it("should return unauthenticated state without session", async () => {
        const mockQueryBuilder = {
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: null,
            }),
        }

        const mockSupabase = {
            auth: mockQueryBuilder,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.checkAuth()

        expect(result.isAuthenticated).toBe(false)
        expect(result.user).toBeNull()
        expect(result.session).toBeNull()
    })

    it("should handle session errors gracefully", async () => {
        const mockQueryBuilder = {
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: { message: "Session error" },
            }),
        }

        const mockSupabase = {
            auth: mockQueryBuilder,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.checkAuth()

        expect(result.isAuthenticated).toBe(false)
        expect(result.user).toBeNull()
        expect(result.session).toBeNull()
    })

    it("should handle exceptions gracefully", async () => {
        const mockQueryBuilder = {
            getSession: vi.fn().mockRejectedValue(new Error("Network error")),
        }

        const mockSupabase = {
            auth: mockQueryBuilder,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.checkAuth()

        expect(result.isAuthenticated).toBe(false)
        expect(result.user).toBeNull()
        expect(result.session).toBeNull()
    })
})

describe("getCurrentUser", () => {
    it("should return current user from session", async () => {
        const mockUser = { id: "user-1", email: "test@example.com" }
        const mockSession = { user: mockUser, access_token: "token" }

        const mockQueryBuilder = {
            getSession: vi.fn().mockResolvedValue({
                data: { session: mockSession },
                error: null,
            }),
        }

        const mockSupabase = {
            auth: mockQueryBuilder,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.getCurrentUser()

        expect(result).toEqual(mockUser)
    })

    it("should return null when no session", async () => {
        const mockQueryBuilder = {
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: null,
            }),
        }

        const mockSupabase = {
            auth: mockQueryBuilder,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.getCurrentUser()

        expect(result).toBeNull()
    })

    it("should return null on error", async () => {
        const mockQueryBuilder = {
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: { message: "Error" },
            }),
        }

        const mockSupabase = {
            auth: mockQueryBuilder,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.getCurrentUser()

        expect(result).toBeNull()
    })

    it("should handle exceptions gracefully", async () => {
        const mockQueryBuilder = {
            getSession: vi.fn().mockRejectedValue(new Error("Connection error")),
        }

        const mockSupabase = {
            auth: mockQueryBuilder,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.getCurrentUser()

        expect(result).toBeNull()
    })
})

describe("signIn", () => {
    it("should sign in user with valid credentials", async () => {
        const mockUser = { id: "user-1", email: "test@example.com" }
        const mockData = { user: mockUser, session: { access_token: "token" } }

        const mockAuth = {
            signInWithPassword: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
            }),
        }

        const mockSupabase = {
            auth: mockAuth,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.signIn("test@example.com", "password123")

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockData)
        expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "password123",
        })
    })

    it("should return error on invalid credentials", async () => {
        const mockAuth = {
            signInWithPassword: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Invalid login credentials" },
            }),
        }

        const mockSupabase = {
            auth: mockAuth,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.signIn("test@example.com", "wrongpassword")

        expect(result.success).toBe(false)
        expect(result.error).toBe("Invalid login credentials")
    })

    it("should return error on sign in failure", async () => {
        const mockAuth = {
            signInWithPassword: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Too many login attempts" },
            }),
        }

        const mockSupabase = {
            auth: mockAuth,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.signIn("test@example.com", "password")

        expect(result.success).toBe(false)
        expect(result.error).toBe("Too many login attempts")
    })
})

describe("signOut", () => {
    it("should sign out user successfully", async () => {
        const mockAuth = {
            signOut: vi.fn().mockResolvedValue({
                error: null,
            }),
        }

        const mockSupabase = {
            auth: mockAuth,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.signOut()

        expect(result.success).toBe(true)
        expect(mockAuth.signOut).toHaveBeenCalled()
    })

    it("should return error object on sign out failure", async () => {
        const mockAuth = {
            signOut: vi.fn().mockResolvedValue({
                error: { message: "Sign out failed" },
            }),
        }

        const mockSupabase = {
            auth: mockAuth,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await authUtils.signOut()

        expect(result.success).toBe(false)
        expect(result.error).toBe("Sign out failed")
    })
})
