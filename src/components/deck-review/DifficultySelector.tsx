import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card className="border-primary/20">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <CardTitle className="text-lg">How well did you know this?</CardTitle>
            <CardDescription>
              Select based on how easy it was to recall the answer
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectDifficulty(option.value)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-center space-y-2 flex flex-col items-center justify-center font-medium",
                option.color,
                selectedDifficulty === option.value &&
                  "ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-950 shadow-md"
              )}
              disabled={isLoading}
            >
              <div className="text-2xl">{option.icon}</div>
              <div className="font-semibold text-sm">{option.label}</div>
              <div className="text-xs opacity-70 leading-tight">
                {option.description}
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={onSubmit}
          disabled={!selectedDifficulty || isLoading}
          className="w-full mt-6 py-6 text-base font-semibold"
          size="lg"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⌛</span>
              Submitting...
            </>
          ) : (
            "✓ Submit & Next Card"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
