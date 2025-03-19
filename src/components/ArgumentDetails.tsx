import { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import { TypeLink } from './TypeLink'

export interface Props {
  arg: {
    name: string
    type: any // GraphQLType but avoiding circular dependency
    description?: string
  }
}

export const ArgumentDetails: FC<Props> = ({ arg }) => (
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
