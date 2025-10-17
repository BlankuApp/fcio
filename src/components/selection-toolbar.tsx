"use client"

import { Button } from "@/components/ui/button"

interface SelectionToolbarProps {
    onSelectAll: () => void
    onDeselectAll: () => void
    onInvertSelection: () => void
    onSelectOnlyNewWords: () => void
    onSelectOnlyExisting: () => void
}

export function SelectionToolbar({
    onSelectAll,
    onDeselectAll,
    onInvertSelection,
    onSelectOnlyNewWords,
    onSelectOnlyExisting,
}: SelectionToolbarProps) {
    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
                Quick selection tools:
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onSelectAll}
                    className="text-xs"
                >
                    Select All
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDeselectAll}
                    className="text-xs"
                >
                    Deselect All
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onInvertSelection}
                    className="text-xs"
                >
                    Invert
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onSelectOnlyNewWords}
                    className="text-xs"
                >
                    New Only
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onSelectOnlyExisting}
                    className="text-xs"
                >
                    Existing Only
                </Button>
            </div>
        </div>
    )
}
