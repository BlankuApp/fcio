"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import type { AlertState } from "@/hooks/use-alert"

interface AlertDialogProps extends AlertState {
    onClose: () => void
}

export function AlertDialog({
    isOpen,
    title,
    message,
    type,
    onConfirm,
    onClose,
}: AlertDialogProps) {
    const handleConfirm = () => {
        onConfirm?.()
        onClose()
    }

    const getIcon = () => {
        switch (type) {
            case "error":
                return <AlertCircle className="h-5 w-5 text-red-600" />
            case "success":
                return <CheckCircle2 className="h-5 w-5 text-green-600" />
            default:
                return <Info className="h-5 w-5 text-blue-600" />
        }
    }

    const getHeaderColor = () => {
        switch (type) {
            case "error":
                return "border-b border-red-200 bg-red-50"
            case "success":
                return "border-b border-green-200 bg-green-50"
            default:
                return "border-b border-blue-200 bg-blue-50"
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader className={`pb-3 -mx-6 -mt-6 px-6 pt-6 ${getHeaderColor()}`}>
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                </DialogHeader>
                <DialogDescription className="text-base text-foreground pt-4">
                    {message}
                </DialogDescription>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>
                        {onConfirm ? "Cancel" : "OK"}
                    </Button>
                    {onConfirm && (
                        <Button onClick={handleConfirm}>
                            Confirm
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
