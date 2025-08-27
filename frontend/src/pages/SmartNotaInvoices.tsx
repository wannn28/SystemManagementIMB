import React, { useState, useEffect } from 'react';
import { smartNotaApi, SmartNotaInvoice } from '../api/smartNota';
import { hasSmartNotaApiKey } from '../utils/apiKey';

interface SmartNotaInvoicesProps {
  isCollapsed: boolean;
}

const SmartNotaInvoices: React.FC<SmartNotaInvoicesProps> = ({ isCollapsed }) => {
  const [invoices, setInvoices] = useState<SmartNotaInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
    has_next_page: false,
    has_prev_page: false,
  });
  const [selectedInvoice, setSelectedInvoice] = useState<SmartNotaInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (hasSmartNotaApiKey()) {
      fetchInvoices();
    }
  }, [pagination.page, pagination.limit]);

  const fetchInvoices = async () => {
    if (!hasSmartNotaApiKey()) {
      setError('API Key Smart Nota belum diatur. Silakan atur di Settings.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await smartNotaApi.getInvoices({
        page: pagination.page,
        limit: pagination.limit,
        sort: 'created_at',
        order: 'desc',
      });

      setInvoices(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        total_pages: response.pagination.total_pages,
        has_next_page: response.pagination.has_next_page,
        has_prev_page: response.pagination.has_prev_page,
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Gagal mengambil data invoice. Silakan cek API Key Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (invoice: SmartNotaInvoice) => {
    try {
      // Fetch detailed invoice data
      const detailedInvoice = await smartNotaApi.getInvoice(invoice.id);
      setSelectedInvoice(detailedInvoice);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching invoice detail:', error);
      setError('Gagal mengambil detail invoice.');
    }
  };

  if (!hasSmartNotaApiKey()) {
    return (
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">API Key Belum Diatur</h2>
            <p className="text-yellow-700 mb-4">
              Untuk mengakses Smart Nota Invoices, Anda perlu mengatur API Key terlebih dahulu.
            </p>
            <button
              onClick={() => window.location.href = '/settings'}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Atur API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart Nota Invoices</h1>
            <p className="text-gray-500">Lihat daftar invoice dari Smart Nota API</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices?.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {Number(invoice.id || 0)}
                      </td>
                                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       <div>
                         <p><strong>Customer:</strong> {String(invoice.customer?.name || '-')}</p>
                         <p><strong>Template:</strong> {String(invoice.template?.name || '-')}</p>
                         <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${
                           invoice.status === 'sent' ? 'bg-green-100 text-green-800' : 
                           invoice.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                           'bg-gray-100 text-gray-800'
                         }`}>{String(invoice.status || 'unknown')}</span></p>
                       </div>
                     </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.items?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '-'}
                      </td>
                                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <button
                         onClick={() => handleViewDetail(invoice)}
                         className="text-blue-600 hover:text-blue-900"
                       >
                         Lihat Detail
                       </button>
                     </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={!pagination.has_prev_page}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.has_next_page}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Detail Invoice Modal */}
        {showDetailModal && selectedInvoice && (
            // kasih blur background
          <div className="fixed inset-0 bg-white-200  backdrop-blur-xs bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Detail Invoice #{selectedInvoice.data?.id || 0}</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Invoice Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Informasi Invoice</h4>
                    <div className="space-y-2">
                      <p><strong>ID:</strong> {Number(selectedInvoice.data?.id || 0)}</p>
                      <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${
                        selectedInvoice.data?.status === 'sent' ? 'bg-green-100 text-green-800' : 
                        selectedInvoice.data?.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>{String(selectedInvoice.data?.status || 'unknown')}</span></p>
                      <p><strong>Shared:</strong> {selectedInvoice.data?.is_shared ? 'Yes' : 'No'}</p>
                      <p><strong>Created At:</strong> {selectedInvoice.data?.created_at ? new Date(selectedInvoice.data.created_at).toLocaleString() : '-'}</p>
                      <p><strong>Updated At:</strong> {selectedInvoice.data?.updated_at ? new Date(selectedInvoice.data.updated_at).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Customer Info</h4>
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {String(selectedInvoice.data?.customer?.name || '-')}</p>
                      <p><strong>Phone:</strong> {String(selectedInvoice.data?.customer?.phone || '-')}</p>
                      <p><strong>Email:</strong> {String(selectedInvoice.data?.customer?.email || '-')}</p>
                      <p><strong>Address:</strong> {String(selectedInvoice.data?.customer?.address || '-')}</p>
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Template Info</h4>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {String(selectedInvoice.data?.template?.name || '-')}</p>
                    <p><strong>Company:</strong> {String(selectedInvoice.data?.user?.company_name || '-')}</p>
                  </div>
                </div>

                {/* Invoice Data */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Invoice Data</h4>
                  <div className="space-y-2">
                    {selectedInvoice.data?.data && typeof selectedInvoice.data.data === 'object' && Object.entries(selectedInvoice.data.data).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {String(value || '-')}
                      </p>
                    )) || (
                      <p className="text-gray-500">No data available</p>
                    )}
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Items ({selectedInvoice.data?.items?.length || 0})</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedInvoice.data?.items?.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {String(item.item_name || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Number(item.quantity || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Rp {Number(item.price || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Rp {Number(item.total || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(item.description || '-')}
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              No items found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures */}
                {selectedInvoice.data?.signatures && selectedInvoice.data.signatures.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-4">Signatures ({selectedInvoice.data.signatures?.length || 0})</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Signer Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Signed At
                            </th>
                          </tr>
                        </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInvoice.data?.signatures?.map((signature: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {String(signature.signer_name || '')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {String(signature.signer_email || '')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {String(signature.role || '')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {signature.signed_at ? new Date(signature.signed_at).toLocaleString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartNotaInvoices; 