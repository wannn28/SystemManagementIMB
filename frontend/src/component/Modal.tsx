import React from 'react';
import { TableHeader } from '../types/BasicTypes';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ onClose, title, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <FiX className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

interface AddCategoryModalProps {
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddItem: () => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ setShow, handleAddItem }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900">Tambah Kategori Baru</h3>
        <button 
          onClick={() => setShow(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Judul</label>
          <input 
            type="text" 
            placeholder="Masukkan judul kategori" 
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
          <input 
            type="text" 
            placeholder="Masukkan deskripsi kategori" 
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" 
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <button 
          onClick={() => setShow(false)} 
          className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold transition-all"
        >
          Batal
        </button>
        <button 
          onClick={handleAddItem} 
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all"
        >
          Simpan
        </button>
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
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900">Edit Kategori</h3>
        <button 
          onClick={() => setShow(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Judul</label>
          <input 
            type="text" 
            placeholder="Judul" 
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" 
            value={editingItem?.title} 
            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
          <input 
            type="text" 
            placeholder="Deskripsi" 
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" 
            value={editingItem?.description} 
            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} 
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <button 
          onClick={() => setShow(false)} 
          className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold transition-all"
        >
          Batal
        </button>
        <button 
          onClick={() => { /* handle save logic */ }} 
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all"
        >
          Simpan
        </button>
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
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
        <h3 className="text-2xl font-bold text-gray-900">Tambah Data Baru</h3>
        <button 
          onClick={() => setShow(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        {selectedItem.headers.map((header: TableHeader) => (
          <div key={header.id}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{header.name}</label>
            <input 
              type="text" 
              placeholder={`Masukkan ${header.name.toLowerCase()}`}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" 
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl sticky bottom-0">
        <button 
          onClick={() => setShow(false)} 
          className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold transition-all"
        >
          Batal
        </button>
        <button 
          onClick={handleAddNewData} 
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all"
        >
          Simpan
        </button>
      </div>
    </div>
  </div>
);
