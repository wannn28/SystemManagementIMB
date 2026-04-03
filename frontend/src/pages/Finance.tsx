import { financeAPI, PaginationParams, EquipmentMonthlyFinanceRow } from '../api/finance';
import { equipmentApi } from '../api/equipment';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FinanceEntry } from '../types/BasicTypes';
import type { Equipment } from '../types/equipment';
import FinancePDFExportButton from '../component/FinancePDFExportButton';
import FinanceEntryModal, { FinanceFormData } from '../component/FinanceEntryModal';
import { useLocation } from 'react-router-dom';
import { confirmDialog } from '../utils/confirmDialog';

interface FinanceProps {
    isCollapsed: boolean;
}

const Finance: React.FC<FinanceProps> = ({ isCollapsed }) => {
    const location = useLocation();
    const [activeSection, setActiveSection] = useState<'income' | 'expense'>('income');
    const [incomeData, setIncomeData] = useState<FinanceEntry[]>([]);
    const [expenseData, setExpenseData] = useState<FinanceEntry[]>([]);
    const [categories, setCategories] = useState<Array<{id:number; name:string}>>([]);
    const [showManageCategories, setShowManageCategories] = useState(false);
    
    // Reusable category autocomplete input
    const CategoryAutocomplete = ({
        value,
        onChange,
        placeholder,
        inputClassName = '',
        debounceMs = 0,
    }: { value: string; onChange: (v: string) => void; placeholder?: string; inputClassName?: string; debounceMs?: number }) => {
        const [open, setOpen] = useState(false);
        const [hoverIndex, setHoverIndex] = useState<number>(-1);
        const [internalValue, setInternalValue] = useState<string>(value || '');

        useEffect(() => {
            setInternalValue(value || '');
        }, [value]);

        useEffect(() => {
            if (debounceMs > 0) {
                const t = setTimeout(() => {
                    onChange(internalValue);
                }, debounceMs);
                return () => clearTimeout(t);
            }
        }, [internalValue, debounceMs, onChange]);

        const filtered = useMemo(() => {
            const v = (internalValue || '').toLowerCase();
            const names = categories.map(c => c.name);
            const uniq = Array.from(new Set(names));
            if (!v) return uniq.slice(0, 8);
            return uniq.filter(n => n.toLowerCase().includes(v)).slice(0, 8);
        }, [internalValue, categories]);

        const select = (name: string) => {
            setInternalValue(name);
            onChange(name);
            setOpen(false);
        };

        return (
            <div className="relative w-full" onBlur={() => setTimeout(() => setOpen(false), 120)}>
                <input
                    type="text"
                    value={internalValue}
                    onChange={(e) => { debounceMs === 0 ? onChange(e.target.value) : undefined; setInternalValue(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full ${inputClassName}`}
                />
                {open && filtered.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                        {filtered.map((name, idx) => (
                            <button
                                type="button"
                                key={name}
                                onMouseEnter={() => setHoverIndex(idx)}
                                onMouseLeave={() => setHoverIndex(-1)}
                                onClick={() => select(name)}
                                className={`block w-full text-left px-3 py-2 text-sm ${hoverIndex === idx ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };
    
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
    const [selectedTaxStatus, setSelectedTaxStatus] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [selectedKategoriUtama, setSelectedKategoriUtama] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [equipmentSummaryRows, setEquipmentSummaryRows] = useState<EquipmentMonthlyFinanceRow[]>([]);
    const [equipmentSummaryLoading, setEquipmentSummaryLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    
    // Sorting state — default: tanggal terbaru dulu
    const [sortBy, setSortBy] = useState<'id' | 'tanggal' | 'jumlah' | 'status' | 'tax_paid'>('tanggal');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const equipmentById = useMemo(() => {
        const m = new Map<number, Equipment>();
        equipmentList.forEach(e => m.set(e.id, e));
        return m;
    }, [equipmentList]);

    const equipmentSummaryMonth = useMemo(() => {
        if (!selectedYear || !selectedMonth) return '';
        return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    }, [selectedYear, selectedMonth]);
    
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
        if (selectedProjectId) filters.push(`project_id:${selectedProjectId}`);
        if (selectedEquipmentId === 'none') filters.push('equipment_id:none');
        else if (selectedEquipmentId) filters.push(`equipment_id:${selectedEquipmentId}`);
        if (selectedTaxStatus) filters.push(`tax_paid:${selectedTaxStatus === 'paid' ? 'true' : 'false'}`);
        if (selectedPaymentMethod) filters.push(`payment_method:${selectedPaymentMethod}`);
        if (selectedKategoriUtama) filters.push(`kategori_utama:${selectedKategoriUtama}`);
        if (startDate && endDate) filters.push(`start_date:${startDate},end_date:${endDate}`);
        if (minAmount && maxAmount) filters.push(`min_amount:${minAmount},max_amount:${maxAmount}`);
        
        return filters.join(',');
    }, [selectedCategory, selectedStatus, selectedProjectId, selectedEquipmentId, selectedTaxStatus, selectedPaymentMethod, selectedKategoriUtama, startDate, endDate, minAmount, maxAmount]);

    // Read optional presets from URL (?type=expense&project_id=11)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const t = params.get('type');
        const pid = params.get('project_id');
        const eid = params.get('equipment_id');
        if (t === 'income' || t === 'expense') setActiveSection(t);
        if (pid) setSelectedProjectId(pid);
        if (eid) setSelectedEquipmentId(eid);
        // reset to first page when opening with presets
        setCurrentPage(1);
    }, [location.search]);

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
    }, [debouncedSearchTerm, selectedCategory, selectedMonth, selectedYear, selectedStatus, selectedTaxStatus, selectedPaymentMethod, selectedKategoriUtama, selectedEquipmentId, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder]);

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

    useEffect(() => {
        if (!equipmentSummaryMonth) {
            setEquipmentSummaryRows([]);
            return;
        }
        let cancelled = false;
        setEquipmentSummaryLoading(true);
        financeAPI
            .getMonthlySummaryByEquipment(equipmentSummaryMonth)
            .then(rows => {
                if (!cancelled) setEquipmentSummaryRows(rows);
            })
            .catch(() => {
                if (!cancelled) setEquipmentSummaryRows([]);
            })
            .finally(() => {
                if (!cancelled) setEquipmentSummaryLoading(false);
            });
        return () => { cancelled = true; };
    }, [equipmentSummaryMonth]);

    // Initial data fetch
    useEffect(() => {
        fetchData(true);
        (async () => {
            try {
                const list = await financeAPI.categories.list();
                setCategories(list);
            } catch (e) {
                console.error('Error loading categories:', e);
            }
            try {
                const eq = await equipmentApi.getList();
                setEquipmentList(eq);
            } catch (e) {
                console.error('Error loading equipment:', e);
            }
        })();
    }, []);

    // Handle active section change
    const handleActiveSectionChange = (section: 'income' | 'expense') => {
        setActiveSection(section);
        setCurrentPage(1); // Reset to first page when switching sections
        // Data will be fetched automatically by the useEffect
    };

    // Handle sorting
    const handleSort = (column: 'id' | 'tanggal' | 'jumlah' | 'status' | 'tax_paid') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
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
        setSelectedTaxStatus('');
        setSelectedPaymentMethod('');
        setSelectedKategoriUtama('');
        setStartDate('');
        setEndDate('');
        setMinAmount('');
        setMaxAmount('');
        setSelectedEquipmentId('');
        setSortBy('id');
        setSortOrder('asc');
        setCurrentPage(1);
    };

    const [showEntryModal, setShowEntryModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Partial<FinanceEntry> | null>(null);
    const [savingEntry, setSavingEntry] = useState(false);

    // Totals calculation
    const totalPemasukan = useMemo(() => {
        return incomeData.reduce((sum, item) => sum + (item.unit * item.hargaPerUnit), 0);
    }, [incomeData]);

    const totalPengeluaran = useMemo(() => {
        return expenseData.reduce((sum, item) => sum + (item.unit * item.hargaPerUnit), 0);
    }, [expenseData]);

    // Modal handlers
    const handleOpenAdd = () => {
        setEditingEntry(null);
        setShowEntryModal(true);
    };

    const handleOpenEdit = async (id: number) => {
        try {
            const entry = await financeAPI.getFinanceById(id);
            const rawDate = entry.tanggal;
            const formattedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
            setEditingEntry({ ...entry, tanggal: formattedDate });
            setShowEntryModal(true);
        } catch (error) {
            console.error('Error fetching data for edit:', error);
        }
    };

    const handleSaveEntry = async (data: FinanceFormData) => {
        setSavingEntry(true);
        try {
            const catName = data.category || '';
            if (catName) {
                const exists = categories.some(c => c.name === catName);
                if (!exists) {
                    try {
                        await financeAPI.categories.create(catName);
                        const list = await financeAPI.categories.list();
                        setCategories(list);
                    } catch (e) {
                        console.error('Error creating category:', e);
                    }
                }
            }
            const { equipmentId: eqField, ...rest } = data;
            const equipmentId = eqField === '' ? null : eqField;
            const payload = { ...rest, type: activeSection, equipmentId };
            if (editingEntry?.id) {
                await financeAPI.updateFinance(editingEntry.id, payload);
            } else {
                await financeAPI.createFinance(payload);
            }
            setShowEntryModal(false);
            setEditingEntry(null);
            fetchData();
        } catch (error) {
            console.error('Error saving entry:', error);
        } finally {
            setSavingEntry(false);
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

    const handleDeleteCategory = async (id: number) => {
        try {
            await financeAPI.categories.delete(id);
            const list = await financeAPI.categories.list();
            setCategories(list);
            const deleted = categories.find(c => c.id === id)?.name;
            if (deleted && selectedCategory === deleted) setSelectedCategory('');
        } catch (e) {
            console.error('Error deleting category:', e);
        }
    };

    const statusClass = (status: string) => {
        if (status === 'Paid') return 'bg-green-100 text-green-700 border border-green-200';
        if (status === 'Partial') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        return 'bg-red-100 text-red-700 border border-red-200';
    };

    // Table row component (view-only, edit via modal)
    const TableRow = ({ item, index }: { item: FinanceEntry, index: number }) => (
        <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
            <td className="border border-gray-200 px-3 py-2.5 text-center font-medium text-gray-700 text-sm">{index + 1}</td>
            <td className="border border-gray-200 px-3 py-2.5 text-sm whitespace-nowrap">{item.tanggal.split('T')[0]}</td>
            <td className="border border-gray-200 px-3 py-2.5 text-sm text-gray-500">{item.noBukti || <span className="text-gray-300">—</span>}</td>
            <td className="border border-gray-200 px-3 py-2.5 text-sm">{item.vendorName || <span className="text-gray-300">—</span>}</td>
            <td className="border border-gray-200 px-3 py-2.5 text-right font-bold text-sm whitespace-nowrap">
                Rp {(item.unit * item.hargaPerUnit).toLocaleString('id-ID')}
            </td>
            <td className="border border-gray-200 px-3 py-2.5 text-sm max-w-xs truncate">{item.keterangan}</td>
            <td className="border border-gray-200 px-3 py-2.5 text-sm">
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{item.category}</span>
            </td>
            <td className="border border-gray-200 px-3 py-2.5 text-sm max-w-[140px] truncate" title={item.equipmentId != null ? (equipmentById.get(item.equipmentId)?.name ?? '') : ''}>
                {item.equipmentId != null ? (
                    <span className="text-gray-800">{equipmentById.get(item.equipmentId)?.name ?? `ID ${item.equipmentId}`}</span>
                ) : (
                    <span className="text-gray-300">—</span>
                )}
            </td>
            <td className="border border-gray-200 px-3 py-2.5 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusClass(item.status)}`}>{item.status}</span>
            </td>
            <td className="border border-gray-200 px-3 py-2.5 text-sm text-center whitespace-nowrap">{item.paymentMethod || <span className="text-gray-300">—</span>}</td>
            <td className="border border-gray-200 px-3 py-2.5 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(item.taxPaid ?? false)
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                    {(item.taxPaid ?? false) ? 'Sudah' : 'Belum'}
                </span>
            </td>
            <td className="border border-gray-200 px-3 py-2.5">
                <div className="flex gap-1.5">
                    <button
                        onClick={() => handleOpenEdit(item.id)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-1.5 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-sm"
                        title="Edit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-1.5 rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-sm"
                        title="Hapus"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'} bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 min-h-screen`}>
            <div className="max-w-7xl mx-auto pl-10 pr-8 py-8">
                {/* Modern Header */}
                <div className="mb-8 animate-fadeInUp">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                Manajemen Keuangan
                            </h1>
                            <p className="text-gray-600 mt-1">Kelola pemasukan dan pengeluaran perusahaan</p>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
                    </div>
                    
                    {/* Basic Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-3 mb-6">
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
                        <CategoryAutocomplete
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            placeholder="Filter kategori (contoh: Minyak)"
                            inputClassName={`${selectedCategory ? 'border-blue-500 bg-blue-50' : ''}`}
                            debounceMs={5000}
                        />
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
                            <option value="Partial">Partial</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                        <select
                            value={selectedTaxStatus}
                            onChange={(e) => setSelectedTaxStatus(e.target.value)}
                            className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${selectedTaxStatus ? 'border-blue-500 bg-blue-50' : ''}`}
                        >
                            <option value="">Semua Pajak</option>
                            <option value="paid">Sudah Pajak</option>
                            <option value="unpaid">Belum Pajak</option>
                        </select>
                        <select
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${selectedPaymentMethod ? 'border-blue-500 bg-blue-50' : ''}`}
                        >
                            <option value="">Semua Metode</option>
                            <option value="Tunai">Tunai</option>
                            <option value="Transfer Bank">Transfer Bank</option>
                            <option value="QRIS">QRIS</option>
                            <option value="Debit">Debit</option>
                            <option value="Cek">Cek</option>
                            <option value="Giro">Giro</option>
                        </select>
                        <select
                            value={selectedKategoriUtama}
                            onChange={(e) => setSelectedKategoriUtama(e.target.value)}
                            className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${selectedKategoriUtama ? 'border-blue-500 bg-blue-50' : ''}`}
                        >
                            <option value="">Semua Kat. Utama</option>
                            <option value="Operasional">Operasional</option>
                            <option value="Pembelian">Pembelian</option>
                            <option value="Aset">Aset</option>
                            <option value="Pajak">Pajak</option>
                            <option value="Owner/Pribadi">Owner/Pribadi</option>
                        </select>
                        <select
                            value={selectedEquipmentId}
                            onChange={(e) => setSelectedEquipmentId(e.target.value)}
                            title="Filter berdasarkan alat berat"
                            className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm ${selectedEquipmentId ? 'border-blue-500 bg-blue-50' : ''}`}
                        >
                            <option value="">Semua alat</option>
                            <option value="none">Tanpa alat berat</option>
                            {equipmentList.map(eq => (
                                <option key={eq.id} value={String(eq.id)}>{eq.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={resetFilters}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center gap-2 border border-gray-300"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowManageCategories(v => !v)}
                                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium text-sm flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showManageCategories ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                </svg>
                                Kategori
                            </button>
                        </div>
                    </div>

                    {showManageCategories && (
                        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Daftar Kategori
                                </h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{categories.length} kategori</span>
                            </div>
                            {categories.length === 0 ? (
                                <div className="text-center py-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <p className="text-sm text-gray-500">Belum ada kategori</p>
                                    <p className="text-xs text-gray-400 mt-1">Kategori akan dibuat otomatis saat menambah data</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => (
                                        <div 
                                            key={c.id} 
                                            className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1.5 rounded-lg text-sm hover:shadow-md transition-all duration-200"
                                        >
                                            <span className="font-medium text-gray-700">{c.name}</span>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const confirmed = await confirmDialog({
                                                        title: `Hapus kategori "${c.name}"?`,
                                                        confirmText: 'Hapus',
                                                        cancelText: 'Batal',
                                                        variant: 'danger',
                                                    });
                                                    if (confirmed) handleDeleteCategory(c.id);
                                                }}
                                                className="text-gray-400 hover:text-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                                                aria-label={`Hapus ${c.name}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Enhanced Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 w-full disabled:opacity-50 transition-all duration-200 font-semibold shadow-md flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Data
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchTerm || selectedCategory || selectedMonth || selectedYear || selectedStatus || selectedTaxStatus || selectedPaymentMethod || selectedKategoriUtama || selectedEquipmentId || startDate || endDate || minAmount || maxAmount) && (
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
                                {selectedTaxStatus && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Pajak: {selectedTaxStatus === 'paid' ? 'Sudah Pajak' : 'Belum Pajak'}
                                        <button onClick={() => setSelectedTaxStatus('')} className="ml-1 text-blue-600 hover:text-blue-800">✕</button>
                                    </span>
                                )}
                                {selectedPaymentMethod && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Metode: {selectedPaymentMethod}
                                        <button onClick={() => setSelectedPaymentMethod('')} className="ml-1 text-blue-600 hover:text-blue-800">✕</button>
                                    </span>
                                )}
                                {selectedKategoriUtama && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Kategori: {selectedKategoriUtama}
                                        <button onClick={() => setSelectedKategoriUtama('')} className="ml-1 text-blue-600 hover:text-blue-800">✕</button>
                                    </span>
                                )}
                                {selectedEquipmentId && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Alat: {selectedEquipmentId === 'none' ? 'Tanpa alat' : (equipmentById.get(Number(selectedEquipmentId))?.name ?? `#${selectedEquipmentId}`)}
                                        <button onClick={() => setSelectedEquipmentId('')} className="ml-1 text-blue-600 hover:text-blue-800">✕</button>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-600">Total Pemasukan</h3>
                                </div>
                            </div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                Rp {totalPemasukan.toLocaleString('id-ID')}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Total pendapatan
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-600">Total Pengeluaran</h3>
                                </div>
                            </div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                                Rp {totalPengeluaran.toLocaleString('id-ID')}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                                Total biaya operasional
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${totalPemasukan - totalPengeluaran >= 0 ? 'from-blue-500 to-indigo-500' : 'from-orange-500 to-red-500'} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-600">Saldo Bersih</h3>
                                </div>
                            </div>
                            <p className={`text-3xl font-bold ${totalPemasukan - totalPengeluaran >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                Rp {(totalPemasukan - totalPengeluaran).toLocaleString('id-ID')}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {totalPemasukan - totalPengeluaran >= 0 ? 'Surplus' : 'Defisit'}
                            </div>
                        </div>
                    </div>
                </div>

                {equipmentSummaryMonth && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">
                            Ringkasan per alat berat ({equipmentSummaryMonth})
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">Bulan dari filter di atas. Hanya transaksi yang sudah ditautkan ke alat berat.</p>
                        {equipmentSummaryLoading ? (
                            <p className="text-sm text-gray-500">Memuat ringkasan…</p>
                        ) : equipmentSummaryRows.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                Belum ada pemasukan/pengeluaran dengan alat berat di bulan ini, atau belum ada yang ditautkan.
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-semibold">Alat</th>
                                            <th className="text-right px-3 py-2 font-semibold">Pemasukan</th>
                                            <th className="text-right px-3 py-2 font-semibold">Pengeluaran</th>
                                            <th className="text-right px-3 py-2 font-semibold">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equipmentSummaryRows.map(row => {
                                            const saldo = row.income - row.expense;
                                            return (
                                                <tr key={row.equipmentId} className="border-t border-gray-100">
                                                    <td className="px-3 py-2 font-medium text-gray-800">{row.equipmentName}</td>
                                                    <td className="px-3 py-2 text-right text-green-700">Rp {row.income.toLocaleString('id-ID')}</td>
                                                    <td className="px-3 py-2 text-right text-red-700">Rp {row.expense.toLocaleString('id-ID')}</td>
                                                    <td className={`px-3 py-2 text-right font-semibold ${saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                                        Rp {saldo.toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => handleActiveSectionChange('income')}
                        className={`px-6 py-3 rounded-xl flex items-center gap-3 font-semibold transition-all duration-300 ${
                            activeSection === 'income'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200 scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:scale-105'
                        }`}
                        disabled={isLoading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Pemasukan
                        {isLoading && activeSection === 'income' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        )}
                    </button>
                    <button
                        onClick={() => handleActiveSectionChange('expense')}
                        className={`px-6 py-3 rounded-xl flex items-center gap-3 font-semibold transition-all duration-300 ${
                            activeSection === 'expense'
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-200 scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:scale-105'
                        }`}
                        disabled={isLoading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    {/* Header + Add Button */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-800">
                            Data {activeSection === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </h2>
                        <button
                            onClick={handleOpenAdd}
                            className={`${activeSection === 'income'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                            } text-white px-4 py-2 rounded-xl transition-all duration-200 font-semibold shadow-md flex items-center gap-2 text-sm`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah {activeSection === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </button>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto">
                        {/* Table Summary */}
                        <div className={`${activeSection === 'income' ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-red-50 to-rose-50'} p-4 border-b border-gray-200`}>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold">{activeSection === 'income' ? '📊 Data Pemasukan' : '📊 Data Pengeluaran'}</span>
                                    {totalRecords > 0 && (
                                        <span className="ml-2 text-gray-600">
                                            • Halaman {currentPage} dari {totalPages} • Total {totalRecords} data
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                            <span className="text-sm text-gray-600 font-medium">Memuat data...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-sm text-gray-600 font-medium">Data siap</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <table className="w-full min-w-max">
                            <thead className={`${activeSection === 'income' ? 'bg-gradient-to-r from-green-100 to-emerald-100' : 'bg-gradient-to-r from-red-100 to-rose-100'} text-xs`}>
                                <tr>
                                    <th className="border border-gray-200 px-3 py-2.5 w-10 cursor-pointer hover:bg-white/50 font-semibold text-gray-800" onClick={() => handleSort('id')}>
                                        <div className="flex items-center justify-center gap-1">No {sortBy === 'id' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-white/50 font-semibold text-gray-800" onClick={() => handleSort('tanggal')}>
                                        <div className="flex items-center justify-center gap-1">Tanggal {sortBy === 'tanggal' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2.5 font-semibold text-gray-800">No Bukti</th>
                                    <th className="border border-gray-200 px-3 py-2.5 font-semibold text-gray-800">Vendor</th>
                                    <th className="border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-white/50 font-semibold text-gray-800" onClick={() => handleSort('jumlah')}>
                                        <div className="flex items-center justify-center gap-1">Jumlah {sortBy === 'jumlah' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2.5 font-semibold text-gray-800">Keterangan</th>
                                    <th className="border border-gray-200 px-3 py-2.5 font-semibold text-gray-800">Kategori</th>
                                    <th className="border border-gray-200 px-3 py-2.5 font-semibold text-gray-800">Alat berat</th>
                                    <th className="border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-white/50 font-semibold text-gray-800" onClick={() => handleSort('status')}>
                                        <div className="flex items-center justify-center gap-1">Status {sortBy === 'status' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2.5 font-semibold text-gray-800">Metode</th>
                                    <th className="border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-white/50 font-semibold text-gray-800" onClick={() => handleSort('tax_paid')}>
                                        <div className="flex items-center justify-center gap-1">Pajak {sortBy === 'tax_paid' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}</div>
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2.5 font-semibold text-gray-800">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={12} className="text-center py-12">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                                <span className="ml-3 text-gray-600 font-medium">Memuat data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (activeSection === 'income' ? incomeData : expenseData).length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="text-center py-12 text-gray-500">
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
                                        <TableRow
                                            key={item.id}
                                            item={item}
                                            index={((currentPage - 1) * pageSize) + index}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Menampilkan <span className="font-bold text-gray-900">{((currentPage - 1) * pageSize) + 1}</span> sampai <span className="font-bold text-gray-900">{Math.min(currentPage * pageSize, totalRecords)}</span> dari <span className="font-bold text-gray-900">{totalRecords}</span> hasil
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={!hasPrev || isLoading}
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm"
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
                                                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                                                        currentPage === pageNum
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-110'
                                                            : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:scale-105'
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
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm"
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

            {/* Entry Modal */}
            {showEntryModal && (
                <FinanceEntryModal
                    key={editingEntry?.id ?? `new-${activeSection}`}
                    entry={editingEntry}
                    type={activeSection}
                    categories={categories}
                    onSave={handleSaveEntry}
                    onClose={() => { setShowEntryModal(false); setEditingEntry(null); }}
                    saving={savingEntry}
                />
            )}
        </div>
    );
};

export default Finance;