import { Link, createRoute } from '@tanstack/react-router'
import { root } from './__root'

const component = () => {
  return <Link to="/reference">Reference</Link>
}

export const index = createRoute({
  getParentRoute: () => root,
  path: `/`,
  component,
})
