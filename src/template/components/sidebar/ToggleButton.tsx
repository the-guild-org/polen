import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { Button } from '../ui/index.js'

export const ToggleButton = ({ isExpanded, toggleExpanded }: { isExpanded: boolean; toggleExpanded: () => void }) => (
  <Button
    variant='ghost'
    onClick={toggleExpanded}
    aria-expanded={isExpanded}
  >
    {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
  </Button>
)
