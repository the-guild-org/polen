import { useIsPrefersDarkMode } from '#template/hooks/is-prefers-dark-mode'
import { Box, Flex, Text } from '@radix-ui/themes'

interface Props {
  src: string
  title?: string
  height?: number
  showTitle?: boolean
}

export const Logo: React.FC<Props> = ({ src, title, height = 30, showTitle = true }) => {
  const prefersDarkMode = useIsPrefersDarkMode()

  return (
    <Flex align='center' gap='2'>
      <Box style={{ height, display: 'flex', alignItems: 'center' }}>
        <img
          src={src}
          alt={title}
          height={height}
          style={{
            height: '100%',
            width: 'auto',
            // Use CSS filter to invert colors in dark mode
            filter: prefersDarkMode ? 'invert(1)' : 'none',
            transition: 'filter 0.2s ease-in-out',
          }}
        />
      </Box>
      {showTitle && (
        <Text size='3' weight='medium'>
          {title}
        </Text>
      )}
    </Flex>
  )
}
