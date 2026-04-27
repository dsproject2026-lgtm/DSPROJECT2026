import { Pagination } from '@heroui/react';

interface UiPaginationProps {
  page: number;
  setPage: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
}

function getPageNumbers(page: number, totalPages: number) {
  const pages: Array<number | 'ellipsis'> = [];

  pages.push(1);

  if (page > 3) pages.push('ellipsis');

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (page < totalPages - 2) pages.push('ellipsis');
  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

export function UiPagination({
  page,
  setPage,
  totalItems,
  itemsPerPage = 5,
}: UiPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  return (
    <Pagination className="w-full">
      <Pagination.Summary>
        A mostrar {startItem}-{endItem} de {totalItems} resultados
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={page === 1} onPress={() => setPage(Math.max(1, page - 1))}>
            <Pagination.PreviousIcon />
            <span>Anterior</span>
          </Pagination.Previous>
        </Pagination.Item>

        {getPageNumbers(page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <Pagination.Item key={`ellipsis-${index}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={item}>
              <Pagination.Link isActive={item === page} onPress={() => setPage(item)}>
                {item}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}

        <Pagination.Item>
          <Pagination.Next
            isDisabled={page === totalPages}
            onPress={() => setPage(Math.min(totalPages, page + 1))}
          >
            <span>Seguinte</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
