import type { React } from '#dep/react/index'
import { ReaderIcon, RowsIcon } from '@radix-ui/react-icons'
import { useViewMode } from '../../contexts/ViewModeContext.js'
import { Flex, SegmentedControl } from '../ui/index.js'

export const ViewModeToggle: React.FC = () => {
  const { viewMode, setViewMode } = useViewMode()

  return (
    <SegmentedControl.Root
      type='single'
      value={viewMode}
      onValueChange={(value: string) => setViewMode(value as 'compact' | 'expanded')}
      size={1}
    >
      <SegmentedControl.Item value='expanded'>
        <Flex align='center' gap='2'>
          <ReaderIcon />
        </Flex>
      </SegmentedControl.Item>
      <SegmentedControl.Item value='compact'>
        <Flex align='center' gap='2'>
          <RowsIcon />
        </Flex>
      </SegmentedControl.Item>
    </SegmentedControl.Root>
  )
}
