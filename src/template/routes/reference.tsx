import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Container, Flex } from '@radix-ui/themes'
import { Outlet } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { MissingSchema } from '../components/MissingSchema.jsx'
import { TypeIndex } from '../components/TypeIndex.jsx'
import { reference$type } from './reference.$type.jsx'

const loader = createLoader(() => {
  const latestSchemaVersion = PROJECT_DATA.schema?.versions[0].after ?? null
  return {
    schema: latestSchemaVersion,
  }
})

const Component = () => {
  const data = useLoaderData<typeof loader>()

  if (!data.schema) {
    return <MissingSchema />
  }

  return (
    <Flex direction='row' align='start'>
      <TypeIndex schema={data.schema} />
      <Container>
        <Outlet />
      </Container>
    </Flex>
  )
}

export const reference = createRoute({
  path: `reference`,
  loader,
  Component,
  children: [reference$type],
})
