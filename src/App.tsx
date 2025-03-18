import { FC, useEffect, useState } from 'react'
import { GraphQLNamedType } from 'graphql'
import { Link, useParams, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { loadSchema, getTypes } from './utils/schema'
import './App.css'

const TypeDetails: FC<{ type: GraphQLNamedType }> = ({ type }) => {
  return (
    <div className="type-details">
      <h2>{type.name}</h2>
      <pre>{type.toString()}</pre>
    </div>
  )
}

const TypeList: FC<{ types: GraphQLNamedType[] }> = ({ types }) => {
  const { typeName } = useParams()
  const location = useLocation()
  const selectedType = types.find(t => t.name === typeName)

  return (
    <div className="container">
      <h1>GraphQL Schema Types</h1>
      <div className="content">
        <ul className="type-list">
          {types.map(type => (
            <li key={type.name} className={type.name === typeName ? 'active' : ''}>
              <Link 
                to={`/type/${type.name}`} 
                state={{ from: location.pathname }}
              >
                {type.name}
              </Link>
            </li>
          ))}
        </ul>
        {selectedType && <TypeDetails type={selectedType} />}
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

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/type" replace />} />
      <Route path="/type" element={<TypeList types={types} />} />
      <Route path="/type/:typeName" element={<TypeList types={types} />} />
    </Routes>
  )
}

export default App
