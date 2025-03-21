import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Select,
  Flex,
  Text,
} from '@radix-ui/themes'

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
    <Flex align="center" gap="2" className="view-selector">
      <Text size="2" weight="medium">View:</Text>
      <Select.Root 
        value={viewName}
        onValueChange={(value) => {
          handleViewChange(value as ViewType)
        }}
      >
        <Select.Trigger />
        <Select.Content>
          <Select.Group>
            <Select.Item value={`column`}>Column</Select.Item>
            <Select.Item value={`tree`}>Tree</Select.Item>
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </Flex>
  )
}
