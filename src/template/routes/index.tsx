import { createRouteIndex } from '#lib/react-router-aid/react-router-aid'
import { Box } from '@radix-ui/themes'

const Component = () => {
  return <Box>home todo</Box>
}

export const index = createRouteIndex({
  Component,
})
