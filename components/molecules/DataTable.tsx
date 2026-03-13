"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { SearchBar } from "./SearchBar";

// --- Types ---

export interface DataTableColumn<T> {
  /** Identificador único da coluna (obrigatório quando accessor se repete) */
  id?: string;
  /** Texto exibido no header da coluna */
  header: string;
  /** Chave do dado para acessar o valor (keyof T) */
  accessor: keyof T & string;
  /** Função de renderização customizada para a célula */
  render?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
  /** Se a coluna permite ordenação */
  sortable?: boolean;
  /** Classe CSS customizada para a coluna */
  className?: string;
  /** Largura mínima da coluna */
  minWidth?: string;
  /** Esconder coluna em telas menores (sm, md, lg) */
  hideBelow?: "sm" | "md" | "lg";
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  /** Definição das colunas */
  columns: DataTableColumn<T>[];
  /** Dados a exibir */
  data: T[];
  /** Estado de carregamento */
  loading?: boolean;
  /** Mensagem quando não há dados */
  emptyMessage?: string;
  /** Ícone do estado vazio */
  emptyIcon?: React.ReactNode;
  /** Ação do estado vazio */
  emptyAction?: { label: string; onClick: () => void };
  /** Chave única para cada linha (keyof T ou função) */
  rowKey?: (keyof T & string) | ((row: T, index: number) => string);
  /** Número de linhas skeleton no loading */
  skeletonRows?: number;
  /** Habilitar paginação */
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
  };
  /** Habilitar busca integrada */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Classe CSS do container */
  className?: string;
  /** Callback ao clicar em uma linha */
  onRowClick?: (row: T, index: number) => void;
}

// --- Skeleton Row ---

const hideClasses = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

function SkeletonRow({
  columns,
  hiddenCols,
}: {
  columns: number;
  hiddenCols: (string | undefined)[];
}) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td
          key={i}
          className={cn(
            "px-3 py-2.5 md:px-4 md:py-3",
            hiddenCols[i] &&
              hideClasses[hiddenCols[i] as keyof typeof hideClasses],
          )}
        >
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// --- Component ---

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "Nenhum dado encontrado",
  emptyIcon,
  emptyAction,
  rowKey,
  skeletonRows = 5,
  pagination,
  search,
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });

  const getRowKey = useCallback(
    (row: T, index: number): string => {
      if (!rowKey) return String(index);
      if (typeof rowKey === "function") return rowKey(row, index);
      return String(row[rowKey]);
    },
    [rowKey],
  );

  const handleSort = useCallback((accessor: string) => {
    setSortState((prev) => {
      if (prev.column !== accessor) {
        return { column: accessor, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column: accessor, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) return data;

    const accessor = sortState.column as keyof T;
    const direction = sortState.direction;

    return [...data].sort((a, b) => {
      const aVal = a[accessor];
      const bVal = b[accessor];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === "asc" ? -1 : 1;
      if (bVal == null) return direction === "asc" ? 1 : -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal, "pt-BR")
          : bVal.localeCompare(aVal, "pt-BR");
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return direction === "asc"
        ? aStr.localeCompare(bStr, "pt-BR")
        : bStr.localeCompare(aStr, "pt-BR");
    });
  }, [data, sortState]);

  const renderSortIcon = (accessor: string, sortable?: boolean) => {
    if (!sortable) return null;

    if (sortState.column !== accessor) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortState.direction === "asc") {
      return <ArrowUp className="h-4 w-4 text-(--color-accent)" />;
    }
    return <ArrowDown className="h-4 w-4 text-(--color-accent)" />;
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        {search && (
          <div className="mb-4">
            <SearchBar
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              disabled
            />
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {columns.map((col, colIndex) => (
                  <th
                    key={col.id ?? `${col.accessor}-${colIndex}`}
                    className={cn(
                      "px-3 py-2.5 md:px-4 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider",
                      col.hideBelow && hideClasses[col.hideBelow],
                      col.className,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonRow
                  key={i}
                  columns={columns.length}
                  hiddenCols={columns.map((c) => c.hideBelow)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- Empty State ---
  if (!data.length) {
    return (
      <div className={cn("w-full", className)}>
        {search && (
          <div className="mb-4">
            <SearchBar
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
            />
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-white">
          <EmptyState
            icon={emptyIcon}
            title={emptyMessage}
            action={emptyAction}
          />
        </div>
      </div>
    );
  }

  // --- Data Table ---
  return (
    <div className={cn("w-full", className)}>
      {search && (
        <div className="mb-4">
          <SearchBar
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col, colIndex) => (
                <th
                  key={col.id ?? `${col.accessor}-${colIndex}`}
                  className={cn(
                    "px-3 py-2.5 md:px-4 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider",
                    col.sortable &&
                      "cursor-pointer select-none hover:bg-gray-100 transition-colors",
                    col.hideBelow && hideClasses[col.hideBelow],
                    col.className,
                  )}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                  onClick={
                    col.sortable ? () => handleSort(col.accessor) : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {renderSortIcon(col.accessor, col.sortable)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={cn(
                  "border-b border-gray-100 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-gray-50",
                  !onRowClick && "hover:bg-gray-50/50",
                )}
                onClick={
                  onRowClick ? () => onRowClick(row, rowIndex) : undefined
                }
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.id ?? `${col.accessor}-${colIndex}`}
                    className={cn(
                      "px-3 py-2.5 md:px-4 md:py-3 text-(--color-secondary)",
                      col.hideBelow && hideClasses[col.hideBelow],
                      col.className,
                    )}
                    style={
                      col.minWidth ? { minWidth: col.minWidth } : undefined
                    }
                  >
                    {col.render
                      ? col.render(row[col.accessor], row, rowIndex)
                      : String(row[col.accessor] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

DataTable.displayName = "DataTable";
