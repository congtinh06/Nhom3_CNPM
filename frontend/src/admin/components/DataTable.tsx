import React from 'react';

export interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyText?: string;
  ariaLabel?: string;
  caption?: string;
  stickyLastColumn?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyText = 'Chưa có dữ liệu hiển thị.',
  ariaLabel = 'Bảng dữ liệu quản trị',
  caption,
  stickyLastColumn = false,
}: DataTableProps<T>): React.ReactElement {
  const isLastColumn = (index: number) => stickyLastColumn && index === columns.length - 1;

  return (
    <div className="adm-table-wrap">
      <table className="adm-table" aria-label={ariaLabel}>
        {caption && <caption className="adm-table-caption">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col, colIndex) => (
              <th
                key={col.key}
                className={isLastColumn(colIndex) ? 'adm-table-sticky-col' : undefined}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
                scope="col"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={`loading-row-${rIdx}`} className="adm-table-row-loading">
                {columns.map((_, cIdx) => (
                  <td key={`loading-cell-${cIdx}`}>
                    <div className="adm-skeleton-cell" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="adm-table-empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)}>
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className={isLastColumn(colIndex) ? 'adm-table-sticky-col' : undefined}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
