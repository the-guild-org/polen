import { useEffect, useState } from 'react'

/**
 * Hook that returns a server value during SSR and switches to client value after hydration
 *
 * @param clientValue - Function that returns the value to use on the client
 * @param serverValue - Value to use during SSR
 * @returns The appropriate value based on rendering context
 */
export function useClientOnly<T>(
  clientValue: () => T,
  serverValue: T,
): T {
  const [value, setValue] = useState<T>(serverValue)

  useEffect(() => {
    setValue(clientValue())
  }, [])

  return value
}
