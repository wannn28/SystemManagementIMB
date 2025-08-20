import { financeAPI, PaginationParams, PaginatedResponse } from '../api';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FinanceEntry } from '../types/BasicTypes';
import FinancePDFExportButton from '../component/FinancePDFExportButton'

interface FinanceProps {
    isCollapsed: boolean;
}



type EditMode = {
    id: number | null;
    type: 'income' | 'expense' | null;
    data: Partial<FinanceEntry>;
}

const Finance: React.FC<FinanceProps> = ({ isCollapsed }) => {
    const [activeSection, setActiveSection] = useState<'income' | 'expense'>('income');
    const [incomeData, setIncomeData] = useState<FinanceEntry[]>([]);
    const [expenseData, setExpenseData] = useState<FinanceEntry[]>([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    
    // Filter and search state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    
    // Sorting state
    const [sortBy, setSortBy] = useState<'id' | 'tanggal' | 'jumlah' | 'status'>('id');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    
    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Build filter string for API
    const buildFilterString = useMemo(() => {
        const filters: string[] = [];
        
        if (selectedCategory) filters.push(`category:${selectedCategory}`);
        if (selectedStatus) filters.push(`status:${selectedStatus}`);
        if (startDate && endDate) filters.push(`start_date:${startDate},end_date:${endDate}`);
        if (minAmount && maxAmount) filters.push(`min_amount:${minAmount},max_amount:${maxAmount}`);
        
        return filters.join(',');
    }, [selectedCategory, selectedStatus, startDate, endDate, minAmount, maxAmount]);

    // Build pagination params
    const buildPaginationParams = useMemo((): PaginationParams => {
        return {
            page: currentPage,
            limit: pageSize,
            search: debouncedSearchTerm || undefined,
            sort: sortBy,
            order: sortOrder,
            filter: buildFilterString || undefined
        };
    }, [currentPage, pageSize, debouncedSearchTerm, sortBy, sortOrder, buildFilterString]);

    // Fetch data with pagination
    const fetchData = useCallback(async (usePagination = true) => {
        setIsLoading(true);
        try {
            if (usePagination) {
                // Use paginated API - fetch data for the active section only
                const response = await financeAPI.getFinanceByTypePaginated(activeSection, buildPaginationParams);
                
                // Set data for the active section
                if (activeSection === 'income') {
                    setIncomeData(response.data);
                    setExpenseData([]); // Clear expense data when viewing income
                } else {
                    setExpenseData(response.data);
                    setIncomeData([]); // Clear income data when viewing expense
                }
                
                // Update pagination info from the response
                setTotalPages(response.pagination.total_pages);
                setTotalRecords(response.pagination.total);
                setCurrentPage(response.pagination.page);
                setHasNext(response.pagination.has_next);
                setHasPrev(response.pagination.has_prev);
            } else {
                // Fallback to simple API
                const [incomeData, expenseData] = await Promise.all([
                    financeAPI.getFinanceByType('income'),
                    financeAPI.getFinanceByType('expense')
                ]);

                setIncomeData(incomeData);
                setExpenseData(expenseData);
                
                // Reset pagination for simple API
                setTotalPages(1);
                setTotalRecords(incomeData.length + expenseData.length);
                setCurrentPage(1);
                setHasNext(false);
                setHasPrev(false);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback to simple API
            try {
                const [incomeData, expenseData] = await Promise.all([
                    financeAPI.getFinanceByType('income'),
                    financeAPI.getFinanceByType('expense')
                ]);

                setIncomeData(incomeData);
                setExpenseData(expenseData);
                
                // Reset pagination for fallback
                setTotalPages(1);
                setTotalRecords(incomeData.length + expenseData.length);
                setCurrentPage(1);
                setHasNext(false);
                setHasPrev(false);
            } catch (fallbackError) {
                console.error('Fallback data fetching failed:', fallbackError);
                setIncomeData([]);
                setExpenseData([]);
                setTotalPages(1);
                setTotalRecords(0);
                setCurrentPage(1);
                setHasNext(false);
                setHasPrev(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, [buildPaginationParams, activeSection]);

    // Fetch data when filters change
    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
        fetchData(true);
    }, [debouncedSearchTerm, selectedCategory, selectedMonth, selectedYear, selectedStatus, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder]);

    // Fetch data when active section changes
    useEffect(() => {
        fetchData(true);
    }, [activeSection]);

    // Fetch data when page changes
    useEffect(() => {
        if (currentPage > 1) {
            fetchData(true);
        }
    }, [currentPage, pageSize]);

    // Initial data fetch
    useEffect(() => {
        fetchData(true);
    }, []);

    // Handle active section change
    const handleActiveSectionChange = (section: 'income' | 'expense') => {
        setActiveSection(section);
        setCurrentPage(1); // Reset to first page when switching sections
        // Data will be fetched automatically by the useEffect
    };

    // Handle sorting
    const handleSort = (column: 'id' | 'tanggal' | 'jumlah' | 'status') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(column);
            setSortOrder('ASC');
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle page size change
    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setSelectedMonth('');
        setSelectedYear('');
        setSelectedStatus('');
        setStartDate('');
        setEndDate('');
        setMinAmount('');
        setMaxAmount('');
        setSortBy('id');
        setSortOrder('ASC');
        setCurrentPage(1);
    };

    const [newEntry, setNewEntry] = useState({
        tanggal: '',
        unit: '',
        hargaPerUnit: '',
        keterangan: '',
        category: 'Other' as 'Barang' | 'Jasa' | 'Sewa Alat Berat' | 'Other' | 'Gaji' | 'Uang Makan' | 'Kasbon',
        status: 'Paid' as 'Unpaid' | 'Paid'
    });

    const [editMode, setEditMode] = useState<EditMode>({
        id: null,
        type: null,
        data: {}
    });

    // Totals calculation
    const totalPemasukan = useMemo(() => {
        return incomeData.reduce((sum, item) => sum + (item.unit * item.hargaPerUnit), 0);
    }, [incomeData]);

    const totalPengeluaran = useMemo(() => {
        return expenseData.reduce((sum, item) => sum + (item.unit * item.hargaPerUnit), 0);
    }, [expenseData]);

    // Edit handlers
    const handleEdit = async (id: number, type: 'income' | 'expense') => {
        try {
            const financeEntry = await financeAPI.getFinanceById(id);
            const rawDate = financeEntry.tanggal;
            const formattedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;

            setEditMode({
                id,
                type,
                data: {
                    ...financeEntry,
                    tanggal: formattedDate,
                }
            });
        } catch (error) {
            console.error('Error fetching data for edit:', error);
        }
    };

    const handleSaveEdit = async () => {
        if (editMode.id && editMode.type) {
            try {
                await financeAPI.updateFinance(editMode.id, {
                    ...editMode.data,
                    type: editMode.type,
                });
                fetchData();
                setEditMode({ id: null, type: null, data: {} });
            } catch (error) {
                console.error('Error saving edit:', error);
            }
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await financeAPI.deleteFinance(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    // Add new entry
    const handleAddEntry = async (e: React.FormEvent, type: 'income' | 'expense') => {
        e.preventDefault();
        try {
            const newEntryData: Partial<FinanceEntry> = {
                tanggal: newEntry.tanggal,
                unit: Number(newEntry.unit),
                hargaPerUnit: Number(newEntry.hargaPerUnit),
                keterangan: newEntry.keterangan,
                category: newEntry.category,
                status: newEntry.status,
                type: type
            };

            await financeAPI.createFinance(newEntryData);
            setNewEntry({ 
                tanggal: '', 
                unit: '', 
                hargaPerUnit: '', 
                keterangan: '', 
                category: 'Other' as 'Barang' | 'Jasa' | 'Sewa Alat Berat' | 'Other' | 'Gaji' | 'Uang Makan' | 'Kasbon', 
                status: 'Paid' as 'Unpaid' | 'Paid' 
            });
            fetchData();
        } catch (error) {
            console.error(`Error adding ${type}:`, error);
        }
    };

    // Editable row component
    const EditableRow = ({ item, index, type }: { item: FinanceEntry, index: number, type: 'income' | 'expense' }) => {
        const isEditing = editMode.id === item.id && editMode.type === type;

        return (
            <tr key={item.id}>
                <td className="border px-4 py-2 text-center">{index + 1}</td>
                <td className="border px-4 py-2">
                    {isEditing ? (
                        <input
                            type="date"
                            value={editMode.data.tanggal || item.tanggal.split('T')[0]}
                            onChange={(e) => setEditMode(prev => ({
                                ...prev,
                                data: { ...prev.data, tanggal: e.target.value }
                            }))}
                            className="border p-1 rounded w-full"
                        />
                    ) : (
                        item.tanggal.split('T')[0]
                    )}
                </td>
                <td className="border px-4 py-2 text-right">
                    {isEditing ? (
                        <input
                            type="number"
                            value={editMode.data.unit ?? item.unit}
                            onChange={(e) => setEditMode(prev => ({
                                ...prev,
                                data: { ...prev.data, unit: Number(e.target.value) }
                            }))}
                            className="border p-1 rounded w-20"
                        />
                    ) : (
                        item.unit
                    )}
                </td>
                <td className="border px-4 py-2 text-right">
                    {isEditing ? (
                        <input
                            type="number"
                            value={editMode.data.hargaPerUnit ?? item.hargaPerUnit}
                            onChange={(e) => setEditMode(prev => ({
                                ...prev,
                                data: { ...prev.data, hargaPerUnit: Number(e.target.value) }
                            }))}
                            className="border p-1 rounded w-32"
                        />
                    ) : (
                        `Rp ${item.hargaPerUnit.toLocaleString()}`
                    )}
                </td>
                <td className="border px-4 py-2 text-right">
                    Rp {(item.unit * item.hargaPerUnit).toLocaleString()}
                </td>
                <td className="border px-4 py-2">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editMode.data.keterangan ?? item.keterangan}
                            onChange={(e) => setEditMode(prev => ({
                                ...prev,
                                data: { ...prev.data, keterangan: e.target.value }
                            }))}
                            className="border p-1 rounded w-full"
                        />
                    ) : (
                        item.keterangan
                    )}
                </td>
                <td className="border px-4 py-2">
                    {isEditing ? (
                        <select
                            value={editMode.data.category || item.category}
                            onChange={(e) => setEditMode(prev => ({
                                ...prev,
                                data: { ...prev.data, category: e.target.value as any }
                            }))}
                            className="border p-1 rounded w-full"
                        >
                            <option value="Barang">Barang</option>
                            <option value="Jasa">Jasa</option>
                            <option value="Sewa Alat Berat">Sewa Alat Berat</option>
                            <option value="Gaji">Gaji</option>
                            <option value="Kasbon">Kasbon</option>
                            <option value="Uang Makan">Uang Makan</option>
                            <option value="Other">Lainnya</option>
                        </select>
                    ) : (
                        item.category
                    )}
                </td>
                {/* Di dalam EditableRow */}
                <td className="border px-4 py-2">
                    {isEditing ? (
                        <select
                            value={editMode.data.status || item.status}
                            onChange={(e) => setEditMode(prev => ({
                                ...prev,
                                data: { ...prev.data, status: e.target.value as 'Paid' | 'Unpaid' }
                            }))}
                            className="border p-1 rounded w-full"
                        >
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                    ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Paid' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                            {item.status}
                        </span>
                    )}
                </td>
                <td className="border px-4 py-2 space-x-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveEdit}
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            >
                                💾
                            </button>
                            <button
                                onClick={() => setEditMode({ id: null, type: null, data: {} })}
                                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                            >
                                ✖
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => handleEdit(item.id, type)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                            >
                                🗑
                            </button>
                        </>
                    )}
                </td>
            </tr>
        );
    };

    return (
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Finance Management</h1>

                {/* Filter Section */}
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                        Filter & Pencarian
                    </h3>
                    
                    {/* Basic Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari keterangan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border p-2 rounded w-full pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${selectedCategory ? 'border-blue-500 bg-blue-50' : ''}`}
                        >
                            <option value="">Semua Kategori</option>
                            <option value="Barang">Barang</option>
                            <option value="Jasa">Jasa</option>
                            <option value="Sewa Alat Berat">Sewa Alat Berat</option>
                            <option value="Gaji">Gaji</option>
                            <option value="Kasbon">Kasbon</option>
                            <option value="Uang Makan">Uang Makan</option>
                            <option value="Other">Lainnya</option>
                        </select>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${selectedMonth ? 'border-blue-500 bg-blue-50' : ''}`}
                        >
                            <option value="">Semua Bulan</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                                    {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Tahun"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${selectedYear ? 'border-blue-500 bg-blue-50' : ''}`}
                            min="2000"
                            max="2100"
                        />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${selectedStatus ? 'border-blue-500 bg-blue-50' : ''}`}
                        >
                            <option value="">Semua Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                        <button
                            onClick={resetFilters}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200 font-medium shadow-sm"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Enhanced Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rentang Tanggal</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={`border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${startDate && endDate ? 'border-blue-500 bg-blue-50' : ''}`}
                                    placeholder="Dari"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={`border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${startDate && endDate ? 'border-blue-500 bg-blue-50' : ''}`}
                                    placeholder="Sampai"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rentang Jumlah</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className={`border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${minAmount && maxAmount ? 'border-blue-500 bg-blue-50' : ''}`}
                                    min="0"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className={`border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${minAmount && maxAmount ? 'border-blue-500 bg-blue-50' : ''}`}
                                    min="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah per Halaman</label>
                            <select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 shadow-sm"
                            >
                                <option value={5}>5 data</option>
                                <option value={10}>10 data</option>
                                <option value={20}>20 data</option>
                                <option value={50}>50 data</option>
                                <option value={100}>100 data</option>
                                <option value={1000}>1.000 data</option>
                                <option value={10000}>10.000 data</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => fetchData(true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full disabled:opacity-50 transition-colors duration-200 font-medium shadow-sm"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'Refresh Data'}
                            </button>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchTerm || selectedCategory || selectedMonth || selectedYear || selectedStatus || startDate || endDate || minAmount || maxAmount) && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">Filter Aktif:</h4>
                            <div className="flex flex-wrap gap-2">
                                {searchTerm && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Search: {searchTerm}
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                                {selectedCategory && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Category: {selectedCategory}
                                        <button
                                            onClick={() => setSelectedCategory('')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                                {selectedMonth && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Month: {new Date(0, parseInt(selectedMonth) - 1).toLocaleString('id-ID', { month: 'long' })}
                                        <button
                                            onClick={() => setSelectedMonth('')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                                {selectedYear && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Year: {selectedYear}
                                        <button
                                            onClick={() => setSelectedYear('')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                                {selectedStatus && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Status: {selectedStatus}
                                        <button
                                            onClick={() => setSelectedStatus('')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                                {(startDate || endDate) && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Date Range: {startDate} - {endDate}
                                        <button
                                            onClick={() => { setStartDate(''); setEndDate(''); }}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                                {(minAmount || maxAmount) && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Amount Range: {minAmount || '0'} - {maxAmount || '∞'}
                                        <button
                                            onClick={() => { setMinAmount(''); setMaxAmount(''); }}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Total Cards */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="text-sm font-semibold text-green-600">TOTAL PEMASUKAN</h3>
                            <p className="text-2xl font-bold text-green-700">
                                Rp {totalPemasukan.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h3 className="text-sm font-semibold text-red-600">TOTAL PENGELUARAN</h3>
                            <p className="text-2xl font-bold text-red-700">
                                Rp {totalPengeluaran.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => handleActiveSectionChange('income')}
                        className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all duration-200 ${
                            activeSection === 'income'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={isLoading}
                    >
                        Pemasukan
                        {isLoading && activeSection === 'income' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        )}
                    </button>
                    <button
                        onClick={() => handleActiveSectionChange('expense')}
                        className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all duration-200 ${
                            activeSection === 'expense'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={isLoading}
                    >
                        Pengeluaran
                        {isLoading && activeSection === 'expense' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        )}
                    </button>
                    <FinancePDFExportButton
                        data={activeSection === 'income' ? incomeData : expenseData}
                        type={activeSection}
                        total={activeSection === 'income' ? totalPemasukan : totalPengeluaran}
                        month={selectedMonth}
                        year={selectedYear}
                        searchTerm={searchTerm}
                        category={selectedCategory}
                    />
                </div>

                {/* Active Section Content */}
                <div className="bg-white rounded-lg shadow">
                    {/* Add New Form */}
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            Tambah {activeSection === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </h2>

                        <form
                            onSubmit={(e) => handleAddEntry(e, activeSection)}
                            className="grid grid-cols-1 md:grid-cols-6 gap-4"
                        >
                            <input
                                type="date"
                                value={newEntry.tanggal}
                                onChange={(e) => setNewEntry({ ...newEntry, tanggal: e.target.value })}
                                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Jumlah Unit"
                                value={newEntry.unit}
                                onChange={(e) => setNewEntry({ ...newEntry, unit: e.target.value })}
                                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Harga per Unit"
                                value={newEntry.hargaPerUnit}
                                onChange={(e) => setNewEntry({ ...newEntry, hargaPerUnit: e.target.value })}
                                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Keterangan"
                                value={newEntry.keterangan}
                                onChange={(e) => setNewEntry({ ...newEntry, keterangan: e.target.value })}
                                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <select
                                value={newEntry.category}
                                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as 'Barang' | 'Jasa' | 'Sewa Alat Berat' | 'Other' | 'Gaji' | 'Uang Makan' | 'Kasbon' })}
                                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="Other">Pilih Kategori</option>
                                <option value="Barang">Barang</option>
                                <option value="Jasa">Jasa</option>
                                <option value="Sewa Alat Berat">Sewa Alat Berat</option>
                                <option value="Gaji">Gaji</option>
                                <option value="Kasbon">Kasbon</option>
                                <option value="Uang Makan">Uang Makan</option>
                                <option value="Other">Lainnya</option>
                            </select>
                            <select
                                value={newEntry.status}
                                onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value as 'Paid' | 'Unpaid' })}
                                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                            </select>
                            <button
                                type="submit"
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200 font-medium"
                            >
                                Tambah
                            </button>
                        </form>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto">
                        {/* Table Summary */}
                        <div className="bg-gray-50 p-3 border-b">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">{activeSection === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                                    {totalRecords > 0 && (
                                        <span className="ml-2">
                                            • Halaman {currentPage} dari {totalPages} • Total {totalRecords} data
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {isLoading ? 'Memuat data...' : 'Data siap'}
                                </div>
                            </div>
                        </div>
                        
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className="border px-4 py-3 w-12 cursor-pointer hover:bg-gray-100 transition-colors duration-200 font-medium text-gray-700"
                                        onClick={() => handleSort('id')}
                                    >
                                        No {sortBy === 'id' && (sortOrder === 'ASC' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        className="border px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors duration-200 font-medium text-gray-700"
                                        onClick={() => handleSort('tanggal')}
                                    >
                                        Tanggal {sortBy === 'tanggal' && (sortOrder === 'ASC' ? '↑' : '↓')}
                                    </th>
                                    <th className="border px-4 py-3 font-medium text-gray-700">Unit</th>
                                    <th className="border px-4 py-3 font-medium text-gray-700">Harga/Unit</th>
                                    <th
                                        className="border px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors duration-200 font-medium text-gray-700"
                                        onClick={() => handleSort('jumlah')}
                                    >
                                        Jumlah {sortBy === 'jumlah' && (sortOrder === 'ASC' ? '↑' : '↓')}
                                    </th>
                                    <th className="border px-4 py-3 font-medium text-gray-700">Keterangan</th>
                                    <th className="border px-4 py-3 font-medium text-gray-700">Kategori</th>
                                    <th
                                        className="border px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors duration-200 font-medium text-gray-700"
                                        onClick={() => handleSort('status')}
                                    >
                                        Status {sortBy === 'status' && (sortOrder === 'ASC' ? '↑' : '↓')}
                                    </th>
                                    <th className="border px-4 py-3 w-32 font-medium text-gray-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                                <span className="ml-3 text-gray-600 font-medium">Memuat data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (activeSection === 'income' ? incomeData : expenseData).length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-lg font-medium">Tidak ada data {activeSection === 'income' ? 'pemasukan' : 'pengeluaran'}</p>
                                                <p className="text-sm text-gray-400">Coba ubah filter atau tambah data baru</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (activeSection === 'income' ? incomeData : expenseData).map((item, index) => (
                                        <EditableRow
                                            key={item.id}
                                            item={item}
                                            index={((currentPage - 1) * pageSize) + index}
                                            type={activeSection}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="bg-white p-6 border-t">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">
                                        Menampilkan {((currentPage - 1) * pageSize) + 1} sampai {Math.min(currentPage * pageSize, totalRecords)} dari {totalRecords} hasil
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={!hasPrev || isLoading}
                                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Sebelumnya
                                    </button>
                                    
                                    {/* Page Numbers */}
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                                        currentPage === pageNum
                                                            ? 'bg-blue-600 text-white shadow-md'
                                                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Next Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={!hasNext || isLoading}
                                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                                    >
                                        Selanjutnya
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Finance;