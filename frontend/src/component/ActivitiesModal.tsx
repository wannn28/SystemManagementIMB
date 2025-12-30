import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiMinus, FiUsers, FiRefreshCw, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { activitiesAPI, PaginationParams, FrontendPagination } from '../api/activities';

interface Activity {
  type: 'income' | 'expense' | 'member' | 'project' | 'update';
  title: string;
  description: string;
  timestamp: string;
}

interface ActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivitiesModal: React.FC<ActivitiesModalProps> = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [pagination, setPagination] = useState<FrontendPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen, currentPage]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params: PaginationParams = {
        page: currentPage,
        limit: 10,
        sort: 'timestamp',
        order: 'desc'
      };
      const response = await activitiesAPI.getAllActivitiesWithPagination(params);
      console.log('Activities response:', response);
      console.log('Pagination:', response.pagination);
      setActivities(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPageInput(value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInput, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      setCurrentPage(pageNumber);
    } else {
      // Reset to current page if invalid
      setPageInput(currentPage.toString());
    }
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const totalPages = pagination.totalPages;
    const current = currentPage;

    if (totalPages <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <FiPlus className="text-white w-5 h-5" />;
      case 'expense':
        return <FiMinus className="text-white w-5 h-5" />;
      case 'member':
        return <FiUsers className="text-white w-5 h-5" />;
      case 'update':
        return <FiRefreshCw className="text-white w-5 h-5" />;
      default:
        return <FiRefreshCw className="text-white w-5 h-5" />;
    }
  };

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30';
      case 'expense':
        return 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30';
      case 'member':
        return 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30';
      case 'update':
        return 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg shadow-gray-500/30';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Semua Aktivitas</h3>
            <p className="text-sm text-gray-500 mt-1">
              Menampilkan {activities.length} dari {pagination.total} aktivitas
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiClock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-start p-4 hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-amber-50/30 rounded-xl transition-all duration-200 border border-transparent hover:border-orange-100 group"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-10 h-10 ${getActivityIconBg(activity.type)} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-900 mb-1">{activity.title}</p>
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <FiClock className="w-3 h-3 mr-1" />
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && activities.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
            <div className="flex flex-col space-y-4">
              {/* Pagination Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  <span className="font-semibold">Halaman {pagination.page}</span> dari{' '}
                  <span className="font-semibold">{pagination.totalPages}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} aktivitas
                  </span>
                </div>

                {/* Jump to Page Input */}
                <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
                  <label htmlFor="pageInput" className="text-sm text-gray-600">
                    Ke halaman:
                  </label>
                  <input
                    id="pageInput"
                    type="number"
                    min="1"
                    max={pagination.totalPages}
                    value={pageInput}
                    onChange={handlePageInputChange}
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Go
                  </button>
                </form>
              </div>

              {/* Page Numbers */}
              <div className="flex items-center justify-center space-x-1">
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-gray-400">...</span>
                    ) : (
                      <button
                        onClick={() => handlePageChange(page as number)}
                        className={`min-w-[40px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrev}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                    pagination.hasPrev
                      ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Pertama
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                      pagination.hasPrev
                        ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                      pagination.hasNext
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Selanjutnya</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={!pagination.hasNext}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                    pagination.hasNext
                      ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Terakhir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesModal;

