import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AIReviewCardProps {
  review: string | null
  isLoading: boolean
}

export function AIReviewCard({ review, isLoading }: AIReviewCardProps) {
  if (!review) return null

  return (
    <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <CardTitle className="text-lg">AI Review</CardTitle>
            <CardDescription className="text-emerald-700 dark:text-emerald-400">
              Here&apos;s your personalized feedback
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-muted-foreground">Reviewing your answer...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-sm leading-relaxed">
            {review.split("\n").map((line, idx) => {
              if (line.trim() === "") return null
              return (
                <p key={idx} className="whitespace-pre-wrap text-foreground">
                  {line}
                </p>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
