import type { FC } from 'react'
import { useEffect, useState } from 'react'
import type { LinkProps as LinkPropsReactRouter } from 'react-router'
import { Link as LinkReactRouter, useLocation } from 'react-router'
// todo: #lib/kit-temp does not work as import
import { ObjPartition } from '../../lib/kit-temp.ts'
import type { LinkPropsRadix } from './RadixLink.tsx'
import { LinkRadix } from './RadixLink.tsx'

const reactRouterPropKeys = [
  'discover',
  'prefetch',
  'reloadDocument',
  'replace',
  'state',
  'preventScrollReset',
  'relative',
  'to',
  'viewTransition',
  'children',
] as const

export const Link: FC<LinkPropsReactRouter & Omit<LinkPropsRadix, 'asChild'>> = props => {
  const location = useLocation()
  const toPathExp = typeof props.to === 'string' ? props.to : props.to.pathname || ''

  const active = useClientOnly(
    () => getPathActiveReport(toPathExp, location.pathname),
    { is: false, isDirect: false, isDescendant: false },
  )

  const { picked: reactRouterProps, omitted: radixProps } = ObjPartition(props, reactRouterPropKeys)

  // Only add data attributes if they're true
  const linkRadixProps = {
    ...radixProps,
    asChild: true as const,
    ...(active.is && { 'data-active': true }),
    ...(active.isDirect && { 'data-active-direct': true }),
    ...(active.isDescendant && { 'data-active-descendant': true }),
  }

  return (
    <LinkRadix {...linkRadixProps}>
      <LinkReactRouter {...reactRouterProps} />
    </LinkRadix>
  )
}

export interface PathActiveReport {
  is: boolean
  isDirect: boolean
  isDescendant: boolean
}

export const getPathActiveReport = (
  pathExp: string,
  currentPathExp: string,
): PathActiveReport => {
  // Normalize both paths for comparison
  const normalizedPath = pathExp.startsWith('/') ? pathExp.slice(1) : pathExp
  const normalizedCurrentPath = currentPathExp.startsWith('/') ? currentPathExp.slice(1) : currentPathExp

  const isDirect = normalizedCurrentPath === normalizedPath
  const isDescendant = normalizedCurrentPath.startsWith(normalizedPath + '/')
    && normalizedCurrentPath !== normalizedPath
  const is = isDirect || isDescendant

  return {
    is,
    isDirect,
    isDescendant,
  }
}

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
