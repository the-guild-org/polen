import type { FC } from 'react'
import type { LinkProps as LinkPropsReactRouter } from 'react-router'
import { Link as LinkReactRouter, useLocation } from 'react-router'
// todo: #lib/kit-temp does not work as import
import { ObjPartition } from '../../lib/kit-temp.ts'
import type { LinkPropsRadix } from './RadixLink.jsx'
import { LinkRadix } from './RadixLink.jsx'

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
  const active = getPathActiveReport(toPathExp, location.pathname)

  const { picked: reactRouterProps, omitted: radixProps } = ObjPartition(props, reactRouterPropKeys)

  return (
    <LinkRadix
      asChild
      {...radixProps}
      data-active={active.is || undefined}
      data-active-direct={active.isDirect || undefined}
      data-active-descendant={active.isdescendant || undefined}
    >
      <LinkReactRouter {...reactRouterProps} />
    </LinkRadix>
  )
}

export interface PathActiveReport {
  is: boolean
  isDirect: boolean
  isdescendant: boolean
}

export const getPathActiveReport = (
  pathExp: string,
  currentPathExp: string,
): PathActiveReport => {
  // Normalize both paths for comparison
  const normalizedPath = pathExp.startsWith('/') ? pathExp.slice(1) : pathExp
  const normalizedCurrentPath = currentPathExp.startsWith('/') ? currentPathExp.slice(1) : currentPathExp

  const isDirect = normalizedCurrentPath === normalizedPath
  const isdescendant = normalizedCurrentPath.startsWith(normalizedPath + '/')
    && normalizedCurrentPath !== normalizedPath
  const is = isDirect || isdescendant

  return {
    is,
    isDirect,
    isdescendant,
  }
}
