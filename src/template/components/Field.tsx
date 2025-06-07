import { GrafaidOld } from '#lib/grafaid-old/index'
import type { BoxProps } from '@radix-ui/themes'
import { Box, Text } from '@radix-ui/themes'
import type { FC } from 'react'
import { ArgumentListAnnotation } from './ArgumentListAnnotation.jsx'
import { DeprecationReason } from './DeprecationReason.jsx'
import { Description } from './Description.jsx'
import { TypeAnnotation } from './TypeAnnotation.jsx'

export type Props = BoxProps & {
  data: GrafaidOld.GraphQLField
}

export const Field: FC<Props> = ({ data, ...boxProps }) => {
  const argumentList = GrafaidOld.isOutputField(data)
    ? <ArgumentListAnnotation field={data} />
    : null

  return (
    <Box {...boxProps}>
      <Description data={data} />
      <DeprecationReason data={data} />
      <Text weight='medium'>{data.name}</Text>
      <Text>
        {argumentList}
        :{` `}
        <TypeAnnotation type={data.type} />
      </Text>
    </Box>
  )
}
