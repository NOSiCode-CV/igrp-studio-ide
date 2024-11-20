import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@renderer/components/ui/table';

interface DefaultTableProps {
  content: any[]
  columns: { header: string; accessorKey: string }[]
  actions: (cell: any) => React.ReactNode
}

export function TableLayout({ content, columns, actions }: DefaultTableProps) {

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.accessorKey}>{column.header}</TableHead>
          ))}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {content && content.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((column) => (
              <TableCell key={column.accessorKey}>
                {row[column.accessorKey]}
              </TableCell>
            ))}
            <TableCell>{actions({ row: { original: row } })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}