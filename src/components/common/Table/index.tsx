import type { Key, ReactNode } from 'react'

export interface TableColumn<T> {
  id: string
  header: ReactNode
  renderCell: (row: T) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  getRowKey?: (row: T, index: number) => Key
  emptyMessage?: ReactNode
  className?: string
}

function Table<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'No data available.',
  className = '',
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={`px-4 py-3 font-semibold text-slate-700 ${column.headerClassName ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr
                key={getRowKey ? getRowKey(row, index) : index}
                className="hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`px-4 py-3 text-slate-600 ${column.cellClassName ?? ''}`}
                  >
                    {column.renderCell(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={Math.max(columns.length, 1)}
                className="px-4 py-8 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
