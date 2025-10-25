import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/server-utils"
import { requireAdmin } from "@/lib/user-profile/server-utils"
import { listWords } from "@/lib/words/server-utils"
import { WordsListClient } from "@/components/words-list-client"
import type { Word } from "@/lib/types/words"
import { PageHeader } from "@/components/page-header"

/**
 * Server Component: Words List Page
 * 
 * This page enforces admin access at the server level by:
 * 1. Checking authentication via getCurrentUser()
 * 2. Verifying admin status via requireAdmin()
 * 3. Pre-fetching words data on the server
 * 4. Rendering the client component with initial data
 * 
 * This provides defense-in-depth security beyond middleware protection.
 */
export default async function WordsListPage() {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
        redirect("/")
    }

    // Check admin access - throws if not admin
    try {
        await requireAdmin()
    } catch {
        redirect("/")
    }

    // Fetch initial words data server-side for better performance
    let initialWords: Word[] = []
    try {
        const data = await listWords()
        initialWords = data
    } catch (error) {
        console.error("Error fetching initial words:", error)
        // Continue with empty list - client will load data
    }

    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { label: "Words", href: "/words/list" },
                    { label: "List" }
                ]}
            />
            <WordsListClient initialWords={initialWords} />
        </>
    )
}
