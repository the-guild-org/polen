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
    // console.log({ serialized })
    return serialized
  }
}

interface Serialized {
  superjsonData: string
}

export const useLoaderData = <loader extends Loader>(routeTarget?: string): Awaited<
  ReturnType<loader>
> => {
  // eslint-disable-next-line
  const loaderData = (
    routeTarget
      ? useRouteLoaderDataRR(routeTarget)
      : useLoaderDataRR()
  ) as Serialized

  // eslint-disable-next-line
  if (loaderData === undefined) {
    throw new Error(`No loader data returned from route ${routeTarget ?? `<direct>`}`)
  }

  const { superjsonData } = loaderData

  const data = superjson.parse(superjsonData)

  return data as any
}
