"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { ParsedResult, ParsedResultType } from "@/lib/types/words"

interface ParsedResultsDisplayProps {
    results: ParsedResultType[]
    selectedResults: Set<number>
    onToggleResult: (index: number, checked: boolean) => void
}

/**
 * Get difficulty badge styling based on difficulty level
 */
function getDifficultyBadgeStyles(difficulty: string): string {
    switch (difficulty) {
        case "elementary":
            return "bg-green-100 text-green-800"
        case "intermediate":
            return "bg-blue-100 text-blue-800"
        case "upper-intermediate":
            return "bg-yellow-100 text-yellow-800"
        case "advanced":
            return "bg-orange-100 text-orange-800"
        default:
            return "bg-red-100 text-red-800"
    }
}

/**
 * Result card for valid parsed results
 */
function ParsedResultCard({
    result,
    index,
    selected,
    onToggle,
}: {
    result: ParsedResult
    index: number
    selected: boolean
    onToggle: (checked: boolean) => void
}) {
    return (
        <Card className="mb-2">
            <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={`result-${index}`}
                        checked={selected}
                        onCheckedChange={(checked) => onToggle(checked as boolean)}
                    />
                    <label
                        htmlFor={`result-${index}`}
                        className="text-lg font-light cursor-pointer flex-1"
                    >
                        {result.word} ({result.tokens} tokens)
                    </label>
                    {result.existingWord && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            ⚠️ Existing
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {result.existingWord && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-sm font-semibold text-amber-900 mb-2">
                            Existing word found - will update:
                        </p>
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="text-xs text-amber-700 uppercase tracking-wide font-medium mb-1">
                                    Current collocations:
                                </p>
                                <div className="space-y-2">
                                    {Object.entries(result.existingWord.collocations).map(
                                        ([pattern, collocations]) => (
                                            <div key={pattern}>
                                                <p className="text-xs font-semibold text-muted-foreground">
                                                    {pattern}
                                                </p>
                                                <div className="flex flex-row flex-wrap gap-1">
                                                    {(
                                                        collocations as Array<{
                                                            collocation: string
                                                            difficulty: string
                                                        }>
                                                    ).map((col, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-xs"
                                                        >
                                                            {col.collocation}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                        {result.existingWord ? "New collocations to merge:" : "Collocations:"}
                    </p>
                    <div className="space-y-4">
                        {Object.entries(result.collocations).map(([pattern, collocations]) => (
                            <div key={pattern}>
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                                    {pattern}
                                </h4>
                                <div className="flex flex-row flex-wrap">
                                    {collocations.map((col, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between py-1 px-2 bg-muted/30 rounded text-sm"
                                        >
                                            <span className="font-medium">{col.collocation}</span>
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-medium ml-2 ${getDifficultyBadgeStyles(col.difficulty)}`}
                                            >
                                                {col.difficulty}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Error card for parse errors
 */
function ErrorResultCard({ error, raw }: { error: string; raw: string }) {
    return (
        <Card className="mb-2">
            <CardContent className="pt-4">
                <div className="text-red-500">
                    <p className="font-semibold">{error}</p>
                    <p className="text-xs font-mono mt-1">{raw}</p>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Display all parsed results with error handling
 */
export function ParsedResultsDisplay({
    results,
    selectedResults,
    onToggleResult,
}: ParsedResultsDisplayProps) {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">
                Parsed Results ({results.length} total)
            </h3>
            {results.map((result, index) => (
                <div key={index}>
                    {"error" in result ? (
                        <ErrorResultCard error={result.error} raw={result.raw} />
                    ) : (
                        <ParsedResultCard
                            result={result}
                            index={index}
                            selected={selectedResults.has(index)}
                            onToggle={(checked) => onToggleResult(index, checked)}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}
