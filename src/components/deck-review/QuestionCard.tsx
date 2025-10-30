import { Loader2 } from "lucide-react"

interface QuestionCardProps {
  question: string | undefined
  isLoading: boolean
  language: string
}

export function QuestionCard({
  question,
  isLoading,
  language,
}: QuestionCardProps) {
  return (
    <div className="space-y-2 max-w-2xl mx-auto px-4 py-6 bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground text-center">Translate to {language}</p>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <p className="text-xl font-bold leading-relaxed text-center" dir="auto">
          {question || "Loading question..."}
        </p>
      )}
    </div>
  )
}
