import { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import { TypeLink } from './TypeLink'

export interface Props {
  arg: {
    name: string
    type: any // GraphQLType but avoiding circular dependency
    description?: string
  }
  compact?: boolean
}

export const ArgumentDetails: FC<Props> = ({ arg, compact = false }) => {
  if (compact) {
    return (
      <span style={{ fontFamily: 'inherit' }}>
        <span>{arg.name}: </span>
        <TypeLink type={arg.type} compact />
      </span>
    )
  }

  return (
    <div className="argument-item">
      <div className="argument-header">
        <span className="argument-name">{arg.name}</span>
        <TypeLink type={arg.type} />
      </div>
      {arg.description && (
        <div className="argument-description">
          <ReactMarkdown>{arg.description}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
