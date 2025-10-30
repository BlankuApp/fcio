import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AnswerInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
  isDisabled: boolean
  hasReview: boolean
}

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  isDisabled,
  hasReview,
}: AnswerInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !hasReview && value.trim()) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <Input
        placeholder="Type your answer..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled || hasReview}
        className="flex-1"
      />
      {!hasReview && (
        <Button
          onClick={onSubmit}
          disabled={!value.trim() || isLoading || isDisabled}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Reviewing...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      )}
    </div>
  )
}
