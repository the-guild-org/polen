import { FC, useEffect, useState } from 'react'
import { GraphQLNamedType } from 'graphql'
import { Link, useParams, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { loadSchema, getTypes } from './utils/schema'
import './App.css'

const TypeDetails: FC<{ type: GraphQLNamedType }> = ({ type }) => {
  // Cast to any GraphQL type that might have fields
  const fields = 'getFields' in type ? (type as any).getFields() : null

  return (
    <div className="type-details">
      <h2>{type.name}</h2>
      {fields ? (
        <div className="fields-list">
          {Object.entries(fields).map(([fieldName, field]: [string, any]) => (
            <div key={fieldName} className="field-item">
              <div className="field-header">
                <span className="field-name">{fieldName}</span>
                {field.args?.length > 0 && (
                  <span className="field-args">
                    ({field.args.map((arg: any) => (
                      <span key={arg.name} className="field-arg">
                        {arg.name}: {arg.type.toString()}
                      </span>
                    )).join(', ')})
                  </span>
                )}
                <span className="field-type">{field.type.toString()}</span>
              </div>
              {field.description && (
                <div className="field-description">
                  <ReactMarkdown>{field.description}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <pre>{type.toString()}</pre>
      )}
    </div>
  )
}

const TypeList: FC<{ types: GraphQLNamedType[] }> = ({ types }) => {
  const { typeName } = useParams()
  const location = useLocation()
  const selectedType = types.find(t => t.name === typeName)

  const entryPoints = types.filter(type => [
    'Query',
    'Mutation',
    'Subscription'
  ].includes(type.name))

  const indexTypes = types.filter(type => ![
    'Query',
    'Mutation',
    'Subscription'
  ].includes(type.name))

  return (
    <div className="container">
      <h1>GraphQL Schema Types</h1>
      <div className="content">
        <div className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Entry Points</h3>
            <ul className="type-list entry-points">
              {entryPoints.map(type => (
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
          </div>
          <div className="sidebar-section">
            <h3 className="sidebar-title">Index</h3>
            <ul className="type-list">
              {indexTypes.map(type => (
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
          </div>
        </div>
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
