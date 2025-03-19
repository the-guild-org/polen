import { FC, useEffect, useState } from 'react'
import { GraphQLNamedType } from 'graphql'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { loadSchema, getTypes } from './utils/schema'
import { ViewSelector, ViewType } from './components/ViewSelector'
import { ColumnView } from './components/ColumnView'
import { TreeView } from './components/TreeView/index'
import './App.css'

interface Props {
  types: GraphQLNamedType[]
}

const SchemaView: FC<Props> = ({ types }) => {
  const { viewName = 'column', name } = useParams<{ viewName: ViewType; name: string }>()

  return (
    <div className="container">
      <header className="app-header">
        <ViewSelector currentTypeName={name} />
      </header>
      {viewName === 'column' ? (
        <ColumnView types={types} />
      ) : (
        <TreeView types={types} />
      )}
    </div>
  )
}

const App: FC = () => {
  const [types, setTypes] = useState<GraphQLNamedType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSchemaTypes = async () => {
      try {
        const schema = await loadSchema()
        const schemaTypes = getTypes(schema)
        setTypes(schemaTypes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schema')
      } finally {
        setLoading(false)
      }
    }

    void loadSchemaTypes()
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
    <Routes>
      <Route path="/" element={<Navigate to={`/view/column/type/${types[0]!.name}`} replace />} />
      <Route path="/view/:viewName/type/:name" element={<SchemaView types={types} />} />
    </Routes>
  )
}

export default App
