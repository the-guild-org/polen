import type { FC } from 'react'
import { useEffect, useState } from 'react'
import type { GraphQLNamedType } from 'graphql'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { getTypes } from './utils/schema'
import { Pollen } from './utils/pollen/_namespace'
import type { ViewType } from './components/ViewSelector'
import { ViewSelector } from './components/ViewSelector'
import { ColumnView } from './components/ColumnView'
import { TreeView } from './components/TreeView/index'
import './App.css'

// Import Radix UI Theme
import { Theme, Container, Flex, Heading } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'

interface Props {
  types: GraphQLNamedType[]
}

const SchemaView: FC<Props> = ({ types }) => {
  const { viewName = `column`, name } = useParams<{ viewName: ViewType, name: string }>()

  return (
    <Container size="3" p="4" className="container">
      <Flex justify="between" align="center" mb="4" className="app-header">
        <Heading size="4">GraphQL Schema Explorer</Heading>
        <ViewSelector currentTypeName={name} />
      </Flex>
      {viewName === `column` ? <ColumnView types={types} /> : <TreeView types={types} />}
    </Container>
  )
}

const App: FC = () => {
  const [types, setTypes] = useState<GraphQLNamedType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      if (!Pollen.isPollenEnabled()) {
        throw new Error(
          `Pollen is not enabled. Please run your app using the Pollen CLI with a valid schema file.`,
        )
      }

      const schema = Pollen.getSchema()
      const schemaTypes = getTypes(schema)
      setTypes(schemaTypes)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load schema`)
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="loading">
        <h1>Loading Schema...</h1>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <h1>Error Loading Schema</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (types.length === 0) {
    return (
      <div className="error">
        <h1>No Schema Types Found</h1>
        <p>The schema appears to be empty. Please check your GraphQL schema configuration.</p>
      </div>
    )
  }

  return (
    <Theme>
      <Routes>
        <Route path="/" element={<Navigate to={`/view/column/type/${types[0]!.name}`} replace />} />
        <Route path="/view/:viewName/type/:name" element={<SchemaView types={types} />} />
      </Routes>
    </Theme>
  )
}

export default App
