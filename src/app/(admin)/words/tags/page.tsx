import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/server-utils"
import { requireAdmin } from "@/lib/user-profile/server-utils"
import { listTagsServer } from "@/lib/tags"
import { TagsManagementClient } from "@/components/tags-management-client"
import type { Tag } from "@/lib/types/tags"
import { PageHeader } from "@/components/page-header"

/**
 * Server Component: Tags Management Page
 *
 * This page enforces admin access at the server level by:
 * 1. Checking authentication via getCurrentUser()
 * 2. Verifying admin status via requireAdmin()
 * 3. Pre-fetching tags data on the server
 * 4. Rendering the client component with initial data
 */
export default async function TagsManagementPage() {
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

    // Fetch initial tags data server-side for better performance
    let initialTags: Tag[] = []
    try {
        const data = await listTagsServer()
        initialTags = data
    } catch (error) {
        console.error("Error fetching initial tags:", error)
        // Continue with empty list - client will load data
    }

    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { label: "Words", href: "/words/list" },
                    { label: "Tags" }
                ]}
            />
            <TagsManagementClient initialTags={initialTags} userId={user.id} />
        </>
    )
}
