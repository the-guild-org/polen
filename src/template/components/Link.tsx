import type { FC } from 'react'
import type { LinkProps as LinkPropsReactRouter } from 'react-router'
import { Link as LinkReactRouter, useLocation } from 'react-router'
// todo: #lib/kit-temp does not work as import
import { ObjPick } from '../../lib/kit-temp.js'
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
] as const

export const Link: FC<LinkPropsReactRouter & Omit<LinkPropsRadix, 'asChild'>> = props => {
  const location = useLocation()
  const toPathExp = typeof props.to === 'string' ? props.to : props.to.pathname || ''
  const active = getPathActiveReport(toPathExp, location.pathname)

  const reactRouterProps: LinkPropsReactRouter = ObjPick(props, reactRouterPropKeys)

  return (
    <LinkRadix
      asChild
      {...props}
      data-active={active.is || undefined}
      data-active-direct={active.isDirect || undefined}
      data-active-descendant={active.isdescendant || undefined}
    >
      <LinkReactRouter {...reactRouterProps}>{props.children}</LinkReactRouter>
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
  // Normalize paths for comparison - remove leading slash if present
  const normalizedCurrentPath = currentPathExp.startsWith('/') ? currentPathExp.slice(1) : currentPathExp
  const isDirect = normalizedCurrentPath === pathExp
  const isdescendant = normalizedCurrentPath.startsWith(pathExp)
  const is = isDirect || isdescendant
  return {
    is,
    isDirect,
    isdescendant,
  }
}
