import { Outlet, createRoute } from '@tanstack/react-router'
import schemaFileContent from '../../../public/schema.graphql?raw'
import { buildASTSchema, parse } from 'graphql'
import { ColumnView } from '../../components/ColumnView'
import { root } from './__root'
import { Flex } from '@radix-ui/themes'

// const filePath = `count.txt`

// async function readCount() {
//   return parseInt(
//     await fs.promises.readFile(filePath, `utf-8`).catch(() => `0`),
//   )
// }

// const getCount = createServerFn({
//   method: `GET`,
// }).handler(() => {
//   return readCount()
// })

// const updateCount = createServerFn({ method: `POST` })
//   .validator((d: number) => d)
//   .handler(async ({ data }) => {
//     const count = await readCount()
//     await fs.promises.writeFile(filePath, `${count + data}`)
//   })

const component = () => {
  const data = referenceIndex.useLoaderData()
  const schema = buildASTSchema(data.documentNode)

  return (
    <Flex direction="row" align="start">
      <ColumnView schema={schema} />
      <Outlet />
    </Flex>
  )
}

export const referenceIndex = createRoute({
  getParentRoute: () => root,
  path: `/reference`,
  component,
  loader: () => {
    const documentNode = parse(schemaFileContent)
    return {
      documentNode,
    }
  },
})
