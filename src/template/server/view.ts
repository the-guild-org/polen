import { createStaticHandler } from 'react-router'
import { routes } from '../routes.jsx'

export const view = createStaticHandler(routes)
