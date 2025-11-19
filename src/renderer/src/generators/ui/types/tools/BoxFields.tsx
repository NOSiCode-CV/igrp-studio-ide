import React from 'react'
import { StructuredComponent } from '@renderer/lib/dnd/types'
import FieldTools from './FieldTools'
import { cn } from '@renderer/lib/utils'

interface BoxProps {
  children: React.ReactElement
  comp: StructuredComponent
  parentComp: StructuredComponent
  path?: string
  className?: string
  onEdit: () => void
  index: number
  group?: string
}

const BoxField = ({
  children,
  index,
  comp,
  parentComp,
  path,
  onEdit,
  group,
  className
}: BoxProps): React.ReactNode => {
  return (
    <div className={cn('relative group/field', group)}>
      {React.cloneElement(children)}
      <div
        className={cn(
          'absolute top-0 right-0 mt-1 bg-gray-600 text-white rounded opacity-0 group-hover/field:opacity-100 transition-opacity duration-200 shadow-lg',
          className
        )}
      >
        <FieldTools
          comp={comp}
          parentComp={parentComp}
          path={path}
          index={index}
          onEdit={() => onEdit()}
        />
      </div>
    </div>
  )
}

export default BoxField
