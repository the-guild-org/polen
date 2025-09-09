import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { GrafaidOld } from '#lib/grafaid-old'
import { Lifecycles } from '#lib/lifecycles/$'
import type { BoxProps } from '@radix-ui/themes'
import { Badge, Box, Card, Flex, HoverCard, Link, Text } from '@radix-ui/themes'
import { isNonNullType } from 'graphql'
import { useSchema } from '../../contexts/GraphqlLifecycleContext.js'
import { useReferenceConfig } from '../../contexts/ReferenceConfigContext.js'
import { useViewMode } from '../../contexts/ViewModeContext.js'
import { DeprecationReason } from '../DeprecationReason.js'
import { Description } from '../Description.js'
import { SinceBadge } from '../SinceBadge.js'
import { ArgumentListAnnotation } from './ArgumentListAnnotation.js'
import { TypeAnnotation } from './TypeAnnotation.js'

export const Field: React.FC<
  BoxProps & {
    data: GrafaidOld.GraphQLField
    parentTypeName?: string
    fieldNameWidth?: number
    argumentNameWidth?: number
  }
> = ({ data, parentTypeName, fieldNameWidth, argumentNameWidth, ...boxProps }) => {
  const { schema, lifecycles } = useSchema()
  const { viewMode } = useViewMode()
  const referenceConfig = useReferenceConfig()

  const argumentList = GrafaidOld.isOutputField(data)
    ? argumentNameWidth !== undefined
      ? <ArgumentListAnnotation field={data} argumentNameWidth={argumentNameWidth} />
      : <ArgumentListAnnotation field={data} />
    : null

  // Check if the field is nullable (for questionMark mode)
  const isFieldNullable = !isNonNullType(data.type)

  // Get field lifecycle information if available
  const since = parentTypeName
    ? Lifecycles.getFieldSince(lifecycles, parentTypeName, data.name, schema)
    : null
  const removedDate = parentTypeName
    ? Lifecycles.getFieldRemovedDate(lifecycles, parentTypeName, data.name, schema)
    : null

  // Only show since badge if it's NOT the initial version
  const showSinceBadge = since && since._tag !== 'initial'

  return (
    <Card
      {...boxProps}
      variant='ghost'
      id={data.name}
      style={{ overflow: 'visible' }}
    >
      {/* Field name and return type with aligned columns */}
      <style>
        {`
        .field-name-anchor {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) translateX(0);
          opacity: 0;
          transition: all 0.2s ease-in-out;
          pointer-events: none;
          z-index: 10;
        }

        .field-name-wrapper:hover .field-name-anchor {
          transform: translateY(-50%) translateX(-24px);
          opacity: 1;
          pointer-events: auto;
        }
      `}
      </style>
      <Flex align='baseline' mb='2' gap='2'>
        <Box
          className='field-name-wrapper'
          style={{
            minWidth: fieldNameWidth ? `${fieldNameWidth}ch` : 'auto',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* Anchor icon that slides left on hover */}
          <Link
            className='field-name-anchor'
            href={`#${data.name}`}
            color='gray'
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Text size='3' color='gray'>
              #
            </Text>
          </Link>
          {viewMode === 'compact' && data.description
            ? (
              <HoverCard.Root>
                <HoverCard.Trigger>
                  <Link
                    href={`#${data.name}`}
                    color='gray'
                    underline='hover'
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    <Text size='3' weight='bold'>
                      {data.name}
                      {referenceConfig.nullabilityRendering === 'questionMark' && isFieldNullable && '?'}
                    </Text>
                  </Link>
                </HoverCard.Trigger>
                <HoverCard.Content
                  size='2'
                  maxWidth='400px'
                  side='top'
                  align='center'
                >
                  <Text size='2' color='gray'>
                    <Description data={data} />
                  </Text>
                </HoverCard.Content>
              </HoverCard.Root>
            )
            : (
              <Link
                href={`#${data.name}`}
                color='gray'
                underline='hover'
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                <Text size='3' weight='bold'>
                  {data.name}
                  {referenceConfig.nullabilityRendering === 'questionMark' && isFieldNullable && '?'}
                </Text>
              </Link>
            )}
        </Box>
        <TypeAnnotation
          type={data.type}
          showDescription={true}
          nullabilityRendering={referenceConfig.nullabilityRendering}
        />
      </Flex>

      {/* Badges below the header line */}
      {(showSinceBadge || removedDate) && (
        <Flex gap='2' mb='2'>
          {showSinceBadge && <SinceBadge since={since} />}
          {removedDate && (
            <Badge color='red' variant='soft' size='1'>
              Removed {Api.Schema.dateToVersionString(removedDate)}
            </Badge>
          )}
        </Flex>
      )}

      {/* Description below title (only in expanded mode) */}
      {data.description && viewMode === 'expanded' && (
        <Box mb='2'>
          <Text size='2' color='gray' style={{ lineHeight: '1.5' }}>
            <Description data={data} />
          </Text>
        </Box>
      )}

      {/* Deprecation reason if exists */}
      <DeprecationReason data={data} />

      {/* Arguments section below, with left border - only show if field has arguments */}
      {argumentList && GrafaidOld.isOutputField(data) && data.args.length > 0 && (
        <Box mt='2' ml='3' pl='3' style={{ borderLeft: '2px solid var(--gray-4)' }}>
          {argumentList}
        </Box>
      )}
    </Card>
  )
}
