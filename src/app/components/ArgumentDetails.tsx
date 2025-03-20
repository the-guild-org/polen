import type { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import { TypeLink } from './TypeLink'
import type { GraphQLArgument } from 'graphql'

export interface Props {
  arg: GraphQLArgument
  compact?: boolean
}

export const ArgumentDetails: FC<Props> = ({ arg, compact = false }) => {
  if (compact) {
    return (
      <span
        style={{
          fontFamily: `inherit`,
          display: `inline-flex`,
          alignItems: `baseline`,
          gap: `0.25rem`,
        }}
      >
        <span style={{ color: `#6B7280` }}>
          {arg.name}
          :
        </span>
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
