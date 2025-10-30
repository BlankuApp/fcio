import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DIFFICULTY_OPTIONS,
  type ReviewDifficulty,
} from "@/lib/review/difficulty-options"

interface DifficultySelectorProps {
  selectedDifficulty: ReviewDifficulty | null
  onSelectDifficulty: (difficulty: ReviewDifficulty) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
}

export function DifficultySelector({
  selectedDifficulty,
  onSelectDifficulty,
  onSubmit,
  isLoading,
}: DifficultySelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">How well did you know this?</p>
      <div className="flex gap-2 flex-wrap">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelectDifficulty(option.value)}
            className={cn(
              "p-2 rounded border transition-all flex items-center gap-1.5",
              option.color,
              selectedDifficulty === option.value &&
                "ring-2 ring-offset-1 ring-primary dark:ring-offset-slate-950"
            )}
            disabled={isLoading}
          >
            <span className="text-base">{option.icon}</span>
            <span className="text-xs">{option.label}</span>
          </button>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={!selectedDifficulty || isLoading}
        size="sm"
        className="w-fit"
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⌛</span>
            Submitting...
          </>
        ) : (
          "Submit & Next"
        )}
      </Button>
    </div>
  )
}
