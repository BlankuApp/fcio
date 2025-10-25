import { BookOpen, Plus, TrendingUp, Clock, Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Deck } from "@/lib/types/deck"

interface LandingAuthenticatedProps {
  recentDecks: Deck[]
  stats: {
    totalDecks: number
    totalCards: number
    dueToday: number
  }
}

export function LandingAuthenticated({ recentDecks, stats }: LandingAuthenticatedProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Welcome Section */}
      <section className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Welcome Back!</h1>
              <p className="text-muted-foreground mt-2">
                Continue your language learning journey
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/decks">
                <Plus className="mr-2 h-5 w-5" />
                Create New Deck
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalDecks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active flashcard decks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalCards}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cards in your decks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats.dueToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cards ready to review
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Decks Section */}
      <section className="px-6 py-8 bg-muted/50 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recent Decks</h2>
            <Button variant="ghost" asChild>
              <Link href="/decks">View All</Link>
            </Button>
          </div>

          {recentDecks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Decks Yet</h3>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  Start your learning journey by creating your first flashcard deck
                </p>
                <Button asChild>
                  <Link href="/decks">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Deck
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDecks.map((deck) => (
                <Card key={deck.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{deck.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {deck.que_lang} → {deck.ans_langs.join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button asChild variant="default" className="flex-1">
                        <Link href={`/decks/${deck.id}/review`}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Review
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/decks/${deck.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
