// TODO: Review and replace inline styles with Tailwind classes
import { Link as LinkReactRouter } from 'react-router'
import { Box, Button, Flex, Heading, Text } from './ui/index.js'

export const NotFound: React.FC = () => {
  return (
    <Flex direction='column' align='center' gap='6' className='text-center pt-16'>
      <Heading size='9' className='text-gray-900 dark:text-gray-100'>404</Heading>
      <Box>
        <Heading size='5' mb='2'>Page Not Found</Heading>
        <Text size='3' color='gray'>
          The page you're looking for doesn't exist or has been moved.
        </Text>
      </Box>
      <Flex gap='3'>
        <LinkReactRouter to='/'>
          <Button variant='soft' size='3'>
            Go Home
          </Button>
        </LinkReactRouter>
        <LinkReactRouter to='/reference'>
          <Button variant='outline' size='3'>
            View API Reference
          </Button>
        </LinkReactRouter>
      </Flex>
    </Flex>
  )
}
