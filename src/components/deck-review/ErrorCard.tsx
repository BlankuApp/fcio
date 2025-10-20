import { Card, CardContent } from "@/components/ui/card"

interface ErrorCardProps {
  error?: string | null
  isEmpty?: boolean
}

export function ErrorCard({ error, isEmpty }: ErrorCardProps) {
  const message = error || (isEmpty ? "No cards available for review" : "An error occurred")

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <p className="text-destructive">{message}</p>
      </CardContent>
    </Card>
  )
}
