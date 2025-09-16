import { forwardRef } from 'react'
import type { LinkProps as LinkPropsReactRouter } from 'react-router'
import { Link as LinkReactRouter, useLocation } from 'react-router'
// todo: #lib/kit-temp does not work as import
import { ObjPartition } from 'graphql-kit'
import { useClientOnly } from '../hooks/useClientOnly.js'
import type { LinkPropsRadix } from './RadixLink.js'
import { LinkRadix } from './RadixLink.js'

const reactRouterPropKeys = [
  `discover`,
  `prefetch`,
  `reloadDocument`,
  `replace`,
  `state`,
  `preventScrollReset`,
  `relative`,
  `to`,
  `viewTransition`,
  `children`,
] as const

export const Link = forwardRef<
  HTMLAnchorElement,
  LinkPropsReactRouter & Omit<LinkPropsRadix, `asChild`>
>((props, ref) => {
  const location = useLocation()
  const toPathExp = typeof props.to === `string` ? props.to : props.to.pathname || ``

  const active = useClientOnly(
    () => getPathActiveReport(toPathExp, location.pathname),
    { is: false, isDirect: false, isDescendant: false },
  )

  const { picked: reactRouterProps, omitted: radixProps } = ObjPartition(props, reactRouterPropKeys)

  // Only add data attributes if they're true
  const linkRadixProps = {
    ...radixProps,
    ref,
    asChild: true,
    ...(active.is && { 'data-active': true }),
    ...(active.isDirect && { 'data-active-direct': true }),
    ...(active.isDescendant && { 'data-active-descendant': true }),
  }

  return (
    <LinkRadix {...linkRadixProps}>
      <LinkReactRouter {...reactRouterProps} />
    </LinkRadix>
  )
})

Link.displayName = 'Link'

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
  const normalizedPath = pathExp.startsWith(`/`) ? pathExp.slice(1) : pathExp
  const normalizedCurrentPath = currentPathExp.startsWith(`/`) ? currentPathExp.slice(1) : currentPathExp

  const isDirect = normalizedCurrentPath === normalizedPath
  const isDescendant = normalizedCurrentPath.startsWith(normalizedPath + `/`)
    && normalizedCurrentPath !== normalizedPath
  const is = isDirect || isDescendant

  return {
    is,
    isDirect,
    isDescendant,
  }
}
