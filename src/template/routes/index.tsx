import { createRouteIndex } from '#lib/react-router-helpers.js'
import { Box } from '@radix-ui/themes'

const Component = () => {
  return <Box>home todo</Box>
}

export const index = createRouteIndex({
  Component,
})
