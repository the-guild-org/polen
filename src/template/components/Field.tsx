import type { React } from '#dep/react/index'
import { GrafaidOld } from '#lib/grafaid-old/index'
import type { BoxProps } from '@radix-ui/themes'
import { Box, Text } from '@radix-ui/themes'
import { ArgumentListAnnotation } from './ArgumentListAnnotation.js'
import { DeprecationReason } from './DeprecationReason.js'
import { Description } from './Description.js'
import { TypeAnnotation } from './TypeAnnotation.js'

export const Field: React.FC<BoxProps & { data: GrafaidOld.GraphQLField }> = ({ data, ...boxProps }) => {
  const argumentList = GrafaidOld.isOutputField(data)
    ? <ArgumentListAnnotation field={data} />
    : null

  return (
    <Box {...boxProps} id={data.name}>
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
