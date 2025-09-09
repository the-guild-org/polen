import type { React } from '#dep/react/index'
import { ReaderIcon, RowsIcon } from '@radix-ui/react-icons'
import { Flex, SegmentedControl } from '@radix-ui/themes'
import { useViewMode } from '../../contexts/ViewModeContext.js'

export const ViewModeToggle: React.FC = () => {
  const { viewMode, setViewMode } = useViewMode()

  return (
    <SegmentedControl.Root
      value={viewMode}
      onValueChange={(value) => setViewMode(value as 'compact' | 'expanded')}
      size='1'
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
