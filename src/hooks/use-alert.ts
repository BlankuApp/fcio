/**
 * Hook for managing alert/dialog state in a more UX-friendly way
 */

import { useState } from "react"

export interface AlertState {
    isOpen: boolean
    title: string
    message: string
    type: "info" | "success" | "error"
    onConfirm?: () => void
}

export function useAlert() {
    const [alert, setAlert] = useState<AlertState>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
    })

    const showAlert = (
        message: string,
        type: "info" | "success" | "error" = "info",
        title?: string,
        onConfirm?: () => void
    ) => {
        setAlert({
            isOpen: true,
            title: title || (type === "error" ? "Error" : type === "success" ? "Success" : "Information"),
            message,
            type,
            onConfirm,
        })
    }

    const closeAlert = () => {
        setAlert({ ...alert, isOpen: false })
    }

    return {
        alert,
        showAlert,
        closeAlert,
    }
}
