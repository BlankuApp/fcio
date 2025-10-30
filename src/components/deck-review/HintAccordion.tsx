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
  // Ensure hint is always an array
  const hints = Array.isArray(hint) ? hint : []

  return (
    <Accordion type="single" collapsible className="w-fit">
      <AccordionItem value="hint" className="border-0">
        <AccordionTrigger className="px-0 py-2 hover:no-underline">
          <span className="text-xs text-muted-foreground">
            💡 Hint
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-0 pt-2 pb-0">
          <div className="text-xs text-muted-foreground leading-relaxed">
            {hints.length === 0 ? (
              <p>Loading hints...</p>
            ) : (
              <ul className="space-y-1">
                {hints.map((h, idx) => (
                  <li key={idx}>• {h}</li>
                ))}
              </ul>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
