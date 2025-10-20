import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface HintAccordionProps {
  hint: string[] | undefined
}

export function HintAccordion({ hint }: HintAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value="hint"
        className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden"
      >
        <AccordionTrigger className="px-6 py-4 hover:no-underline bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
          <span className="flex items-center gap-3 font-semibold text-amber-900 dark:text-amber-200">
            <span className="text-lg">💡</span>
            <span>Show Hint</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-6 pt-6 pb-6 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="mt-1 text-amber-600 dark:text-amber-400">💭</div>
              <div className="text-sm leading-relaxed text-foreground">
                {!hint || hint.length === 0 ? (
                  <p>Loading hints...</p>
                ) : (
                  <ul className="space-y-2">
                    {hint.map((h, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-amber-600 dark:text-amber-400">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
