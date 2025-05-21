import type { FC } from 'react'
import type { LinkProps as LinkPropsReactRouter } from 'react-router'
import { Link as LinkReactRouter } from 'react-router'
import type { LinkPropsRadix } from './RadixLink.jsx'
import { LinkRadix } from './RadixLink.jsx'

export const Link: FC<LinkPropsReactRouter & LinkPropsRadix> = props => {
  const { underline, color, m, mt, mb, ml, mr, my, mx } = props
  const radixProps = { underline, color, m, mt, mb, ml, mr, my, mx }
  return (
    <LinkRadix asChild {...radixProps}>
      <LinkReactRouter {...props}></LinkReactRouter>
    </LinkRadix>
  )
}
