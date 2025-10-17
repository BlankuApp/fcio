"use client"

import { Button } from "@/components/ui/button"
import { UploadCloud, X } from "lucide-react"
import { useRef } from "react"

interface JsonlUploadZoneProps {
    onFileUpload: (file: File) => Promise<void>
    uploadedFile: File | null
    onClear: () => void
    isDragActive: boolean
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
}

export function JsonlUploadZone({
    onFileUpload,
    uploadedFile,
    onClear,
    isDragActive,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
}: JsonlUploadZoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await onFileUpload(file)
    }

    return (
        <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative rounded-lg border-2 border-dashed transition-all ${isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                } p-8 text-center cursor-pointer`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".jsonl,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                        <UploadCloud className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-foreground">
                            {uploadedFile ? uploadedFile.name : "Drop your JSONL file here"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {uploadedFile
                                ? `${(uploadedFile.size / 1024).toFixed(2)} KB`
                                : "or click to browse"}
                        </p>
                    </div>
                </div>
            </label>

            {uploadedFile && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="absolute top-3 right-3"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
