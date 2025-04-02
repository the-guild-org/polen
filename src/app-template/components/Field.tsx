import type { FC } from 'react'
import type { BoxProps } from '@radix-ui/themes'
import { Box, Text } from '@radix-ui/themes'
import { ArgumentListAnnotation } from './ArgumentListAnnotation.jsx'
import { TypeAnnotation } from './TypeAnnotation.jsx'
import { Grafaid } from '../../lib/grafaid/index.js'
import { DeprecationReason } from './DeprecationReason.jsx'
import { Description } from './Description.jsx'

export type Props = BoxProps & {
  data: Grafaid.GraphQLField,
}

export const Field: FC<Props> = ({ data, ...boxProps }) => {
  const argumentList = Grafaid.isOutputField(data) ? <ArgumentListAnnotation field={data} /> : null

  return (
    <Box {...boxProps}>
      <Description data={data} />
      <DeprecationReason data={data} />
      <Text weight="medium">{data.name}</Text>
      <Text>
        {argumentList}
        :{` `}
        <TypeAnnotation type={data.type} />
      </Text>
    </Box>
  )
}
