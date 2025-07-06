import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Box } from '@radix-ui/themes'
import { Outlet } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { MissingSchema } from '../components/MissingSchema.js'
import { reference$type } from './reference.$type.js'

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
    <Box className='prose'>
      <Outlet />
    </Box>
  )
}

export const reference = createRoute({
  path: `reference`,
  loader,
  Component,
  children: [reference$type],
})
