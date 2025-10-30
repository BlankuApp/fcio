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
        return 'Preparing your question...'
      case 'hints':
        return 'Generating hints...'
      default:
        return 'Loading question...'
    }
  }

  // Show loading message area when any step is loading
  const showLoadingMessage = isLoading && loadingStep

  // Show question content when we have text (even if still streaming)
  const showQuestionContent = question && question.length > 0

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Loading Status Bar - Always visible when loading */}
      {showLoadingMessage && (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{getLoadingMessage()}</p>
        </div>
      )}

      {/* Question Card */}
      <div className="px-6 py-6 bg-muted rounded-lg space-y-3">
        {showQuestionContent ? (
          <div className="text-lg leading-relaxed whitespace-pre-wrap" dir="auto">
            {question}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Waiting for question...</p>
          </div>
        )}
      </div>
    </div>
  )
}
