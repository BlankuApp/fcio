import { Loader2 } from "lucide-react"

interface AIReviewCardProps {
  review: string | null
  isLoading: boolean
}

export function AIReviewCard({ review, isLoading }: AIReviewCardProps) {
  if (!review) return null

  return (
    <div className="space-y-2 bg-muted rounded-lg p-4">
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
  )
}
