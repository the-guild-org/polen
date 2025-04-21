export const memoize = <func extends ((...args: any[]) => unknown)>(func: func): func => {
  const cache: Record<string, unknown> = {}

  return ((...args: unknown[]) => {
    const cacheKey = JSON.stringify(args)
    const cachedValue = cache[cacheKey]

    if (cachedValue !== undefined) {
      return cachedValue
    }

    const result = func(...args)

    if (result instanceof Promise) {
      return result.then(resultResolved => {
        cache[cacheKey] = resultResolved
        return resultResolved
      })
    }

    cache[cacheKey] = result
    return result
  }) as func
}
