export type ReviewDifficulty = "again" | "hard" | "good" | "easy"

export interface DifficultyOption {
  value: ReviewDifficulty
  label: string
  description: string
  icon: string
  color: string
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: "again",
    label: "Again",
    description: "I don't remember",
    icon: "❌",
    color: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 text-red-700 dark:text-red-200",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Difficult to recall",
    icon: "😓",
    color: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-200",
  },
  {
    value: "good",
    label: "Good",
    description: "Correct, but slow",
    icon: "👍",
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-200",
  },
  {
    value: "easy",
    label: "Easy",
    description: "Correct & fast",
    icon: "⭐",
    color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-200",
  },
]
