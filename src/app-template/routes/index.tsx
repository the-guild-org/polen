import { Link } from 'react-router'
import { createRouteIndex } from '../../lib/react-router-helpers.js'

const Component = () => <Link to="/reference">Reference</Link>

export const index = createRouteIndex({
  Component,
})
