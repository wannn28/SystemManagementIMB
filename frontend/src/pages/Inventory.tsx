import React, { useState, useEffect } from 'react';

interface TableHeader {
  id: string;
  name: string;
  type: 'string' | 'integer' | 'float' | 'image';
  optional: boolean;
}

interface TableRow {
  id: string;
  [key: string]: File[] | any;
}

interface InventoryItem {
  id: string;
  title: string;
  description: string;
  headers: TableHeader[];
  data: TableRow[];
}

const Inventory: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '' });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newHeaders, setNewHeaders] = useState<TableHeader[]>([]);
  const [newRowData, setNewRowData] = useState<{ [key: string]: any }>({});
  const [newImages, setNewImages] = useState<File[]>([]);
  const [editingData, setEditingData] = useState<TableRow | null>(null);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const generateId = (category: string, name: string, index: number) => {
    const cleanCategory = category.replace(/\s+/g, '-').toUpperCase();
    const cleanName = name.replace(/\s+/g, '-').toUpperCase();
    return `INV-${cleanCategory}-${cleanName}-${(index + 1).toString().padStart(2, '0')}`;
  };

  const removeHeader = (index: number) => {
    const updatedHeaders = newHeaders.filter((_, i) => i !== index);
    setNewHeaders(updatedHeaders);
  };

  const addNewHeader = () => {
    const newHeader: TableHeader = {
      id: `col-${Date.now()}`,
      name: 'Kolom Baru',
      type: 'string',
      optional: false
    };
    setNewHeaders([...newHeaders, newHeader]);
  };

  const handleAddItem = () => {
    if (newItem.title && newItem.description) {
      const newInventoryItem: InventoryItem = {
        id: `CAT-${Date.now()}`,
        ...newItem,
        headers: newHeaders,
        data: []
      };
      setItems([...items, newInventoryItem]);
      setShowAddModal(false);
      setNewItem({ title: '', description: '' });
      setNewHeaders([]);
    }
  };

  const handleAddNewData = () => {
    if (selectedItem) {
      // Cari header dengan tipe 'image'
      const imageHeaders = selectedItem.headers.filter(h => h.type === 'image');
      const imageHeaderId = imageHeaders.length > 0 ? imageHeaders[0].id : null;

      const nameField = selectedItem.headers.find(h => h.type === 'string');
      const dataName = nameField ? newRowData[nameField.id] : 'DATA';
      const newId = generateId(selectedItem.title, dataName, selectedItem.data.length);

      // Bangun objek data baru dengan gambar di header yang benar
      const newData: TableRow = {
        id: newId,
        ...newRowData,
      };

      // Tambahkan gambar ke kolom yang sesuai
      if (imageHeaderId) {
        newData[imageHeaderId] = newImages;
      }

      const updatedItem = {
        ...selectedItem,
        data: [...selectedItem.data, newData]
      };

      setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
      setSelectedItem(updatedItem);
      setShowAddDataModal(false);
      setNewRowData({});
      setNewImages([]);
    }
  };




  const handleEditData = (row: TableRow) => {
    setEditingData(row);
    const imageHeader = selectedItem?.headers.find(h => h.type === 'image');
    if (imageHeader) {
      const currentImages = row[imageHeader.id] || [];
      setEditImages(currentImages);
    } else {
      setEditImages([]);
    }
  };

  const handleUpdateData = () => {
    if (selectedItem && editingData) {
      const imageHeader = selectedItem.headers.find(h => h.type === 'image');
      const updatedData = selectedItem.data.map(item => {
        if (item.id === editingData.id) {
          return {
            ...editingData,
            ...(imageHeader && { [imageHeader.id]: editImages })
          };
        }
        return item;
      });

      const updatedItem = { ...selectedItem, data: updatedData };
      setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
      setSelectedItem(updatedItem);
      setEditingData(null);
      setEditImages([]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (isEdit) {
        setEditImages([...editImages, ...files]);
      } else {
        setNewImages([...newImages, ...files]); // Pastikan state baru diupdate dengan gambar yang benar
      }
    }
  };


  const removeImage = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditImages(editImages.filter((_, i) => i !== index));
    } else {
      setNewImages(newImages.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    const dummyItems: InventoryItem[] = [
      {
        id: 'CAT-1',
        title: 'Invoice',
        description: 'Daftar tagihan',
        headers: [
          { id: 'col1', name: 'Nomor Invoice', type: 'string', optional: false },
          { id: 'col2', name: 'Jumlah', type: 'float', optional: false },
          { id: 'col3', name: 'Status', type: 'image', optional: true }
        ],
        data: [
          { id: 'INV-INVOICE-INV001-01', col1: 'INV-001', col2: 1500000, col3: [] },
          { id: 'INV-INVOICE-INV002-02', col1: 'INV-002', col2: 25000000, col3: [] },
        ]
      },
      {
        id: 'CAT-2',
        title: 'Solar',
        description: 'Penggunaan solar bulanan',
        headers: [
          { id: 'col1', name: 'Bulan', type: 'string', optional: false },
          { id: 'col2', name: 'Jumlah Liter', type: 'float', optional: false },
          { id: 'col3', name: 'Gambar Bukti', type: 'image', optional: true }
        ],
        data: [
          {
            id: 'INV-SOLAR-JANUARI-01',
            col1: 'Januari 2024',
            col2: 1500,
            col3: []
          }
        ]
      }
    ];
    setItems(dummyItems);
  }, []);

  const filteredData = selectedItem?.data.filter(row => {
    if (!searchQuery) return true;

    return Object.keys(row).some(key => {
      const header = selectedItem.headers.find(h => h.id === key);
      // Skip pencarian di kolom image
      if (header?.type === 'image') return false;

      const value = row[key]?.toString().toLowerCase();
      return value?.includes(searchQuery.toLowerCase());
    });
  }) || [];

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventory</h1>

        {!selectedItem ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-500">Manage your inventory efficiently.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Tambah Kategori
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {items.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                        setNewItem({ title: item.title, description: item.description });
                        setNewHeaders([...item.headers]);
                        setShowEditModal(true);
                      }}
                      className="text-blue-500 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItems(items.filter(i => i.id !== item.id));
                      }}
                      className="text-red-500 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button
              onClick={() => setSelectedItem(null)}
              className="mb-4 text-blue-500 hover:text-blue-600"
            >
              ← Kembali
            </button>
            <h2 className="text-2xl font-bold mb-4">{selectedItem.title}</h2>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1 mr-4">
                  <input
                    type="text"
                    placeholder="Cari data..."
                    className="w-full p-2 border rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowAddDataModal(true)
                  }
                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Tambah Data
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border-b bg-gray-50 text-gray-600 text-center w-48">ID</th>
                      {selectedItem.headers.map(header => (
                        <th
                          key={header.id}
                          className="p-2 border-b bg-gray-50 text-gray-600 font-medium text-center"
                          style={{ minWidth: '150px' }}
                        >
                          {header.name}
                        </th>
                      ))}
                      <th className="p-2 border-b bg-gray-50 text-gray-600 text-center w-32">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(row => (
                      <tr key={row.id} className="border-b hover:bg-gray-50 even:bg-gray-50">
                        <td className="p-2 text-gray-700 font-mono text-center align-middle">
                          {row.id}
                        </td>
                        {selectedItem.headers.map(header => (
                          <td
                            key={header.id}
                            className="p-2 text-gray-700 text-center align-middle"
                          >
                            {header.type === 'image' ? (
                              <div className="flex flex-wrap gap-2 justify-center items-center">
                                {(row[header.id] || []).length > 0 ? (
                                  (row[header.id] as File[]).map((img, index) => (
                                    <span
                                      key={index}
                                      className="text-blue-500 underline cursor-pointer"
                                      onClick={() => setSelectedImage(URL.createObjectURL(img))}
                                    >
                                      {img.name}
                                    </span>
                                  ))
                                ) : (
                                  '-'
                                )}
                              </div>
                            ) : header.type === 'float' ? (
                              parseFloat(row[header.id]).toFixed(2)
                            ) : (
                              row[header.id] || '-'
                            )}
                          </td>
                        ))}
                        <td className="p-2 align-middle">
                          <div className="flex gap-2 text-xs justify-center">
                            <button
                              onClick={() => handleEditData(row)}
                              className="text-blue-500 hover:text-blue-600 px-2 py-1 rounded bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                const updatedData = selectedItem.data.filter(d => d.id !== row.id);
                                setSelectedItem({ ...selectedItem, data: updatedData });
                                setItems(items.map(i => i.id === selectedItem.id ?
                                  { ...i, data: updatedData } : i));
                              }}
                              className="text-red-500 hover:text-red-600 px-2 py-1 rounded bg-red-50"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit Kategori */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Edit Kategori</h3>
              <input
                type="text"
                placeholder="Judul"
                className="w-full mb-3 p-2 border rounded"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Deskripsi"
                className="w-full mb-4 p-2 border rounded"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Konfigurasi Kolom</h4>
                {newHeaders.map((header, index) => (
                  <div key={header.id} className="mb-3 p-2 border rounded">
                    <input
                      type="text"
                      placeholder="Nama Kolom"
                      className="w-full mb-2"
                      value={header.name}
                      onChange={(e) => {
                        const updated = [...newHeaders];
                        updated[index].name = e.target.value;
                        setNewHeaders(updated);
                      }}
                    />
                    <select
                      className="w-full mb-2"
                      value={header.type}
                      onChange={(e) => {
                        const updated = [...newHeaders];
                        updated[index].type = e.target.value as any;
                        setNewHeaders(updated);
                      }}
                    >
                      <option value="string">String</option>
                      <option value="integer">Integer</option>
                      <option value="float">Float</option>
                      <option value="image">Image</option>
                    </select>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={header.optional}
                        onChange={(e) => {
                          const updated = [...newHeaders];
                          updated[index].optional = e.target.checked;
                          setNewHeaders(updated);
                        }}
                      />
                      Opsional
                    </label>
                    <button
                      onClick={() => removeHeader(index)}
                      className="text-red-500 text-sm mt-1"
                    >
                      Hapus Kolom
                    </button>
                  </div>
                ))}
                <button
                  onClick={addNewHeader}
                  className="bg-gray-200 px-3 py-1 rounded text-sm"
                >
                  Tambah Kolom
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    setNewHeaders([]);
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (editingItem) {
                      const updatedItem = {
                        ...editingItem,
                        title: newItem.title,
                        description: newItem.description,
                        headers: newHeaders
                      };
                      setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
                      setShowEditModal(false);
                      setEditingItem(null);
                      setNewHeaders([]);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal Tambah Kategori */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Tambah Kategori Baru</h3>
              <input
                type="text"
                placeholder="Judul"
                className="w-full mb-3 p-2 border rounded"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Deskripsi"
                className="w-full mb-4 p-2 border rounded"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Konfigurasi Kolom</h4>
                {newHeaders.map((header, index) => (
                  <div key={header.id} className="mb-3 p-2 border rounded">
                    <input
                      type="text"
                      placeholder="Nama Kolom"
                      className="w-full mb-2"
                      value={header.name}
                      onChange={(e) => {
                        const updated = [...newHeaders];
                        updated[index].name = e.target.value;
                        setNewHeaders(updated);
                      }}
                    />
                    <select
                      className="w-full mb-2"
                      value={header.type}
                      onChange={(e) => {
                        const updated = [...newHeaders];
                        updated[index].type = e.target.value as any;
                        setNewHeaders(updated);
                      }}
                    >
                      <option value="string">String</option>
                      <option value="integer">Integer</option>
                      <option value="float">Float</option>
                      <option value="image">Image</option>
                    </select>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={header.optional}
                        onChange={(e) => {
                          const updated = [...newHeaders];
                          updated[index].optional = e.target.checked;
                          setNewHeaders(updated);
                        }}
                      />
                      Opsional
                    </label>
                    <button
                      onClick={() => removeHeader(index)}
                      className="text-red-500 text-sm mt-1"
                    >
                      Hapus Kolom
                    </button>
                  </div>
                ))}
                <button
                  onClick={addNewHeader}
                  className="bg-gray-200 px-3 py-1 rounded text-sm"
                >
                  Tambah Kolom
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewHeaders([]);
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah Data */}
        {showAddDataModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Tambah Data Baru</h3>

              {selectedItem.headers.map((header) => (
                <div key={header.id} className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    {header.name}
                    {header.optional && <span className="text-gray-500 ml-1">(opsional)</span>}
                  </label>

                  {header.type === 'image' ? (
                    <div>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleImageUpload(e, true)}
                        className="w-full"
                        accept="image/*"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {editImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                            <button
                              onClick={() => removeImage(index, true)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <input
                      type={header.type === 'integer' || header.type === 'float' ? 'number' : 'text'}
                      className="w-full p-2 border rounded"
                      value={newRowData[header.id] || ''}
                      onChange={(e) => setNewRowData({
                        ...newRowData,
                        [header.id]: e.target.value
                      })}
                      required={!header.optional}
                      step={header.type === 'float' ? '0.01' : undefined}
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowAddDataModal(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddNewData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit Data */}
        {editingData && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Edit Data</h3>

              {selectedItem.headers.map((header) => (
                <div key={header.id} className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    {header.name}
                    {header.optional && <span className="text-gray-500 ml-1">(opsional)</span>}
                  </label>

                  {header.type === 'image' ? (
                    <div>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleImageUpload(e, true)}
                        className="w-full"
                        accept="image/*"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {editImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                            <button
                              onClick={() => removeImage(index, true)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <input
                      type={header.type === 'integer' || header.type === 'float' ? 'number' : 'text'}
                      className="w-full p-2 border rounded"
                      value={editingData[header.id] || ''}
                      onChange={(e) => setEditingData({
                        ...editingData,
                        [header.id]: e.target.value
                      })}
                      required={!header.optional}
                      step={header.type === 'float' ? '0.01' : undefined}
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditingData(null)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl max-w-[90vw] max-h-[90vh] overflow-auto">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-full"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;