import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <span className="text-lg">❓</span>
          </div>
          <CardTitle className="text-2xl">Translate to {language}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-background p-6 rounded-xl border border-primary/10">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <p className="text-xl font-bold text-center leading-relaxed">
                {question || "Loading question..."}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
