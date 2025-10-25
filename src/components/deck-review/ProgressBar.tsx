interface ProgressBarProps {
  currentIndex: number
  total: number
}

export function ProgressBar({ currentIndex, total }: ProgressBarProps) {
  const progressPercent = ((currentIndex + 1) / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Card {currentIndex + 1} of {total}
        </span>
        <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
