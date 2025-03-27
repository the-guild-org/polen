import { createRoute } from '@tanstack/react-router'
import { root } from './__root'
import { Link } from '../../components/Link'

const component = () => {
  return <Link to="/reference">Reference</Link>
}

export const index = createRoute({
  getParentRoute: () => root,
  path: `/`,
  component,
})
