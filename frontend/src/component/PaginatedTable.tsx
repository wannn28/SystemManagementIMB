import React, { useState, useEffect } from 'react';
import { QueryParams, PaginationState } from '../types/BasicTypes';

interface PaginatedTableProps<T> {
  data: T[];
  pagination: PaginationState;
  onQueryChange: (params: QueryParams) => void;
  searchFields: { key: keyof T; label: string }[];
  sortFields: { key: keyof T; label: string }[];
  filterFields: { key: keyof T; label: string; options: { value: string; label: string }[] }[];
  renderRow: (item: T, index: number) => React.ReactNode;
  renderHeader: () => React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function PaginatedTable<T>({
  data,
  pagination,
  onQueryChange,
  searchFields,
  sortFields,
  filterFields,
  renderRow,
  renderHeader,
  loading = false,
  className = ''
}: PaginatedTableProps<T>) {
  const [currentParams, setCurrentParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    search: '',
    sort: '',
    order: 'ASC',
    filter: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      handleQueryChange();
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, selectedSort, selectedOrder, selectedFilters]);

  const handleQueryChange = () => {
    const filterString = Object.entries(selectedFilters)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}:${value}`)
      .join(',');

    const newParams: QueryParams = {
      ...currentParams,
      page: 1, // Reset to first page when filters change
      search: searchTerm,
      sort: selectedSort,
      order: selectedOrder,
      filter: filterString
    };

    setCurrentParams(newParams);
    onQueryChange(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = { ...currentParams, page: newPage };
    setCurrentParams(newParams);
    onQueryChange(newParams);
  };

  const handleLimitChange = (newLimit: number) => {
    const newParams = { ...currentParams, limit: newLimit, page: 1 };
    setCurrentParams(newParams);
    onQueryChange(newParams);
  };

  const handleFilterChange = (field: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    const startPage = Math.max(1, pagination.page - Math.floor(maxButtons / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(pagination.page - 1)}
        disabled={!pagination.hasPrev}
        className="px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
      >
        Previous
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded ${
            i === pagination.page
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(pagination.page + 1)}
        disabled={!pagination.hasNext}
        className="px-3 py-1 mx-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
      >
        Next
      </button>
    );

    return buttons;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search by ${searchFields.map(f => f.label).join(', ')}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <div className="flex space-x-2">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Sort</option>
                {sortFields.map(field => (
                  <option key={String(field.key)} value={String(field.key)}>
                    {field.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value as 'ASC' | 'DESC')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ASC">ASC</option>
                <option value="DESC">DESC</option>
              </select>
            </div>
          </div>

          {/* Filters */}
          {filterFields.map(filter => (
            <div key={String(filter.key)}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filter.label}
              </label>
              <select
                value={selectedFilters[String(filter.key)] || ''}
                onChange={(e) => handleFilterChange(String(filter.key), e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All {filter.label}</option>
                {filter.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Items per page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per page
            </label>
            <select
              value={currentParams.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {renderHeader()}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? (
                  data.map((item, index) => renderRow(item, index))
                ) : (
                  <tr>
                    <td colSpan={100} className="px-6 py-4 text-center text-gray-500">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-1">
              {renderPaginationButtons()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}