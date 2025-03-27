import { StartClient } from '@tanstack/react-start'
import { createRouter } from './router/router'
import { ReactDomClient } from '../../lib/react-dom-client/_namespace'

const router = createRouter()

ReactDomClient.hydrateRoot(document, <StartClient router={router} />)
