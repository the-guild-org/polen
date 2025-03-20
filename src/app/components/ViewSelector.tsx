import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export type ViewType = `column` | `tree`

export interface Props {
  currentTypeName: string | undefined
}

export const ViewSelector: FC<Props> = ({ currentTypeName }) => {
  const navigate = useNavigate()
  const { viewName = `column` } = useParams<{ viewName: ViewType }>()

  const handleViewChange = (newView: ViewType) => {
    const typePath = currentTypeName ? `/type/${currentTypeName}` : ``
    void navigate(`/view/${newView}${typePath}`)
  }

  return (
    <div className="view-selector">
      <label>
        View:
        <select
          value={viewName}
          onChange={e => {
            handleViewChange(e.target.value as ViewType)
          }}
          className="view-select"
        >
          <option value="column">Column</option>
          <option value="tree">Tree</option>
        </select>
      </label>
    </div>
  )
}
