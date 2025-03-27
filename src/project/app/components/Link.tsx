import type { FC } from 'react'
import type { LinkProps as LinkPropsTanStack } from '@tanstack/react-router'
import { Link as LinkTanStack } from '@tanstack/react-router'
import { LinkRadix } from './RadixLink'

export const Link: FC<LinkPropsTanStack> = props => (
  <LinkRadix asChild>
    <LinkTanStack {...props}></LinkTanStack>
  </LinkRadix>
)
