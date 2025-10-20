import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

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
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <span className="text-lg">✏️</span>
          </div>
          <div>
            <CardTitle>Your Answer</CardTitle>
            <CardDescription>Type your response below</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Share your answer here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled || hasReview}
          className="min-h-[120px] resize-none border-primary/20 focus:border-primary/50"
        />
        {!hasReview && (
          <Button
            onClick={onSubmit}
            disabled={!value.trim() || isLoading || isDisabled}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reviewing...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
