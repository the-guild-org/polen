import type { FC } from 'react'
import { LinkRadix } from './RadixLink.jsx'
import type { LinkProps as LinkPropsReactRouter } from 'react-router'
import { Link as LinkReactRouter } from 'react-router'

export const Link: FC<LinkPropsReactRouter> = props => (
  <LinkRadix asChild>
    <LinkReactRouter {...props}></LinkReactRouter>
  </LinkRadix>
)
