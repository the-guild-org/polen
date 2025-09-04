import { Box, Flex, Text } from '@radix-ui/themes'

interface Props {
  src: string
  title?: string
  height?: number
  showTitle?: boolean
}

export const Logo: React.FC<Props> = ({ src, title, height = 30, showTitle = true }) => {
  return (
    <Flex align='center' gap='2'>
      <Box style={{ height, display: `flex`, alignItems: `center` }}>
        <img
          src={src}
          alt={title}
          height={height}
          className='polen-logo'
          style={{
            height: `100%`,
            width: `auto`,
            transition: `filter 0.2s ease-in-out`,
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
