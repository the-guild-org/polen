import { Tooltip } from '@radix-ui/themes'
import { Obj } from '@wollybeard/kit'
import React from 'react'
import type { RevisionClickEventHandler } from './CatalogRailway.js'
import type { RevisionAddress } from './helpers.js'
import { Node } from './Node.js'

interface Props {
  address: RevisionAddress
  x?: number | undefined
  y?: number | undefined
  isCurrent?: boolean | undefined
  width?: number | undefined
  onClick?: RevisionClickEventHandler | undefined
}

export const RevisionNode: React.FC<Props> = (props) => {
  const defaults = {
    x: 0,
    y: 0,
    width: 10,
    isCurrent: false,
  }
  const {
    x,
    y,
    isCurrent,
    address,
    onClick,
    width,
  } = Obj.mergeDefaults(props, defaults)

  const version = address.schema.version.value
  const key = version + '@' + address.revision.date

  return (
    <Tooltip content={address.revision.date}>
      <g key={key} className='catalog-railway-revision-node'>
        <Node
          x={x}
          y={y}
          width={width}
          data-type='revision'
          data-current={isCurrent}
          onClick={() => onClick?.({ address })}
        />
      </g>
    </Tooltip>
  )
}
