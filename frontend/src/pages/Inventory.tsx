import React, { useState, useEffect } from 'react';
import { InventoryCategory, InventoryData } from '../types/BasicTypes';
import InventoryPDFExporter from '../component/InventoryPDFExporter'
import inventoryAPI from '../api/Inventory';

interface TableHeader {
  id: string;
  name: string;
  type: 'string' | 'integer' | 'float' | 'image';
  optional: boolean;
}

// API sudah diimpor dari modul inventory

const Inventory: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ title: '', description: '' });
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [newHeaders, setNewHeaders] = useState<TableHeader[]>([]);
  const [newDataValues, setNewDataValues] = useState<{ [key: string]: any }>({});
  const [newImages, setNewImages] = useState<File[]>([]);
  const [editingData, setEditingData] = useState<InventoryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await inventoryAPI.categories.getAll();
      // Pastikan response adalah array
      if (Array.isArray(response)) {
        setCategories(response);
      } else {
        console.error('Error: categories response is not an array', response);
        setCategories([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set empty array on error
    }
  };

  const fetchCategoryData = async (categoryId: string) => {
    try {
      const response = await inventoryAPI.data.getByCategory(categoryId);
      return response;
    } catch (error) {
      console.error('Error fetching category data:', error);
      return [];
    }
  };

  const handleAddHeader = () => {
    const newHeader: TableHeader = {
      id: `col-${Date.now()}`,
      name: 'Kolom Baru',
      type: 'string',
      optional: false
    };
    setNewHeaders([...newHeaders, newHeader]);
  };

  const handleRemoveHeader = (index: number) => {
    const updatedHeaders = newHeaders.filter((_, i) => i !== index);
    setNewHeaders(updatedHeaders);
  };

  const handleCreateCategory = async () => {
    try {
      const newCategoryData = {
        title: newCategory.title,
        description: newCategory.description,
        headers: newHeaders,
        data: [] // Menambahkan properti data yang kosong
      };

      const response = await inventoryAPI.categories.create(newCategoryData);
      setCategories([...categories, response]);
      setShowAddModal(false);
      resetFormState();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const updatedCategory = {
        ...editingCategory,
        title: newCategory.title,
        description: newCategory.description,
        headers: newHeaders
      };

      await inventoryAPI.categories.update(editingCategory.id, updatedCategory);
      setCategories(categories.map(cat => cat.id === editingCategory.id ? updatedCategory : cat));
      setEditingCategory(null);
      setShowAddModal(false);
      resetFormState();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await inventoryAPI.categories.delete(categoryId);
      setCategories(categories.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleCreateData = async () => {
    if (!selectedCategory) return;

    try {
      // Prepare form data with values and images
      const formData = new FormData();
      
      // Add values as JSON string
      formData.append('values', JSON.stringify(newDataValues));
      formData.append('category_id', selectedCategory.id);
      
      // Add images
      if (newImages.length > 0) {
        for (const file of newImages) {
          formData.append('images', file);
        }
      }

      // Create data with all information at once
      await inventoryAPI.data.create(formData);

      // Refresh category data
      const updatedData = await inventoryAPI.data.getByCategory(selectedCategory.id);

      const updatedCategory = {
        ...selectedCategory,
        data: updatedData
      };

      setCategories(categories.map(cat =>
        cat.id === selectedCategory.id ? updatedCategory : cat
      ));
      setSelectedCategory(updatedCategory);
      setShowAddDataModal(false);
      resetFormState();
    } catch (error) {
      console.error('Error creating data:', error);
    }
  };

  const handleUpdateData = async () => {
    if (!selectedCategory || !editingData) return;

    try {
      // Prepare form data with values and images
      const formData = new FormData();
      
      // Add values as JSON string
      formData.append('values', JSON.stringify(editingData.values));
      formData.append('category_id', selectedCategory.id);
      
      // Add images
      if (newImages.length > 0) {
        for (const file of newImages) {
          formData.append('images', file);
        }
      }

      // Update data with all information at once
      await inventoryAPI.data.update(editingData.id, formData);

      // Refresh category data
      const updatedData = await inventoryAPI.data.getByCategory(selectedCategory.id);

      const updatedCategory = {
        ...selectedCategory,
        data: updatedData
      };

      setCategories(categories.map(cat =>
        cat.id === selectedCategory.id ? updatedCategory : cat
      ));
      setSelectedCategory(updatedCategory);
      setEditingData(null);
      resetFormState();
    } catch (error) {
      console.error('Error updating data:', error);
    }
  };

  const handleDeleteData = async (dataId: string) => {
    if (!selectedCategory) return;

    try {
      await inventoryAPI.data.delete(dataId);
      const updatedData = selectedCategory.data.filter(data => data.id !== dataId);
      const updatedCategory = { ...selectedCategory, data: updatedData };
      setCategories(categories.map(cat =>
        cat.id === selectedCategory.id ? updatedCategory : cat
      ));
      setSelectedCategory(updatedCategory);
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(files);
    }
  };

  const handleDeleteImage = async (dataId: string, imageName: string) => {
    try {
      await inventoryAPI.images.deleteImage(dataId, imageName);
      if (selectedCategory) {
        const updatedData = await inventoryAPI.data.getByCategory(selectedCategory.id);
        const updatedCategory = { ...selectedCategory, data: updatedData };
        setCategories(categories.map(cat =>
          cat.id === selectedCategory.id ? updatedCategory : cat
        ));
        setSelectedCategory(updatedCategory);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const resetFormState = () => {
    setNewCategory({ title: '', description: '' });
    setNewHeaders([]);
    setNewDataValues({});
    setNewImages([]);
  };

  const filteredData = selectedCategory?.data.filter(data => {
    if (!searchQuery) return true;
    return Object.values(data.values).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventory</h1>

        {!selectedCategory ? (
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
              {categories.map(category => (
                <div
                  key={category.id}
                  onClick={async () => {
                    const data = await fetchCategoryData(category.id);
                    setSelectedCategory({ ...category, data });
                  }}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className="font-semibold text-lg">{category.title}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(category);
                        setNewCategory({
                          title: category.title,
                          description: category.description
                        });
                        setNewHeaders([...category.headers]);
                        setShowAddModal(true);
                      }}
                      className="text-blue-500 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
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
              onClick={() => setSelectedCategory(null)}
              className="mb-4 text-blue-500 hover:text-blue-600"
            >
              ← Kembali
            </button>
            <h2 className="text-2xl font-bold mb-4">{selectedCategory.title}</h2>
            {selectedCategory && (
              <div className="mb-4">
                <InventoryPDFExporter
                  selectedCategory={selectedCategory}
                  data={filteredData}
                />
              </div>
            )}
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
                  onClick={() => setShowAddDataModal(true)}
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
                      {selectedCategory.headers.map(header => (

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
                    {filteredData.map(data => (
                      <tr key={data.id} className="border-b hover:bg-gray-50 even:bg-gray-50">
                        <td className="p-2 text-gray-700 font-mono text-center align-middle">
                          {data.id}
                        </td>
                        {selectedCategory.headers.map(header => (
                          <td
                            key={header.id}
                            className="p-2 text-gray-700 text-center align-middle"
                          >
                            {header.type === 'image' ? (
                              <div className="flex flex-wrap gap-2 justify-center items-center">
                                {data.images.map((image, index) => (
                                  <div key={index} className="relative">

                                    <img
                                      src={image}
                                      alt="Preview"
                                      className="w-16 h-16 object-cover rounded cursor-pointer"
                                      onClick={() => setSelectedImage(image)}
                                    />
                                    <button
                                      onClick={() => handleDeleteImage(data.id, image)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              data.values[header.id] || '-'
                            )}
                          </td>
                        ))}
                        <td className="p-2 align-middle">
                          <div className="flex gap-2 text-xs justify-center">
                            <button
                              onClick={() => setEditingData(data)}
                              className="text-blue-500 hover:text-blue-600 px-2 py-1 rounded bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteData(data.id)}
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

        {/* Modal Add/Edit Category */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>

              <input
                type="text"
                placeholder="Judul"
                className="w-full mb-3 p-2 border rounded"
                value={newCategory.title}
                onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Deskripsi"
                className="w-full mb-4 p-2 border rounded"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
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
                      onClick={() => handleRemoveHeader(index)}
                      className="text-red-500 text-sm mt-1"
                    >
                      Hapus Kolom
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddHeader}
                  className="bg-gray-200 px-3 py-1 rounded text-sm"
                >
                  Tambah Kolom
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetFormState();
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Add/Edit Data */}
        {(showAddDataModal || editingData) && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">
                {editingData ? 'Edit Data' : 'Tambah Data Baru'}
              </h3>

              {selectedCategory?.headers.map(header => (
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
                        onChange={handleImageUpload}
                        className="w-full"
                        accept="image/*"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(editingData?.images || []).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                        {newImages.map((image, index) => (
                          <div key={`new-${index}`} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <input
                      type={header.type === 'integer' || header.type === 'float' ? 'number' : 'text'}
                      className="w-full p-2 border rounded"
                      value={
                        editingData
                          ? editingData.values[header.id] || ''
                          : newDataValues[header.id] || ''
                      }
                      onChange={(e) => {
                        const value = e.target.type === 'number'
                          ? parseFloat(e.target.value)
                          : e.target.value;

                        if (editingData) {
                          setEditingData({
                            ...editingData,
                            values: {
                              ...editingData.values,
                              [header.id]: value
                            }
                          });
                        } else {
                          setNewDataValues({
                            ...newDataValues,
                            [header.id]: value
                          });
                        }
                      }}
                      required={!header.optional}
                      step={header.type === 'float' ? '0.01' : undefined}
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowAddDataModal(false);
                    setEditingData(null);
                    resetFormState();
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={editingData ? handleUpdateData : handleCreateData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedImage && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex items-center justify-center">
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