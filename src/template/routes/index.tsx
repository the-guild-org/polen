import { routeIndex } from '#lib/react-router-effect/react-router-effect'
import { Box } from '@radix-ui/themes'

const Component = () => {
  return <Box>home todo</Box>
}

export const index = routeIndex({
  Component,
})
