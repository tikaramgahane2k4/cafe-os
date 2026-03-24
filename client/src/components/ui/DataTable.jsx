import { SkeletonTable } from '../admin/SkeletonLoader';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  loading = false,
  emptyTitle = 'No records found',
  emptySubtitle = '',
  emptyIcon = '☕',
  selectedRowKey = null,
  onRowClick = null,
  minWidth = 720,
  skeletonRows = 5,
}) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 18, border: '1px solid var(--border)' }}>
      <table className="admin-table" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: column.align || 'left', width: column.width }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonTable rows={skeletonRows} cols={columns.length} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle} compact />
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = row[rowKey];
              const isSelected = selectedRowKey === key;

              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    background: isSelected ? 'rgba(198,124,78,0.08)' : undefined,
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                >
                  {columns.map((column) => (
                    <td key={column.key} style={{ textAlign: column.align || 'left' }}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
