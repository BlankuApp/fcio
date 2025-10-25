import { useEffect, useState } from "react"
import { getDueCards, listDeckWords } from "@/lib/decks/deck-words-client"
import type { DeckWord } from "@/lib/types/deck-words"

interface UseReviewCardsReturn {
  cards: DeckWord[]
  isLoadingCards: boolean
  loadError: string | null
  currentCardIndex: number
  setCurrentCardIndex: (index: number) => void
  isReviewComplete: boolean
}

export function useReviewCards(deckId: string): UseReviewCardsReturn {
  const [cards, setCards] = useState<DeckWord[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoadingCards(true)
        setLoadError(null)

        // First try to get due cards
        const dueCardsData = await getDueCards(deckId)

        if (dueCardsData.cards.length === 0) {
          // If no due cards, get all cards
          const allCards = await listDeckWords(deckId, { limit: 50 })
          setCards(allCards)
        } else {
          setCards(dueCardsData.cards)
        }
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load cards"
        )
        setCards([])
      } finally {
        setIsLoadingCards(false)
      }
    }

    loadCards()
  }, [deckId])

  return {
    cards,
    isLoadingCards,
    loadError,
    currentCardIndex,
    setCurrentCardIndex,
    isReviewComplete: currentCardIndex >= cards.length,
  }
}
