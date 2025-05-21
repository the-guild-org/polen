import type { Fn } from '@wollybeard/kit'
import { useLoaderData as useLoaderDataRR, useRouteLoaderData as useRouteLoaderDataRR } from 'react-router'
import { superjson } from '../../singletons/superjson.js'

type Loader = Fn.AnyAny

export const createLoader = <loader extends Loader>(loader: loader): loader => {
  // @ts-expect-error
  return async (...args: any[]) => {
    // eslint-disable-next-line
    const data = await loader(...args)
    const serialized: Serialized = {
      superjsonData: superjson.stringify(data),
    }
    return serialized
  }
}

interface Serialized {
  superjsonData: string
}

export const useLoaderData = <loader extends Loader>(): Awaited<
  ReturnType<loader>
> => {
  // eslint-disable-next-line
  const { superjsonData } = useLoaderDataRR() as Serialized

  const data = superjson.parse(superjsonData)

  return data as any
}

export const useRouteLoaderData = <loader extends Loader>(routePath: string): Awaited<
  ReturnType<loader>
> => {
  // eslint-disable-next-line
  const { superjsonData } = useRouteLoaderDataRR(routePath) as Serialized

  const data = superjson.parse(superjsonData)

  return data as any
}
