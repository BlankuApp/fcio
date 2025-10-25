import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ReviewCompleteCardProps {
  cardCount: number
}

export function ReviewCompleteCard({ cardCount }: ReviewCompleteCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Complete!</CardTitle>
        <CardDescription>
          You have reviewed all {cardCount} cards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-lg font-semibold">
          Great job! Come back tomorrow for more reviews.
        </p>
      </CardContent>
    </Card>
  )
}
