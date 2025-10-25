import { PageHeader } from "@/components/page-header"

export default function Home() {
  return (
    <>
      <PageHeader title="Home" />
      <main className="flex flex-col items-center justify-center flex-1 p-6">
        <h1 className="text-3xl font-bold">AI Powered FlashCards</h1>
      </main>
    </>
  )
}