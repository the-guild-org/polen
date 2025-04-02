import { StartClient } from '@tanstack/react-start/client'
import { createRouter } from './router/router.jsx'
import { ReactDomClient } from '../lib/react-dom-client/_namespace.js'

const router = createRouter()

ReactDomClient.hydrateRoot(document, <StartClient router={router} />)
