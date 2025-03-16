import axios from 'axios';
import React, { useState, useMemo, useEffect } from 'react';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    // Filter configuration
    const filterData = (data: FinanceEntry[]) => {
        return data.filter((entry) => {
            const matchesSearch = entry.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !selectedCategory || entry.category === selectedCategory;
            const entryDate = new Date(entry.tanggal);
            const entryMonth = String(entryDate.getMonth() + 1).padStart(2, '0');
            const entryYear = String(entryDate.getFullYear());
            const matchesMonth = !selectedMonth || entryMonth === selectedMonth;
            const matchesYear = !selectedYear || entryYear === selectedYear;

            return matchesSearch && matchesCategory && matchesMonth && matchesYear;
        });
    };

    const filteredIncomeData = useMemo(() => filterData(incomeData), [incomeData, searchTerm, selectedCategory, selectedMonth, selectedYear]);
    const filteredExpenseData = useMemo(() => filterData(expenseData), [expenseData, searchTerm, selectedCategory, selectedMonth, selectedYear]);

    // Form states
    const [newEntry, setNewEntry] = useState({
        tanggal: '',
        unit: '',
        hargaPerUnit: '',
        keterangan: '',
        category: 'Other'
    });

    const [editMode, setEditMode] = useState<EditMode>({
        id: null,
        type: null,
        data: {}
    });

    // Totals calculation
    const totalPemasukan = useMemo(() =>
        filteredIncomeData.reduce((sum, item) => sum + (item.unit * item.hargaPerUnit), 0),
        [filteredIncomeData]
    );

    const totalPengeluaran = useMemo(() =>
        filteredExpenseData.reduce((sum, item) => sum + (item.unit * item.hargaPerUnit), 0),
        [filteredExpenseData]
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [incomeRes, expenseRes] = await Promise.all([
                axios.get('http://localhost:8080/finance?type=income'),
                axios.get('http://localhost:8080/finance?type=expense')
            ]);

            setIncomeData(incomeRes.data?.data || []);
            setExpenseData(expenseRes.data?.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Edit handlers
    const handleEdit = async (id: number, type: 'income' | 'expense') => {
        try {
            const response = await axios.get(`http://localhost:8080/finance/${id}`);
            const rawDate = response.data.data.tanggal;
            const formattedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;

            setEditMode({
                id,
                type,
                data: {
                    ...response.data.data,
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
                await axios.put(`http://localhost:8080/finance/${editMode.id}`, {
                    ...editMode.data,
                    type: editMode.type
                });
                fetchData();
                setEditMode({ id: null, type: null, data: {} });
            } catch (error) {
                console.error('Error saving edit:', error);
            }
        }
    };

    const handleDelete = async (id: number, type: 'income' | 'expense') => {
        try {
            await axios.delete(`http://localhost:8080/finance/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    // Add new entry
    const handleAddEntry = async (e: React.FormEvent, type: 'income' | 'expense') => {
        e.preventDefault();
        try {
            const newEntryData = {
                ...newEntry,
                unit: Number(newEntry.unit),
                hargaPerUnit: Number(newEntry.hargaPerUnit),
                type: type
            };

            await axios.post('http://localhost:8080/finance', newEntryData);
            setNewEntry({ tanggal: '', unit: '', hargaPerUnit: '', keterangan: '', category: 'Other' });
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
                            <option value="Other">Lainnya</option>
                        </select>
                    ) : (
                        item.category
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
                                onClick={() => handleDelete(item.id, type)}
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
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Cari keterangan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border p-2 rounded"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="border p-2 rounded"
                        >
                            <option value="">Semua Kategori</option>
                            <option value="Barang">Barang</option>
                            <option value="Jasa">Jasa</option>
                            <option value="Sewa Alat Berat">Sewa Alat Berat</option>
                            <option value="Other">Lainnya</option>
                        </select>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border p-2 rounded"
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
                            className="border p-2 rounded"
                            min="2000"
                            max="2100"
                        />
                        <button
                            onClick={() => {
                                setSelectedCategory('');
                                setSelectedMonth('');
                                setSelectedYear('');
                                setSearchTerm('');
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Reset
                        </button>
                    </div>

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
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveSection('income')}
                        className={`px-6 py-2 rounded-t-lg ${activeSection === 'income'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        Pemasukan
                    </button>
                    <button
                        onClick={() => setActiveSection('expense')}
                        className={`px-6 py-2 rounded-t-lg ${activeSection === 'expense'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        Pengeluaran
                    </button>
                    <FinancePDFExportButton
                        data={activeSection === 'income' ? filteredIncomeData : filteredExpenseData}
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
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold mb-4">
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
                                className="border p-2 rounded"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Jumlah Unit"
                                value={newEntry.unit}
                                onChange={(e) => setNewEntry({ ...newEntry, unit: e.target.value })}
                                className="border p-2 rounded"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Harga per Unit"
                                value={newEntry.hargaPerUnit}
                                onChange={(e) => setNewEntry({ ...newEntry, hargaPerUnit: e.target.value })}
                                className="border p-2 rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Keterangan"
                                value={newEntry.keterangan}
                                onChange={(e) => setNewEntry({ ...newEntry, keterangan: e.target.value })}
                                className="border p-2 rounded"
                            />
                            <select
                                value={newEntry.category}
                                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                                className="border p-2 rounded"
                                required
                            >
                                <option value="Other">Pilih Kategori</option>
                                <option value="Barang">Barang</option>
                                <option value="Jasa">Jasa</option>
                                <option value="Sewa Alat Berat">Sewa Alat Berat</option>
                                <option value="Other">Lainnya</option>
                            </select>
                            <button
                                type="submit"
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                Tambah
                            </button>
                        </form>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="border px-4 py-2 w-12">No</th>
                                    <th className="border px-4 py-2">Tanggal</th>
                                    <th className="border px-4 py-2">Unit</th>
                                    <th className="border px-4 py-2">Harga/Unit</th>
                                    <th className="border px-4 py-2">Jumlah</th>
                                    <th className="border px-4 py-2">Keterangan</th>
                                    <th className="border px-4 py-2">Kategori</th>
                                    <th className="border px-4 py-2 w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeSection === 'income' ? filteredIncomeData : filteredExpenseData).map((item, index) => (
                                    <EditableRow
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        type={activeSection}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Finance;