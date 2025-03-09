import React from 'react';
import { TableHeader } from '../types/BasicTypes';

interface AddCategoryModalProps {
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddItem: () => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ setShow, handleAddItem }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl w-96">
      <h3 className="text-xl font-bold mb-4">Tambah Kategori Baru</h3>
      <input type="text" placeholder="Judul" className="w-full mb-3 p-2 border rounded" />
      <input type="text" placeholder="Deskripsi" className="w-full mb-4 p-2 border rounded" />
      <div className="flex justify-end gap-2">
        <button onClick={() => setShow(false)} className="px-4 py-2 text-gray-500 hover:text-gray-600">Batal</button>
        <button onClick={handleAddItem} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Simpan</button>
      </div>
    </div>
  </div>
);

interface EditCategoryModalProps {
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  editingItem: any;
  setEditingItem: React.Dispatch<React.SetStateAction<any>>;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ setShow, editingItem, setEditingItem }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl w-96">
      <h3 className="text-xl font-bold mb-4">Edit Kategori</h3>
      <input type="text" placeholder="Judul" className="w-full mb-3 p-2 border rounded" value={editingItem?.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
      <input type="text" placeholder="Deskripsi" className="w-full mb-4 p-2 border rounded" value={editingItem?.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} />
      <div className="flex justify-end gap-2">
        <button onClick={() => setShow(false)} className="px-4 py-2 text-gray-500 hover:text-gray-600">Batal</button>
        <button onClick={() => { /* handle save logic */ }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Simpan</button>
      </div>
    </div>
  </div>
);

interface AddDataModalProps {
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddNewData: () => void;
  selectedItem: any;
}

export const AddDataModal: React.FC<AddDataModalProps> = ({ setShow, handleAddNewData, selectedItem }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl w-96">
      <h3 className="text-xl font-bold mb-4">Tambah Data Baru</h3>
      {selectedItem.headers.map((header: TableHeader) => (
        <div key={header.id} className="mb-3">
          <label className="block text-sm font-medium mb-1">{header.name}</label>
          <input type="text" className="w-full p-2 border rounded" />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <button onClick={() => setShow(false)} className="px-4 py-2 text-gray-500 hover:text-gray-600">Batal</button>
        <button onClick={handleAddNewData} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Simpan</button>
      </div>
    </div>
  </div>
);
