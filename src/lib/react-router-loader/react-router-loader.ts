import {
  useLoaderData as useLoaderDataRR,
  useRouteLoaderData as useRouteLoaderDataRR,
} from 'react-router'
import { Superjson } from '#lib/superjson/index.js'
import type { Fn } from '#lib/prelude/prelude.js'

type Loader = Fn.Any

export const createLoader = <loader extends Loader>(loader: loader): loader => {
  // @ts-expect-error
  return async (...args: any[]) => {
    // eslint-disable-next-line
    const data = await loader(...args)
    const serialized: Serialized = {
      superjson: Superjson.stringify(data),
    }
    return serialized
  }
}

interface Serialized {
  superjson: string
}

export const useLoaderData = <loader extends Loader>(): Awaited<
  ReturnType<loader>
> => {
  // eslint-disable-next-line
  const { superjson } = useLoaderDataRR() as Serialized

  const data = Superjson.parse(superjson)

  return data as any
}

export const useRouteLoaderData = <loader extends Loader>(routePath: string): Awaited<
  ReturnType<loader>
> => {
  // eslint-disable-next-line
  const { superjson } = useRouteLoaderDataRR(routePath) as Serialized

  const data = Superjson.parse(superjson)

  return data as any
}
