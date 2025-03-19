import { FC, useEffect, useState } from 'react'
import { GraphQLNamedType } from 'graphql'
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { loadSchema, getTypes } from './utils/schema'
import { TypeList } from './components/TypeList'
import { TypeDetails } from './components/TypeDetails'
import './App.css'

interface Props {
  types: GraphQLNamedType[]
}

const TypeRoute: FC<Props> = ({ types }) => {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const type = name ? types.find(t => t.name === name) : undefined

  useEffect(() => {
    if (name && !type) {
      // If type doesn't exist, redirect to first available type
      navigate(`/type/${types[0]?.name}`, { replace: true })
    }
  }, [name, type, types, navigate])

  const entryPoints = types.filter(t => [
    'Query',
    'Mutation',
    'Subscription'
  ].includes(t.name))

  const otherTypes = types.filter(t => ![
    'Query',
    'Mutation',
    'Subscription'
  ].includes(t.name))

  return (
    <div className="container">
      <h1>GraphQL Schema Explorer</h1>
      <div className="content">
        <div className="sidebar">
          <TypeList types={entryPoints} title="Entry Points" className="entry-points" />
          <TypeList types={otherTypes} title="Index" />
        </div>
        {type && <TypeDetails type={type} />}
      </div>
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

  // Ensure we have types before rendering routes
  if (types.length === 0) {
    return (
      <div className="error">
        <h1>No Schema Types Found</h1>
        <p>The schema appears to be empty. Please check your GraphQL schema configuration.</p>
      </div>
    )
  }

  // TypeScript will now know that types array is non-empty below this point

  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/type/${types[0]!.name}`} replace />} />
      <Route path="/type/:name" element={<TypeRoute types={types} />} />
    </Routes>
  )
}

export default App
