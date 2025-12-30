import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi';

import { ProjectData } from '../types/Project';
import { Project } from '../types/BasicTypes';
import { projectsAPI } from '../api';
const Projects: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const [projects, setProjects] = useState<Project[]>((ProjectData));

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false); // Manage add project form visibility
  const [newProject, setNewProject] = useState<Project>({
    id: 0,
    name: '',
    description: '',
    status: 'pending',
    startDate: '2023-01-01',
    endDate: '2023-03-31',
    maxDuration: '3 months',
    totalRevenue: 0,
    amountPaid: 0,
    unitPrice: 0,
    unit: 'Pcs',
    totalVolume: 0,
    reports: { daily: [], weekly: [], monthly: [] },
  });
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await projectsAPI.getAllProjects();
        setProjects(projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);
  const addProject = async () => {
    try {
      const formattedProject = {
        ...newProject,
        startDate: `${newProject.startDate}`, // Ganti +07:00 menjadi Z
        endDate: `${newProject.endDate}`,     // Ganti +07:00 menjadi Z
        // totalRevenue: Number(newProject.totalRevenue),
        // totalVolume: Number(newProject.totalVolume),
        // unitPrice: Number(newProject.unitPrice),
        // amountPaid: Number(newProject.amountPaid),
      };
      console.log(formattedProject)
      
      await projectsAPI.createProject(formattedProject);
      
      // Refresh projects list
      const updatedProjects = await projectsAPI.getAllProjects();
      setProjects(updatedProjects);
      setIsAddingProject(false);
      setNewProject({
        id: 0,
        name: '',
        description: '',
        status: 'pending',
        startDate: '2023-01-01',
        endDate: '2023-03-31',
        maxDuration: '3 months',
        totalRevenue: 0,
        amountPaid: 0,
        unitPrice: 0,
        unit: 'Pcs',
        totalVolume: 0,
        reports: { daily: [], weekly: [], monthly: [] },
      });
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await projectsAPI.deleteProject(id);
      setProjects(projects.filter(project => project.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const startEditing = (project: Project) => {
    setEditingProject(project);
  };

  const saveEdit = async () => {
    if (editingProject) {
      try {
        const formattedProject = {
          ...editingProject,
          startDate: `${editingProject.startDate}`,
          endDate: `${editingProject.endDate}`,
          // totalRevenue: Number(newProject.totalRevenue),
          // totalVolume: Number(newProject.totalVolume),
          // unitPrice: Number(newProject.unitPrice),
          // amountPaid: Number(newProject.amountPaid),
        };
        console.log(formattedProject)
        await projectsAPI.updateProject(editingProject.id, formattedProject);
        
        // Refresh projects list
        const updatedProjects = await projectsAPI.getAllProjects();
        setProjects(updatedProjects);
        setEditingProject(null);
      } catch (error) {
        console.error('Error updating project:', error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingProject(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingProject) {
      // Konversi nilai numeric ke Number
      const numericFields = ['totalRevenue', 'amountPaid', 'unitPrice', 'totalVolume'];
      const parsedValue = numericFields.includes(name) ? Number(value) : value;
      setEditingProject({ ...editingProject, [name]: parsedValue });
    }
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Konversi nilai numeric ke Number
    const numericFields = ['totalRevenue', 'amountPaid', 'unitPrice', 'totalVolume'];
    const parsedValue = numericFields.includes(name) ? Number(value) : value;
    setNewProject({ ...newProject, [name]: parsedValue });
  };

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'} bg-gradient-to-br from-gray-50 via-orange-50/20 to-amber-50/30 min-h-screen`}>
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-orange-900 to-amber-900 bg-clip-text text-transparent mb-2">
              Manajemen Proyek
            </h1>
            <p className="text-gray-600 text-sm">Kelola dan monitor semua proyek konstruksi Anda</p>
          </div>
          <button 
            onClick={() => setIsAddingProject(true)} 
            className="flex items-center px-6 py-3 text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200 hover:scale-105"
          >
            <FiPlus className="mr-2 w-5 h-5" /> Tambah Proyek
          </button>
        </div>

        {/* Add Project Modal */}
        {isAddingProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-2/3 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Tambah Proyek Baru</h2>
              <form>
                <div className="flex gap-6">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Project Name</label>
                      <input
                        type="text"
                        name="name"
                        value={newProject.name}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={newProject.description}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg h-24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        value={newProject.status}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={newProject.startDate}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={newProject.endDate}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Duration</label>
                      <input
                        type="text"
                        name="maxDuration"
                        value={newProject.maxDuration}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Revenue</label>
                      <input
                        type="number"
                        name="totalRevenue"
                        value={newProject.totalRevenue}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                      <input
                        type="number"
                        name="amountPaid"
                        value={newProject.amountPaid}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                      <input
                        type="number"
                        name="unitPrice"
                        value={newProject.unitPrice}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        name="unit"
                        value={newProject.unit}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Volume</label>
                      <input
                        type="number"
                        name="totalVolume"
                        value={newProject.totalVolume}
                        onChange={handleAddChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingProject(false)} 
                    className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold transition-all duration-200"
                  >
                    Batal
                  </button>
                  <button 
                    type="button" 
                    onClick={addProject} 
                    className="px-6 py-3 text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                  >
                    Simpan Proyek
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto border border-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">No</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Proyek</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal Mulai</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal Selesai</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Durasi Max</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total Revenue</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Terbayar</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Harga/Unit</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Unit</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Volume</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr key={project.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-amber-50/30 transition-all duration-200">
                  <td className="py-4 px-4 font-medium text-gray-900">{index + 1}</td>
                  <td className="py-4 px-4 font-semibold text-gray-900">{project.name}</td>
                  <td className="py-4 px-4 text-gray-600 max-w-xs truncate">{project.description}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {project.status === 'active' ? 'Aktif' : project.status === 'completed' ? 'Selesai' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{project.startDate}</td>
                  <td className="py-4 px-4 text-gray-600">{project.endDate}</td>
                  <td className="py-4 px-4 text-gray-600">{project.maxDuration}</td>
                  <td className="py-4 px-4 font-semibold text-green-600">Rp {project.totalRevenue.toLocaleString()}</td>
                  <td className="py-4 px-4 font-semibold text-blue-600">Rp {project.amountPaid.toLocaleString()}</td>
                  <td className="py-4 px-4 text-gray-600">Rp {project.unitPrice.toLocaleString()}</td>
                  <td className="py-4 px-4 text-gray-600">{project.unit}</td>
                  <td className="py-4 px-4 text-gray-600">{project.totalVolume}</td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => startEditing(project)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Edit"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteProject(project.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Hapus"
                      >
                        <FiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Project Modal */}
        {editingProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-2/3 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Edit Proyek</h2>
              <form>
                <div className="flex gap-6">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Project Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editingProject.name}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={editingProject.description}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg h-24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        value={editingProject?.status}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={editingProject.startDate}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={editingProject.endDate}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Duration</label>
                      <input
                        type="text"
                        name="maxDuration"
                        value={editingProject.maxDuration}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Revenue</label>
                      <input
                        type="number"
                        name="totalRevenue"
                        value={editingProject.totalRevenue}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                      <input
                        type="number"
                        name="amountPaid"
                        value={editingProject.amountPaid}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                      <input
                        type="number"
                        name="unitPrice"
                        value={editingProject.unitPrice}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        name="unit"
                        value={editingProject.unit}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Volume</label>
                      <input
                        type="number"
                        name="totalVolume"
                        value={editingProject.totalVolume}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={cancelEdit} 
                    className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-semibold transition-all duration-200"
                  >
                    Batal
                  </button>
                  <button 
                    type="button" 
                    onClick={saveEdit} 
                    className="px-6 py-3 text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
