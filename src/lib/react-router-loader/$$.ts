import type { Fn } from '@wollybeard/kit'
import { useLoaderData as useLoaderDataRR, useRouteLoaderData as useRouteLoaderDataRR } from 'react-router'

type Loader = Fn.AnyAny

export const createLoader = <loader extends Loader>(loader: loader): loader => {
  return loader
}

export const useLoaderData = <loader extends Loader>(routeTarget?: string): Awaited<
  ReturnType<loader>
> => {
  const loaderData = routeTarget
    ? useRouteLoaderDataRR(routeTarget)
    : useLoaderDataRR()

  if (loaderData === undefined) {
    throw new Error(`No loader data returned from route ${routeTarget ?? `<direct>`}`)
  }

  return loaderData as any
}
