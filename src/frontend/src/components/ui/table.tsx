import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Table } from '@heroui/react';
import { cn } from '@/lib/utils';
import { UiPagination } from './pagination';

type UiTableColumn = {
  id: string;
  label: ReactNode;
  className?: string;
  isRowHeader?: boolean;
};

type UiTableRow = {
  id: string;
  cells: ReactNode[];
};

interface UiTableProps {
  ariaLabel: string;
  columns: UiTableColumn[];
  rows: UiTableRow[];
  emptyMessage?: string;
  minWidthClassName?: string;
  paginate?: boolean;
  itemsPerPage?: number;
}

export function UiTable({
  ariaLabel,
  columns,
  rows,
  emptyMessage = 'Sem dados para apresentar.',
  minWidthClassName = 'min-w-[720px]',
  paginate = true,
  itemsPerPage = 5,
}: UiTableProps) {
  const [page, setPage] = useState(1);
  const normalizedColumns = useMemo(() => {
    if (columns.some((column) => column.isRowHeader)) {
      return columns;
    }

    return columns.map((column, index) => ({
      ...column,
      isRowHeader: index === 0,
    }));
  }, [columns]);

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleRows = useMemo(() => {
    if (!paginate) return rows;
    const start = (page - 1) * itemsPerPage;
    return rows.slice(start, start + itemsPerPage);
  }, [itemsPerPage, page, paginate, rows]);

  return (
    <div className="w-full rounded-[8px] border border-[#d1d5db] bg-white p-2">
      <Table className="w-full bg-transparent">
        <Table.ScrollContainer className="rounded-[8px] border border-[#d8dee7] bg-white">
          <Table.Content aria-label={ariaLabel} className={cn(minWidthClassName, 'text-[16px]')}>
            <Table.Header>
              {normalizedColumns.map((column) => (
                <Table.Column
                  key={column.id}
                  id={column.id}
                  isRowHeader={column.isRowHeader}
                  className={cn('text-[16px]', column.className)}
                >
                  {column.label}
                </Table.Column>
              ))}
            </Table.Header>

            <Table.Body>
              {visibleRows.length === 0 ? (
                <Table.Row id="empty">
                  <Table.Cell colSpan={normalizedColumns.length} className="py-8 text-center text-base text-[#64748b]">
                    {emptyMessage}
                  </Table.Cell>
                </Table.Row>
              ) : (
                visibleRows.map((row) => (
                  <Table.Row key={row.id} id={row.id}>
                    {row.cells.map((cell, index) => (
                      <Table.Cell key={`${row.id}:${index}`} className="text-[16px]">{cell}</Table.Cell>
                    ))}
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
      {paginate ? (
        <div className="mt-3 rounded-[8px] border border-[#d8dee7] bg-white px-3 py-2">
          <UiPagination
            page={page}
            setPage={setPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </div>
      ) : null}
    </div>
  );
}
