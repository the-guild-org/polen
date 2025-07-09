import { data } from 'react-router'
import { NotFound } from '../components/NotFound.js'

export async function loader() {
  // Throw a 404 response - this will be caught by the ErrorBoundary
  throw data(null, { status: 404, statusText: 'Not Found' })
}

export function ErrorBoundary() {
  // This will render when the loader throws the 404
  return <NotFound />
}
