/**
 * Utility functions for file downloads
 */

/**
 * Downloads JSONL content as a file
 */
export function downloadAsJsonl(content: string, filename: string): void {
    const blob = new Blob([content], { type: "application/jsonl" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    try {
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
    } finally {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }
}

/**
 * Gets the line count of JSONL content
 */
export function getJsonlLineCount(content: string): number {
    return content.split("\n").filter((line) => line.trim()).length
}
