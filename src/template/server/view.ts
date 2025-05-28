import { Grafaid } from '#lib/grafaid/index.js'
import { visit } from 'graphql'
import { createStaticHandler } from 'react-router'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import { routes } from '../routes.jsx'

export const view = createStaticHandler(routes)

export const getRoutesPaths = () => {
  // todo: pages, changelog
  const paths = [`/`]
  const schema = PROJECT_DATA.schema!.versions[0].after
  const ast = Grafaid.Schema.AST.parse(Grafaid.Schema.print(schema))
  visit(ast, {
    NamedType(type) {
      paths.push(`/reference/${type.name.value}`)
    },
  })
  return paths
}
