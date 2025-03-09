import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import { teamMembers } from '../types/teamMembersData';

import { Member, SalaryRecord, SalaryDetail, Kasbon } from '../types/BasicTypes';
import { AddButtonCategory } from '../component/AddButton';
import { SalaryDetailsTable } from './SalaryDetailsTable';
interface TeamProps {
  isCollapsed: boolean;
}


const Team: React.FC<TeamProps> = ({ isCollapsed }) => {
  const [teamMembersData, setTeamMembersData] = useState<Member[]>([]); // State untuk menyimpan anggota tim
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedTab, setSelectedTab] = useState('Personal');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | 'profile'>('profile');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Member | null>(null);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [newDocumentFiles, setNewDocumentFiles] = useState<File[]>([]); // Ubah ke array
  const [newSalaryMonth, setNewSalaryMonth] = useState('');
  const [newStatus, setNewStatus] = useState('Paid');
  const [newSalaryAmount, setNewSalaryAmount] = useState(0);
  const [newLoanAmount, setNewLoanAmount] = useState(0);
  const [newModalSalary, setNewModalSalary] = useState(false);
  const [editModalSalary, setEditModalSalary] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetail[]>([]);
  const [kasbonDetails, setKasbonDetails] = useState<Kasbon[]>([]);
  // Di dalam komponen Team.tsx
  // Di fungsi fetchSalaryDetails:
  const fetchSalaryDetails = async (salaryId: string) => {
    try {
      const response = await axios.get(`http://localhost:8080/salaries/${salaryId}/details`);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching salary details:", error);
      return [];
    }
  };

  const fetchKasbons = async (salaryId: string) => {
    try {
      const response = await axios.get(`http://localhost:8080/salaries/${salaryId}/kasbons`);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching kasbons:", error);
      return [];
    }
  };
  const handleAddSalaryDetail = async (salaryId: string, newData: SalaryDetail) => {
    try {

      const formattedData = {
        jam_trip: newData.jam_trip,       // Gunakan snake_case
        harga_per_jam: newData.harga_per_jam, // Gunakan snake_case
        tanggal: new Date(newData.tanggal).toISOString(),
        keterangan: newData.keterangan
      };

      const response = await axios.post(
        `http://localhost:8080/salaries/${salaryId}/details`,
        formattedData,
        {
          headers: {
            "Content-Type": "application/json" // Pastikan header ini ada
          }
        }
      );

      // Update state
      if (selectedMember) {
        const updatedSalaries = selectedMember.salaries.map(salary => {
          if (salary.id === salaryId) {
            return {
              ...salary,
              details: [...salary.details, response.data]
            }
          }
          return salary
        });

        setSelectedMember(prev => ({
          ...prev!,
          salaries: updatedSalaries
        }));
      }
    } catch (error) {
      console.error("Error adding detail:", error);
    }
  };
  const handleAddKasbon = async (salaryId: string, newData: Kasbon) => {
    newData.tanggal = new Date(newData.tanggal).toISOString();
    try {
      const response = await axios.post(
        `http://localhost:8080/salaries/${salaryId}/kasbons`,
        newData
      );

      // Update state
      if (selectedMember) {
        const updatedSalaries = selectedMember.salaries.map(salary => {
          if (salary.id === salaryId) {
            return {
              ...salary,
              kasbons: [...salary.kasbons, response.data]
            }
          }
          return salary
        });

        setSelectedMember(prev => ({
          ...prev!,
          salaries: updatedSalaries
        }));
      }
    } catch (error) {
      console.error("Error adding kasbon:", error);
    }
  };
  // Team.tsx - Pastikan mengirim data dengan format yang benar
  const handleUpdateSalaryDetail = async (salaryId: string, id: string, updatedData: SalaryDetail) => {
    try {
      await axios.put(`http://localhost:8080/salaries/${salaryId}/details/${id}`, {
        ...updatedData,
        tanggal: new Date(updatedData.tanggal).toISOString(),
      });

      // Update state
      setSelectedMember(prev => {
        const updatedSalaries = prev?.salaries.map(salary => {
          if (salary.id === salaryId) {
            return {
              ...salary,
              details: salary.details.map(detail =>
                detail.id === id ? { ...detail, ...updatedData } : detail
              )
            }
          }
          return salary;
        });
        return { ...prev!, salaries: updatedSalaries || [] };
      });
    } catch (error) {
      console.error("Error updating detail:", error);
    }
  };

  // Team.tsx - Pastikan menghapus berdasarkan ID yang benar
  const handleDeleteSalaryDetail = async (salaryId: string, id: string) => {
    try {
      await axios.delete(`http://localhost:8080/salaries/${salaryId}/details/${id}`);

      // Update state
      setSelectedMember(prev => {
        const updatedSalaries = prev?.salaries.map(salary => {
          if (salary.id === salaryId) {
            return {
              ...salary,
              details: salary.details.filter(detail => detail.id !== id)
            }
          }
          return salary;
        });
        return { ...prev!, salaries: updatedSalaries || [] };
      });
    } catch (error) {
      console.error("Error deleting detail:", error);
    }
  };



  const handleEditKasbon = (salaryId: string, id: string, updatedData: Kasbon) => {
    setKasbonDetails(kasbonDetails.map(item =>
      item.id === id ? { ...updatedData, id } : item
    ));
  };

  const handleDeleteKasbon = (id: string) => {
    setKasbonDetails(kasbonDetails.filter(item => item.id !== id));
  };

  const calculatedValues = {
    grossSalary: newSalaryAmount, // Gaji kotor = gaji pokok
    netSalary: newSalaryAmount - newLoanAmount // Gaji bersih = gaji pokok - pinjaman
  };
  const [editingSalaryIndex, setEditingSalaryIndex] = useState<number | null>(null);
  const [newSalaryImages, setNewSalaryImages] = useState<File[]>([]);
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await axios.get('http://localhost:8080/members');
        const membersWithSalaries = response.data.data.map((member: any) => ({
          ...member,
          // Pastikan salaries selalu array
          salaries: Array.isArray(member.salaries) ? member.salaries : []
        }));
        setTeamMembersData(membersWithSalaries);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setTeamMembersData(teamMembers);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleCreateMember = async (newMember: Member) => {
    try {
      const response = await axios.post('http://localhost:8080/members', newMember);
      setTeamMembersData((prev) => [...prev, response.data.data]);
    } catch (error) {
      console.error('Error creating member:', error);
    }
  };

  const handleUpdateMember = async (updatedMember: Member) => {
    try {
      // 1. Update data member (tanpa file)
      const memberResponse = await axios.put(
        `http://localhost:8080/members/${updatedMember.id}`,
        updatedMember
      );

      // 2. Jika ada gambar profil baru, upload terpisah
      if (newProfileImage) {
        const profileFormData = new FormData();
        profileFormData.append("file", newProfileImage);

        await axios.post(
          `http://localhost:8080/members/${updatedMember.id}/profile`,
          profileFormData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      // 3. Perbarui state dengan data terbaru
      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === updatedMember.id ? memberResponse.data.data : member
        )
      );
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };



  const handleDocumentUpload = async (memberId: string, files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append("files", file); // Gunakan key "files" untuk semua file
      });

      const response = await axios.post(
        `http://localhost:8080/members/${memberId}/documents`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return response.data; // Pastikan backend mengembalikan array nama file
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.data); // Tampilkan detail error dari backend
      } else {
        console.error("Unexpected Error:", error);
      }
      return [];
    }
  };
  // Fungsi untuk menghapus anggota
  const handleDeleteMember = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8080/members/${id}`);
      setTeamMembersData((prev) => prev.filter((member) => member.id !== id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };


  const handleDeleteConfirmation = () => {
    if (selectedMember) {
      handleDeleteMember(selectedMember.id);
    }
  };


  const handleNewSalaryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setNewSalaryImages(Array.from(files));
    }
  };
  // Fungsi untuk mengedit salary
  const handleEditSalary = (index: number) => {
    if (!selectedMember) return;

    const salary = selectedMember.salaries[index];
    setNewSalaryMonth(salary.month);
    setNewSalaryAmount(salary.salary);
    setNewLoanAmount(salary.loan);
    setNewStatus(salary.status);
    setEditingSalaryIndex(index);
    setEditModalSalary(true);
  };

  // Fungsi untuk menyimpan perubahan salary
  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSalaryIndex === null || !selectedMember) return;

    try {
      const salaryToUpdate = selectedMember.salaries[editingSalaryIndex];

      // Update dokumen jika ada
      if (newSalaryImages.length > 0) {
        const formData = new FormData();
        newSalaryImages.forEach(file => formData.append("files", file));
        await axios.post(
          `http://localhost:8080/salaries/${salaryToUpdate.id}/documents`,
          formData
        );
      }

      // Update data gaji
      const updatedSalary = {
        month: newSalaryMonth,
        salary: newSalaryAmount,
        loan: newLoanAmount,
        net_salary: newSalaryAmount - newLoanAmount,
        gross_salary: newSalaryAmount,
        status: newStatus
      };

      const response = await axios.put(
        `http://localhost:8080/members/${selectedMember.id}/salaries/${salaryToUpdate.id}`,
        updatedSalary
      );

      // Update state
      const updatedSalaries = [...selectedMember.salaries];
      updatedSalaries[editingSalaryIndex] = response.data.data;

      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id ?
            { ...member, salaries: updatedSalaries } : member
        )
      );

      // Reset form
      setEditModalSalary(false);
      setEditingSalaryIndex(null);
    } catch (error) {
      console.error("Error updating salary:", error);
    }
  };

  const handleAddSalary = (newSalary: SalaryRecord) => {
    if (selectedMember) {
      setEditFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          salaries: [...prev.salaries, newSalary],
        };
      });
      setSelectedMember((prev) => ({
        ...prev!,
        salaries: [...prev!.salaries, newSalary],
      }));
    }
  };

  const handleDeleteSalary = async (salaryId: string) => {
    if (!selectedMember) return;

    try {
      await axios.delete(
        `http://localhost:8080/members/${selectedMember.id}/salaries/${salaryId}`
      );

      // Update state
      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id
            ? {
              ...member,
              salaries: member.salaries.filter(s => s.id !== salaryId)
            }
            : member
        )
      );

      setSelectedMember(prev => ({
        ...prev!,
        salaries: prev!.salaries.filter(s => s.id !== salaryId)
      }));
    } catch (error) {
      console.error("Error deleting salary:", error);
    }
  };

  // Add a form to input new salary records
  const handleModalNewSalary = () => {
    setNewModalSalary(!newModalSalary)
  }
  const handleSalaryUpload = async (memberId: string, files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      const response = await axios.post(
        `http://localhost:8080/members/${memberId}/salaries`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return response.data.files; // Return array nama file
    } catch (error) {
      console.error("Error uploading salary documents:", error);
      return [];
    }
  };

  const handleNewSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      // 1. Create salary data first
      const newSalaryData = {
        month: newSalaryMonth,
        salary: newSalaryAmount,
        loan: newLoanAmount,
        net_salary: newSalaryAmount - newLoanAmount,
        gross_salary: newSalaryAmount,
        status: newStatus
      };

      // 2. POST to create salary
      const salaryResponse = await axios.post(
        `http://localhost:8080/members/${selectedMember.id}/salaries`,
        newSalaryData
      );

      // 3. Jika ada dokumen, upload setelah salary dibuat
      if (newSalaryImages.length > 0) {
        const salaryId = salaryResponse.data.data.id;
        const formData = new FormData();
        newSalaryImages.forEach(file => formData.append("files", file));

        await axios.post(
          `http://localhost:8080/salaries/${salaryId}/documents`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      // 4. Update state dengan salary baru
      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id
            ? { ...member, salaries: [...member.salaries, salaryResponse.data.data] }
            : member
        )
      );

      // Reset form
      setNewModalSalary(false);
      setNewSalaryMonth('');
      setNewSalaryAmount(0);
      setNewLoanAmount(0);
      setNewSalaryImages([]);
    } catch (error) {
      console.error("Error submitting salary:", error);
    }
  };


  const handleMemberClick = async (member: Member) => {
    try {
      // Ambil data gaji member
      const salariesResponse = await axios.get(`http://localhost:8080/members/${member.id}/salaries`);
      const salaries = salariesResponse.data.data || [];

      // Ambil details dan kasbon untuk setiap salary
      const salariesWithDetails = await Promise.all(
        salaries.map(async (salary: any) => ({
          ...salary,
          details: await fetchSalaryDetails(salary.id),
          kasbons: await fetchKasbons(salary.id)
        }))
      );

      const memberWithData = {
        ...member,
        salaries: salariesWithDetails
      };

      setSelectedMember(memberWithData);
      setEditFormData(memberWithData);
    } catch (error) {
      console.error('Error fetching member data:', error);
    }
  };
  const handleDeleteDocument = async (fileName: string) => {
    if (!selectedMember) return;

    try {
      await axios.delete(`http://localhost:8080/members/${selectedMember.id}/documents/${fileName}`);

      // Update state
      const updatedDocuments = selectedMember.documents.filter(name => name !== fileName);
      const updatedMember = { ...selectedMember, documents: updatedDocuments };

      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id ? updatedMember : member
        )
      );
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };
  const HandleDeleteDocumentSalary = async (fileName: string, salaryId: string) => {
    if (!selectedMember) return;
    console.log(fileName)
    try {
      await axios.delete(`http://localhost:8080/salaries/${salaryId}/documents/${fileName}`);

      // // Update state
      // const updatedDocuments = selectedMember.documents.filter(name => name !== fileName);
      // const updatedMember = { ...selectedMember, documents: updatedDocuments };

      // setTeamMembersData(prev =>
      //   prev.map(member =>
      //     member.id === selectedMember.id ? updatedMember : member
      //   )
      // );
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleDeleteFile = async (docIndex: number, fileIndex: number) => {
    if (!selectedMember) return;

    try {
      const fileName = selectedMember.documents[docIndex][fileIndex];
      await axios.delete(
        `http://localhost:8080/members/${selectedMember.id}/documents/${fileName}`
      );

      // Update state
      const updatedDocuments = [...selectedMember.documents];
      updatedDocuments[docIndex].slice(fileIndex, 1);

      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id
            ? { ...member, documents: updatedDocuments }
            : member
        )
      );
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };



  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
      setSelectedMember(editFormData);
      setIsEditMode(false);
    }
  };

  const addNewDocument = () => {
    setIsAddingDocument(true);
  };

  const handleNewDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !newDocumentFiles.length) return;

    try {
      // Upload semua file ke endpoint khusus
      const uploadedFiles = await handleDocumentUpload(selectedMember.id, newDocumentFiles);

      // Update state dengan nama file baru
      const updatedMember = {
        ...selectedMember,
        documents: [...selectedMember.documents, ...uploadedFiles],
      };

      setTeamMembersData((prev) =>
        prev.map((member) =>
          member.id === selectedMember.id ? updatedMember : member
        )
      );

      // Reset form
      setNewDocumentFiles([]);
      setIsAddingDocument(false);
      setNewDocumentName(""); // Reset nama dokumen jika ada
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setNewDocumentFiles(Array.from(files)); // Simpan semua file yang dipilih
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newUrl = URL.createObjectURL(file);
      setNewProfileImage(file);
      setEditFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profileImage: newUrl, // Update the profile image URL in the state
        };
      });
    }
  };

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Team</h1>
        <p className="text-gray-500">Collaborate with your team members.</p>

        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>

          <div className="space-y-4">
            {teamMembersData.map((member) => (
              <div
                key={member.id}
                className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => handleMemberClick(member)}
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-indigo-600">{member.fullName.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{member.fullName}</p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedMember && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Member Details</h3>
            <div className="mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleTabClick('Personal')}
                  className={`px-4 py-2 rounded-md ${selectedTab === 'Personal' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  Personal
                </button>
                <button
                  onClick={() => handleTabClick('Salary')}
                  className={`px-4 py-2 rounded-md ${selectedTab === 'Salary' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  Salary
                </button>
                <button
                  onClick={() => handleTabClick('Documents')}
                  className={`px-4 py-2 rounded-md ${selectedTab === 'Documents' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  Documents
                </button>
              </div>
            </div>

            {selectedTab === 'Personal' && (
              <form className="space-y-4" onSubmit={handleEditSubmit}>
                <div className="mt-4">
                  <img
                    src={selectedMember.profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full cursor-pointer"
                    onClick={() => handleImageClick(selectedMember.profileImage)}
                  />
                </div>
                {isEditMode && (
                  <div>
                    <label className="block font-medium text-gray-700">Profile Image:</label>
                    <input
                      type="file"
                      onChange={handleProfileImageChange}
                      className="mt-1 border border-gray-300 rounded-md p-1"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-medium text-gray-700">Full Name:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="fullName"
                      value={editFormData?.fullName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  ) : (
                    <span>{selectedMember.fullName}</span>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Role:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="role"
                      value={editFormData?.role}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  ) : (
                    <span>{selectedMember.role}</span>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Phone Number:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="phoneNumber"
                      value={editFormData?.phoneNumber}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  ) : (
                    <span>{selectedMember.phoneNumber}</span>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Address:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="address"
                      value={editFormData?.address}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  ) : (
                    <span>{selectedMember.address}</span>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Join Date:</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="joinDate"
                      value={editFormData?.joinDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  ) : (
                    <span>{selectedMember.joinDate}</span>
                  )}
                </div>

              </form>
            )}
            {selectedTab === 'Salary' && (
              <div>

                <h4 className="text-lg font-semibold text-gray-800 mb-4">Salary Records</h4>
                {selectedMember.salaries && selectedMember.salaries.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No salary records available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(selectedMember.salaries || []).map((salary, index) => (
                      <div key={salary.id} className="flex flex-col bg-white p-4 rounded-lg shadow-sm">
                        <div>
                          <h4>{salary.month}</h4>

                          {/* Tampilkan detail gaji */}
                          <SalaryDetailsTable
                            type="salary"
                            data={salary.details}
                            onAdd={(newData) => handleAddSalaryDetail(String(salary.id), newData)}
                            onEdit={(id, data) => handleUpdateSalaryDetail(String(salary.id), id, data)}
                            onDelete={(id) => handleDeleteSalaryDetail(String(salary.id), id)}
                          />

                          {/* Kasbon Table */}
                          <SalaryDetailsTable
                            type="kasbon"
                            data={salary.kasbons}
                            onAdd={(newData) => handleAddKasbon(String(salary.id), newData)}
                            onEdit={(id, data) => handleEditKasbon(String(salary.id), id, data)}
                            onDelete={(id) => handleDeleteKasbon(String(salary.id))}
                          />
                          <p>Id: {salary.id}</p>
                          <p>Salary: {salary.salary}</p>
                          <p>Loan: {salary.loan}</p>
                          <p>Net Salary: {salary.net_salary}</p>
                          <p>Gross Salary: {salary.gross_salary}</p>
                          <p>Status: {salary.status}</p>
                          {salary.documents.length > 0 && (
                            <div className="mt-2">
                              <h5 className="font-medium">Bukti Pembayaran dan Kasbon :</h5>
                              <div
                                className="grid grid-cols-4 gap-8"
                                key={Number(salary.id)}
                                onMouseEnter={() => setHoveredIndex(Number(salary.id))}
                                onMouseLeave={() => setHoveredIndex(null)}
                              >
                                {salary.documents.map((fileName, urlIndex) => (
                                  <div
                                    key={`${salary.id}-${fileName}`}
                                    className='relative bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col items-center cursor-pointer hover:shadow-md w-full'
                                  >
                                    {hoveredIndex === salary.id && (
                                      <button
                                        onClick={() => HandleDeleteDocumentSalary(fileName, String(salary.id))}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-700"
                                      >
                                        ✕
                                      </button>
                                    )}
                                    <img
                                      key={urlIndex}
                                      src={`http://localhost:8080/uploads/${fileName}`}
                                      alt={`Bukti ${urlIndex}`}
                                      className="w-full h-48 object-cover rounded cursor-pointer"
                                      onClick={() => handleImageClick(`http://localhost:8080/uploads/${fileName}`)}
                                    />
                                  </div>
                                ))}
                              </div>

                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 py-4">
                          <button
                            onClick={() => handleEditSalary(index)}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSalary(String(salary.id))}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
                <AddButtonCategory text='Tambah Bulan' setShowModal={handleModalNewSalary}></AddButtonCategory>
                {newModalSalary && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      <form onSubmit={handleNewSalarySubmit} className="mt-4 space-y-4">
                        {/* Input Nama Bulan */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bulan</label>
                          <input
                            type="text"
                            placeholder="Masukkan nama bulan"
                            // value={newSalaryMonth}
                            onChange={(e) => setNewSalaryMonth(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        {/* Input Gaji Pokok */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Pokok</label>
                          <input
                            type="number"
                            placeholder="Masukkan jumlah gaji pokok"
                            // value={newSalaryAmount}
                            onChange={(e) => setNewSalaryAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        {/* Input Pinjaman */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pinjaman</label>
                          <input
                            type="number"
                            placeholder="Masukkan jumlah pinjaman"
                            // value={newLoanAmount}
                            onChange={(e) => setNewLoanAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          >
                            <option value="" disabled>Select Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        {/* Input Gambar */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Gambar : </label>
                          <input
                            type="file"
                            onChange={handleNewSalaryImagesChange}
                            multiple
                            className="mt-1 border border-gray-300 rounded-md p-1"
                          />
                        </div>
                        {editingSalaryIndex !== null && (
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Dokumen Terlampir:</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedMember.salaries[editingSalaryIndex].documents.map(
                                (fileName, idx) => (
                                  <img
                                    key={idx}
                                    src={`http://localhost:8080/uploads/${fileName}`}
                                    alt={`Document ${idx}`}
                                    className="w-full h-24 object-cover rounded cursor-pointer"
                                    onClick={() => handleImageClick(`http://localhost:8080/uploads/${fileName}`)}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {/* Tampilkan gambar yang diupload */}
                        {newSalaryImages.length > 0 && (
                          <div className="mt-2">
                            <h5 className="font-medium">Gambar yang diupload:</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {newSalaryImages.map((file, index) => (
                                <img key={index} src={URL.createObjectURL(file)} alt={`Uploaded ${index}`} className="w-full h-24 object-cover rounded" />
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          type="submit"
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {editingSalaryIndex !== null ? 'Update Data Gaji' : 'Tambah Data Gaji'}
                        </button>
                        <button
                          onClick={() => {
                            setNewModalSalary(false);
                            setEditingSalaryIndex(null);
                          }}
                          className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </form>

                    </div>
                  </div>
                )}
                {editModalSalary && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      <form onSubmit={handleUpdateSalary} className="mt-4 space-y-4">
                        {/* Input Nama Bulan */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bulan</label>
                          <input
                            type="text"
                            placeholder="Masukkan nama bulan"
                            value={newSalaryMonth}
                            onChange={(e) => setNewSalaryMonth(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        {/* Input Gaji Pokok */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Pokok</label>
                          <input
                            type="number"
                            placeholder="Masukkan jumlah gaji pokok"
                            value={newSalaryAmount}
                            onChange={(e) => setNewSalaryAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        {/* Input Pinjaman */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pinjaman</label>
                          <input
                            type="number"
                            placeholder="Masukkan jumlah pinjaman"
                            value={newLoanAmount}
                            onChange={(e) => setNewLoanAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          >
                            <option value="" disabled>Select Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        {/* Input Gambar */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Gambar : </label>
                          <input
                            type="file"
                            onChange={handleNewSalaryImagesChange}
                            multiple
                            className="mt-1 border border-gray-300 rounded-md p-1"
                          />
                        </div>
                        {editingSalaryIndex !== null && (
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Dokumen Terlampir:</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedMember.salaries[editingSalaryIndex].documents.map(
                                (fileName, idx) => (
                                  <img
                                    key={idx}
                                    src={`http://localhost:8080/uploads/${fileName}`}
                                    alt={`Document ${idx}`}
                                    className="w-full h-24 object-cover rounded cursor-pointer"
                                    onClick={() => handleImageClick(`http://localhost:8080/uploads/${fileName}`)}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {/* Tampilkan gambar yang diupload */}
                        {newSalaryImages.length > 0 && (
                          <div className="mt-2">
                            <h5 className="font-medium">Gambar yang diupload:</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {newSalaryImages.map((file, index) => (
                                <img key={index} src={URL.createObjectURL(file)} alt={`Uploaded ${index}`} className="w-full h-24 object-cover rounded" />
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          type="submit"
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {editingSalaryIndex !== null ? 'Update Data Gaji' : 'Tambah Data Gaji'}
                        </button>
                        <button
                          onClick={() => {
                            setEditModalSalary(false);
                            setEditingSalaryIndex(null);
                          }}
                          className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </form>

                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'Documents' && (
              <div className="space-y-6">
                {/* Add Document Section */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 transition-all duration-300 hover:border-blue-500">
                  {!isAddingDocument ? (
                    <button
                      className="w-full flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-blue-600"
                      onClick={addNewDocument}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="font-medium">Add New Document</span>
                    </button>
                  ) : (
                    <form onSubmit={handleNewDocumentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                        <input
                          type="text"
                          value={newDocumentName}
                          onChange={(e) => setNewDocumentName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. Project Contract"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Files</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-600 rounded-lg border-2 border-dashed border-blue-200 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="mt-2 text-sm font-medium">Select files</span>
                            <input
                              type="file"
                              onChange={handleDocumentFileChange}
                              multiple // Izinkan memilih banyak file
                              className="hidden"
                              required
                            />
                          </label>
                          <div className="flex-1 min-w-0">
                            {newDocumentFiles.length > 0 && (
                              <div className="text-sm text-gray-500 space-y-1">
                                <p className="font-medium">Selected files:</p>
                                {Array.from(newDocumentFiles).map((file, index) => (
                                  <p key={index} className="truncate">• {file.name}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          type="submit"
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          Upload {newDocumentFiles.length} File{newDocumentFiles.length !== 1 && 's'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingDocument(false)}
                          className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Document List */}
                <div className="grid grid-cols-1 gap-4">
                  {selectedMember.documents.map((document, index) => (
                    <div key={index}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* <h3 className="text-lg font-semibold text-gray-800 mb-2">{document.name}</h3> */}
                          <div className="grid grid-cols-3 gap-3">
                            {/* Pastikan document adalah array string */}
                            {Array.isArray(document) &&
                              document.map((fileName: string, fileIndex: number) => {
                                const fileUrl = `http://localhost:8080/uploads/${fileName}`; // Bangun URL lengkap
                                const isImage = fileName.match(/\.(jpe?g|png|gif)$/i); // Cek apakah file adalah gambar

                                return (
                                  <div key={fileIndex} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
                                      {isImage ? (
                                        // Jika file adalah gambar, tampilkan sebagai gambar
                                        <img
                                          src={fileUrl}
                                          alt={`Document-${fileIndex}`}
                                          className="w-full h-full object-cover cursor-pointer"
                                          onClick={() => handleImageClick(fileUrl)}
                                        />
                                      ) : (
                                        // Jika bukan gambar, tampilkan sebagai file download
                                        <a
                                          href={fileUrl}
                                          download
                                          className="w-full h-full flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 p-3"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-8 w-8 text-gray-400 mb-2"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                          </svg>
                                          <span className="text-xs text-gray-600 text-center font-medium truncate w-full">
                                            File {fileIndex + 1}
                                          </span>
                                        </a>
                                      )}
                                    </div>

                                    {isEditMode && (
                                      // Tombol delete untuk menghapus file
                                      <button
                                        onClick={() => handleDeleteFile(index, fileIndex)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {isEditMode && (
                          <label className="ml-4 flex flex-col items-center cursor-pointer text-blue-600 hover:text-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-xs mt-1">Add Files</span>
                            <input
                              type="file"
                              multiple
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files) {
                                  handleDocumentUpload(selectedMember.id, Array.from(files));
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
                    {selectedMember.documents.map((fileName, index) => {
                      const fileUrl = `http://localhost:8080/uploads/${fileName}`;
                      const isImage = fileName.match(/.(jpg|jpeg|png|gif)$/i);

                      return (
                        <div
                          key={index}
                          className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col items-center cursor-pointer hover:shadow-md w-full"
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          {isImage ? (
                            <img
                              src={fileUrl}
                              alt={fileName}
                              className="w-32 h-32 object-cover rounded-md mb-2"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded-md mb-2">
                              <span className="text-gray-500 text-sm">File</span>
                            </div>
                          )}

                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm text-center truncate w-full"
                          >
                            {fileName}
                          </a>

                          {hoveredIndex === index && (
                            <button
                              onClick={() => handleDeleteDocument(fileName)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-700"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


            {selectedTab === "Personal" && (
              <div className="mt-4">

                {isEditMode ? (
                  <>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md" onClick={() => handleUpdateMember(editFormData!)}>Save</button>
                    <button className="px-4 py-2 bg-gray-500 text-white rounded-md ml-4" onClick={() => setIsEditMode(false)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => setIsEditMode(true)}>Edit</button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-md ml-4" onClick={() => setIsDeleteModalOpen(true)}>Delete</button>
                  </>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <img src={selectedImage} alt="Profile" className="w-48 h-48 rounded mb-4" />
            <button onClick={() => setIsImageModalOpen(false)} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Are you sure you want to delete this member?</h4>
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2" onClick={handleCloseDeleteModal}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md" onClick={handleDeleteConfirmation}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;