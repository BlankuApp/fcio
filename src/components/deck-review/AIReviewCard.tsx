import { Loader2 } from "lucide-react"

interface AIReviewCardProps {
  review: string | null
  answer?: string
  isLoading: boolean
}

export function AIReviewCard({ review, answer, isLoading }: AIReviewCardProps) {
  // Don't show anything if there's no review and not loading
  if (!review && !isLoading) return null

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
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">AI Review</p>
          {isLoading && review && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
        {isLoading && !review ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs text-muted-foreground">Reviewing...</span>
          </div>
        ) : (
          review && (
            <div dir="auto" className="text-sm leading-relaxed">
              {review.split("\n").map((line, idx) => {
                if (line.trim() === "") return <br key={idx} />
                return (
                  <p key={idx} className="whitespace-pre-wrap">
                    {line}
                  </p>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
