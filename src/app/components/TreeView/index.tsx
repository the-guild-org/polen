import React, { useMemo } from 'react'
import type { GraphQLNamedType } from 'graphql'
import { useSearchParams } from 'react-router-dom'
import { Grafaid } from '../../utils/grafaid'
import { RootPositionType } from './RootPositionType'
import { Box, Container, Flex, Heading } from '@radix-ui/themes'

export interface Props {
  types: readonly GraphQLNamedType[]
}

export const TreeView: React.FC<Props> = ({ types }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const openTypes = useMemo(
    () => new Set(searchParams.get(`open`)?.split(`,`).filter(Boolean) ?? []),
    [searchParams],
  )

  const toggleType = (typeName: string) => {
    const newOpenTypes = new Set(openTypes)
    if (newOpenTypes.has(typeName)) {
      newOpenTypes.delete(typeName)
    } else {
      newOpenTypes.add(typeName)
    }

    if (newOpenTypes.size === 0) {
      searchParams.delete(`open`)
    } else {
      searchParams.set(`open`, Array.from(newOpenTypes).join(`,`))
    }
    setSearchParams(searchParams)
  }

  const entryPoints = Grafaid.getEntryPointTypes(types)
  const otherTypes = Grafaid.getNonEntryPointTypes(types, entryPoints)

  return (
    <Container size="4" px="5" py="4">
      <Flex direction="column" gap="6">
        {entryPoints.length > 0 && (
          <Box>
            <Heading size="2" weight="medium" color="gray" mb="3">
              Entry Points
            </Heading>
            {entryPoints.map(type => (
              <RootPositionType
                key={type.name}
                type={type}
                isExpanded={openTypes.has(type.name)}
                toggleType={toggleType}
                openTypes={openTypes}
              />
            ))}
          </Box>
        )}

        {otherTypes.length > 0 && (
          <Box>
            <Heading size="2" weight="medium" color="gray" mb="3">
              Index
            </Heading>
            {otherTypes.map(type => (
              <RootPositionType
                key={type.name}
                type={type}
                isExpanded={openTypes.has(type.name)}
                toggleType={toggleType}
                openTypes={openTypes}
              />
            ))}
          </Box>
        )}
      </Flex>
    </Container>
  )
}
