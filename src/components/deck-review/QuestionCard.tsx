import { Loader2 } from "lucide-react"

interface QuestionCardProps {
  question: string | undefined
  isLoading: boolean
  loadingStep?: 'answer' | 'question' | 'hints' | null
  language: string
}

export function QuestionCard({
  question,
  isLoading,
  loadingStep,
  language,
}: QuestionCardProps) {
  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 'answer':
        return 'Generating sentence...'
      case 'question':
        return 'Translating question...'
      case 'hints':
        return 'Generating hints...'
      default:
        return 'Loading question...'
    }
  }

  return (
    <div className="space-y-2 max-w-2xl mx-auto px-4 py-6 bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground text-center">Translate to {language}</p>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-4 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{getLoadingMessage()}</p>
        </div>
      ) : (
        <p className="text-xl font-bold leading-relaxed text-center" dir="auto">
          {question || "Loading question..."}
        </p>
      )}
    </div>
  )
}
