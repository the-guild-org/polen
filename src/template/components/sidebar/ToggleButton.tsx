import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { Button } from '@radix-ui/themes'

export const ToggleButton = ({ isExpanded, toggleExpanded }: { isExpanded: boolean; toggleExpanded: () => void }) => (
  <Button
    variant='ghost'
    onClick={toggleExpanded}
    aria-expanded={isExpanded}
    // todo: allow passing
    // aria-controls={`section-${section.pathExp.replace(/\//g, '-')}`}
    // aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.title} section`}
    mx='1'
  >
    {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
  </Button>
)
