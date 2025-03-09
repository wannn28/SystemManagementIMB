import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi';

import { ProjectData } from '../types/Project';
import { Project } from '../types/BasicTypes';
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
        const response = await fetch('http://localhost:8080/projects');
        const data = await response.json();
        if (data.status === 200) {
          setProjects(data.data);
        }
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
      const response = await fetch('http://localhost:8080/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedProject),
      });

      if (response.ok) {
        const updatedData = await fetch('http://localhost:8080/projects');
        const updatedProjects = await updatedData.json();
        setProjects(updatedProjects.data);
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
      }
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/projects/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setProjects(projects.filter(project => project.id !== id));
      }
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
        const response = await fetch(`http://localhost:8080/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedProject),
        });

        if (response.ok) {
          const updatedData = await fetch('http://localhost:8080/projects');
          const updatedProjects = await updatedData.json();
          setProjects(updatedProjects.data);
          setEditingProject(null);
        }
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
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
          <button onClick={() => setIsAddingProject(true)} className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-lg">
            <FiPlus className="mr-2" /> Add Project
          </button>
        </div>

        {/* Add Project Modal */}
        {isAddingProject && (
          <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-2/3">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Project</h2>
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

                <div className="mt-6 flex justify-end space-x-4">
                  <button type="button" onClick={() => setIsAddingProject(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                    Cancel
                  </button>
                  <button type="button" onClick={addProject} className="px-4 py-2 text-white bg-indigo-600 rounded-lg">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 text-left">No</th>
                <th className="py-2 text-left">Project Name</th>
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Start Date</th>
                <th className="py-2 text-left">End Date</th>
                <th className="py-2 text-left">Max Duration</th>
                <th className="py-2 text-left">Total Revenue</th>
                <th className="py-2 text-left">Amount Paid</th>
                <th className="py-2 text-left">Unit Price</th>
                <th className="py-2 text-left">Unit</th>
                <th className="py-2 text-left">Total Volume</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr key={project.id} className="border-b">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">{project.name}</td>
                  <td className="py-2">{project.description}</td>
                  <td className="py-2">{project.status}</td>
                  <td className="py-2">{project.startDate}</td>
                  <td className="py-2">{project.endDate}</td>
                  <td className="py-2">{project.maxDuration}</td>
                  <td className="py-2">Rp {project.totalRevenue.toLocaleString()}</td>
                  <td className="py-2">Rp {project.amountPaid.toLocaleString()}</td>
                  <td className="py-2">Rp {project.unitPrice.toLocaleString()}</td>
                  <td className="py-2">{project.unit}</td>
                  <td className="py-2">{project.totalVolume}</td>
                  <td className="py-2">
                    <button onClick={() => deleteProject(project.id)} className="text-red-500 hover:underline">
                      <FiTrash />
                    </button>
                    <button onClick={() => startEditing(project)} className="ml-2 text-blue-500 hover:underline">
                      <FiEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Project Modal */}
        {editingProject && (
          <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-2/3">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Project</h2>
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

                <div className="mt-6 flex justify-end space-x-4">
                  <button type="button" onClick={cancelEdit} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                    Cancel
                  </button>
                  <button type="button" onClick={saveEdit} className="px-4 py-2 text-white bg-indigo-600 rounded-lg">
                    Save
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
