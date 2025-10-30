import { Loader2 } from "lucide-react"

interface AIReviewCardProps {
  review: string | null
  answer?: string
  isLoading: boolean
}

export function AIReviewCard({ review, answer, isLoading }: AIReviewCardProps) {
  if (!review) return null

  return (
    <div className="space-y-3 bg-muted rounded-lg p-4">
      {answer && (
        <div className="space-y-1 pb-3 border-b border-border">
          <p className="text-xs text-muted-foreground">Expected Answer</p>
          <div dir="auto" className="text-sm font-medium leading-relaxed">
            {answer}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">AI Review</p>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs text-muted-foreground">Reviewing...</span>
          </div>
        ) : (
          <div dir="auto" className="text-sm leading-relaxed">
            {review.split("\n").map((line, idx) => {
              if (line.trim() === "") return null
              return (
                <p key={idx} className="whitespace-pre-wrap">
                  {line}
                </p>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
