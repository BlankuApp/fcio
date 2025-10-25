"use client"

import { ArrowRight, BookOpen, Brain, Sparkles, Languages } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthDialog } from "@/components/auth-dialog"

export function LandingAnonymous() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              AI-Powered Flashcards for{" "}
              <span className="text-primary">Language Learning</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Master new languages with intelligent flashcards powered by AI.
              Get personalized collocations, spaced repetition, and multi-language support.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg"
              onClick={() => setAuthDialogOpen(true)}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg"
              onClick={() => setAuthDialogOpen(true)}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose AI FlashCards?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI-Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically generate contextual collocations and example sentences
                  using advanced AI technology.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Spaced Repetition</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn efficiently with our intelligent spaced repetition system
                  that optimizes your review schedule.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Languages className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-Language</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Support for 15+ languages with customizable proficiency levels
                  and mother tongue selection.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Custom Decks</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create personalized flashcard decks with AI-powered prompts
                  tailored to your learning style.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Ready to Transform Your Language Learning?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of learners using AI to accelerate their language acquisition.
          </p>
          <Button
            size="lg"
            className="text-lg"
            onClick={() => setAuthDialogOpen(true)}
          >
            Start Learning Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  )
}
