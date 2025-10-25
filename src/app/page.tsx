import { PageHeader } from "@/components/page-header"
import { LandingAnonymous } from "@/components/landing-anonymous"
import { LandingAuthenticated } from "@/components/landing-authenticated"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()

  // Check authentication using getUser() for security
  const { data: { user }, error } = await supabase.auth.getUser()

  // If no user or error, show anonymous landing
  if (error || !user) {
    return (
      <>
        <PageHeader title="Home" />
        <LandingAnonymous />
      </>
    )
  }

  // Fetch user's decks using the same supabase client
  const { data: allDecks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Ensure ans_langs is always an array
  const processedDecks = (allDecks || []).map(deck => ({
    ...deck,
    ans_langs: Array.isArray(deck.ans_langs) ? deck.ans_langs :
               typeof deck.ans_langs === 'string' ? [deck.ans_langs] : []
  }))

  const recentDecks = processedDecks.slice(0, 3)
  const totalDecks = allDecks?.length || 0

  // Fetch deck statistics
  let totalCards = 0
  let dueToday = 0

  if (allDecks && allDecks.length > 0) {
    const { data: deckWords } = await supabase
      .from('deck_words')
      .select('deck_id, due')
      .in('deck_id', allDecks.map(d => d.id))

    if (deckWords) {
      totalCards = deckWords.length
      const now = new Date().toISOString()
      dueToday = deckWords.filter(dw => dw.due <= now).length
    }
  }

  const stats = {
    totalDecks,
    totalCards,
    dueToday,
  }

  return (
    <>
      <PageHeader title="Home" />
      <LandingAuthenticated recentDecks={recentDecks} stats={stats} />
    </>
  )
}