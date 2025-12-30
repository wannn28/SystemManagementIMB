import React, { useState, useEffect } from 'react';
import { teamAPI } from '../api';
import { teamMembers } from '../types/teamMembersData';

import { Member, SalaryDetail, Kasbon, QueryParams, PaginationState } from '../types/BasicTypes';
import { AddButtonCategory } from '../component/AddButton';
import { SalaryDetailsTable } from './SalaryDetailsTable';
import { PDFGeneratorButton } from '../component/PDFGeneratorButton';
import { IDCardGeneratorButton } from '../component/IDCardGeneratorButton';
import { PaginatedTable } from '../component/PaginatedTable';
import DeactivateMemberModal from '../component/DeactivateMemberModal';
interface TeamProps {
  isCollapsed: boolean;
}


const Team: React.FC<TeamProps> = ({ isCollapsed }) => {
  const [teamMembersData, setTeamMembersData] = useState<Member[]>([]); // State untuk menyimpan anggota tim
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Personal');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | 'profile'>('profile');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Member | null>(null);
  // const [newDocumentName, setNewDocumentName] = useState('');
  const [isAddMemberModal, setIsAddMemberModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    fullName: '',
    role: '',
    phoneNumber: '',
    address: '',
    joinDate: '',
    profileImageFile: null as File | null,
  });
  // const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  // const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [newDocumentFiles, setNewDocumentFiles] = useState<File[]>([]); // Ubah ke array
  const [newSalaryMonth, setNewSalaryMonth] = useState('');
  const [newStatus, setNewStatus] = useState('Paid');
  const [newSalaryAmount, setNewSalaryAmount] = useState(0);
  const [newLoanAmount, setNewLoanAmount] = useState(0);
  const [newModalSalary, setNewModalSalary] = useState(false);
  const [editModalSalary, setEditModalSalary] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // const [salaryDetails, setSalaryDetails] = useState<SalaryDetail[]>([]);
  // const [kasbonDetails, setKasbonDetails] = useState<Kasbon[]>([]);
  const [deactivateModal, setDeactivateModal] = useState<{
    isOpen: boolean;
    member: Member | null;
  }>({
    isOpen: false,
    member: null
  });
  const [totalTeamSalary, setTotalTeamSalary] = useState<number>(0);
  const [salaryFilter, setSalaryFilter] = useState<{
    year: string;
    month: string;
    order: 'asc' | 'desc';
  }>({
    year: '',
    month: '',
    order: 'desc'
  });
  const [membersWithSalary, setMembersWithSalary] = useState<Array<{
    member_id: string;
    full_name: string;
    role: string;
    total_salary: number;
    is_active: boolean;
  }>>([]);
  const [showSalaryTable, setShowSalaryTable] = useState(false);
  const [selectedMemberForSalary, setSelectedMemberForSalary] = useState<{
    member_id: string;
    full_name: string;
    role: string;
  } | null>(null);
  const [monthlySalaryDetails, setMonthlySalaryDetails] = useState<Array<{
    month: string;
    salary: number;
    loan: number;
    net_salary: number;
    gross_salary: number;
    status: string;
    created_at: string;
  }>>([]);

  const handleAddSalaryDetail = async (salaryId: number, newData: SalaryDetail) => {
    const tempId = Date.now().toString(); // ID sementara
    setSelectedMember(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        salaries: prev.salaries.map(salary =>
          salary.id === Number(salaryId) ? {
            ...salary,
            details: [...(salary.details || []), { ...newData, id: tempId }]
          } : salary
        )
      };
    });
    try {
      // Kirim permintaan POST ke backend
      await teamAPI.salaryDetails.create(salaryId.toString(), newData);

      // Fetch ulang data salary yang sudah diupdate dari backend
      const updatedSalary = await teamAPI.salaries.getBySalaryId(salaryId.toString());
      
      // Fetch ulang details untuk salary ini
      const updatedDetails = await teamAPI.salaryDetails.getBySalaryId(salaryId.toString());
      
      // Update state dengan data salary yang sudah diupdate
      setSelectedMember(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          salaries: prev.salaries.map(salary =>
            salary.id === salaryId ? {
              ...updatedSalary,
              details: updatedDetails
            } : salary
          )
        };
      });

    } catch (error) {
      console.error("Error adding detail:", error);
    }
  };
  const handleAddKasbon = async (salaryId: number, newData: Kasbon) => {
    try {
      // Kirim permintaan POST ke backend
      await teamAPI.kasbons.create(salaryId.toString(), newData);

      // Fetch ulang data salary yang sudah diupdate dari backend
      const updatedSalary = await teamAPI.salaries.getBySalaryId(salaryId.toString());
      
      // Fetch ulang kasbon untuk salary ini
      const updatedKasbons = await teamAPI.kasbons.getBySalaryId(salaryId.toString());

      // Update state dengan data yang sudah diupdate
      setSelectedMember(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          salaries: prev.salaries.map(salary =>
            salary.id === salaryId ? {
              ...updatedSalary,
              kasbons: updatedKasbons
            } : salary
          )
        };
      });
    } catch (error) {
      console.error("Error adding kasbon:", error);
    }
  };
  // Team.tsx - Pastikan mengirim data dengan format yang benar
  const handleUpdateSalaryDetail = async (salaryId: string, id: string, updatedData: SalaryDetail) => {
    try {
      // 1. Kirim PUT request
      await teamAPI.salaryDetails.update(salaryId, id, updatedData);
  
      // 2. Fetch ulang data salary yang sudah diupdate dari backend
      const updatedSalary = await teamAPI.salaries.getBySalaryId(salaryId);
      
      // 3. Fetch ulang details untuk salary ini
      const updatedDetails = await teamAPI.salaryDetails.getBySalaryId(salaryId);
      
      // 4. Update state dengan data yang sudah diupdate
      setSelectedMember(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          salaries: prev.salaries.map(salary => {
            const salaryId2 = Number(salaryId)
            if (salary.id === salaryId2) {
              return {
                ...updatedSalary,
                details: updatedDetails
              };
            }
            return salary;
          })
        };
      });
  
    } catch (error) {
      console.error("Error updating detail:", error);
    }
  };

  // Team.tsx - Pastikan menghapus berdasarkan ID yang benar
  const handleDeleteSalaryDetail = async (salaryId: string, id: string) => {
    if (!selectedMember) return;
    
    try {
      // Kirim permintaan DELETE ke backend
      await teamAPI.salaryDetails.delete(salaryId, id);

      // Fetch ulang data salary yang sudah diupdate dari backend
      const updatedSalary = await teamAPI.salaries.getBySalaryId(salaryId);
      
      // Fetch ulang details untuk salary ini
      const updatedDetails = await teamAPI.salaryDetails.getBySalaryId(salaryId);

      // Perbarui state dengan data terbaru
      setSelectedMember(prev => {
        if (!prev) return prev;
        const updatedSalaries = prev.salaries.map(salary => {
          const salaryId2 = Number(salaryId)
          if (salary.id === salaryId2) {
            return { 
              ...updatedSalary, 
              details: updatedDetails 
            };
          }
          return salary;
        });
        return { ...prev, salaries: updatedSalaries };
      });

    } catch (error) {
      console.error("Error deleting detail:", error);
    }
  };



  const handleEditKasbon = async (salaryId: string, id: string, updatedData: Kasbon) => {
    try {
      // Kirim permintaan PUT ke backend
      await teamAPI.kasbons.update(id, updatedData);

      // Fetch ulang data salary yang sudah diupdate dari backend
      const updatedSalary = await teamAPI.salaries.getBySalaryId(salaryId);
      
      // Fetch ulang kasbon untuk salary ini
      const updatedKasbons = await teamAPI.kasbons.getBySalaryId(salaryId);

      // Update state dengan data yang sudah diupdate
      setSelectedMember(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          salaries: prev.salaries.map(salary =>
            salary.id === Number(salaryId) ? {
              ...updatedSalary,
              kasbons: updatedKasbons
            } : salary
          )
        };
      });
    } catch (error) {
      console.error("Error updating kasbon:", error);
    }
  };

  const handleDeleteKasbon = async (salaryId: string, id: string) => {
    try {
      // Kirim permintaan DELETE ke backend
      await teamAPI.kasbons.delete(id);

      // Fetch ulang data salary yang sudah diupdate dari backend
      const updatedSalary = await teamAPI.salaries.getBySalaryId(salaryId);
      
      // Fetch ulang kasbon untuk salary ini
      const updatedKasbons = await teamAPI.kasbons.getBySalaryId(salaryId);

      // Update state dengan data yang sudah diupdate
      setSelectedMember(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          salaries: prev.salaries.map(salary =>
            salary.id === Number(salaryId) ? {
              ...updatedSalary,
              kasbons: updatedKasbons
            } : salary
          )
        };
      });
    } catch (error) {
      console.error("Error deleting kasbon:", error);
    }
  };

  // const calculatedValues = {
  //   grossSalary: newSalaryAmount, // Gaji kotor = gaji pokok
  //   netSalary: newSalaryAmount - newLoanAmount // Gaji bersih = gaji pokok - pinjaman
  // };
  const [editingSalaryIndex, setEditingSalaryIndex] = useState<number | null>(null);
  const [newSalaryImages, setNewSalaryImages] = useState<File[]>([]);
  useEffect(() => {
    if (selectedMember) {
      setTeamMembersData(prevMembers =>
        prevMembers.map(member =>
          member.id === selectedMember.id ? selectedMember : member
        )
      );
    }
  }, [selectedMember]);
  const fetchTeamMembers = async (params: QueryParams = { page: 1, limit: 10 }) => {
    setLoading(true);
    try {
      const paginatedResponse = await teamAPI.members.getPaginated(params);
      const membersWithSalaries = paginatedResponse.data.map((member: any) => ({
        ...member,
        // Pastikan salaries selalu array
        salaries: Array.isArray(member.salaries) ? member.salaries : []
      }));
      setTeamMembersData(membersWithSalaries);
      setPagination(paginatedResponse.pagination);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembersData(teamMembers);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (params: QueryParams) => {
    fetchTeamMembers(params);
  };

  useEffect(() => {
    fetchTeamMembers();
    fetchTotalTeamSalary();
    fetchMembersWithSalary();
  }, []);

  const fetchTotalTeamSalary = async (year?: string, month?: string) => {
    try {
      if (year || month) {
        const result = await teamAPI.members.getAllTotalSalaryWithFilter(year, month);
        setTotalTeamSalary(result.total_salary);
      } else {
        const result = await teamAPI.members.getAllTotalSalary();
        setTotalTeamSalary(result.total_salary);
      }
    } catch (error) {
      console.error('Error fetching total team salary:', error);
    }
  };

  const fetchMembersWithSalary = async () => {
    try {
      const result = await teamAPI.members.getAllWithSalaryInfo(
        salaryFilter.year || undefined,
        salaryFilter.month || undefined,
        salaryFilter.order
      );
      setMembersWithSalary(result || []);
    } catch (error) {
      console.error('Error fetching members with salary:', error);
      setMembersWithSalary([]);
    }
  };

  const handleSalaryFilterApply = async () => {
    try {
      await fetchTotalTeamSalary(salaryFilter.year || undefined, salaryFilter.month || undefined);
      await fetchMembersWithSalary();
    } catch (error) {
      console.error('Error applying filter:', error);
    }
  };

  const handleResetSalaryFilter = async () => {
    setSalaryFilter({ year: '', month: '', order: 'desc' });
    try {
      await fetchTotalTeamSalary();
      await fetchMembersWithSalary();
    } catch (error) {
      console.error('Error resetting filter:', error);
    }
  };

  const handleMemberSalaryClick = async (member: {
    member_id: string;
    full_name: string;
    role: string;
  }) => {
    try {
      setSelectedMemberForSalary(member);
      const details = await teamAPI.members.getMonthlySalaryDetails(
        member.member_id,
        salaryFilter.year || undefined
      );
      setMonthlySalaryDetails(details || []);
    } catch (error) {
      console.error('Error fetching monthly salary details:', error);
      setMonthlySalaryDetails([]);
    }
  };

  const handleDeactivateMember = async (reason: string) => {
    if (!deactivateModal.member) return;
    
    try {
      await teamAPI.members.deactivate(deactivateModal.member.id, reason);
      
      // Refresh data
      await fetchTeamMembers({ page: pagination.page, limit: pagination.limit });
      
      // Update selected member if it's the one being deactivated
      if (selectedMember?.id === deactivateModal.member.id) {
        setSelectedMember({
          ...selectedMember,
          isActive: false,
          deactivationReason: reason,
          deactivatedAt: new Date().toISOString()
        });
      }
      
      // Close modal
      setDeactivateModal({ isOpen: false, member: null });
      
      alert(`Member ${deactivateModal.member.fullName} berhasil dinonaktifkan`);
    } catch (error) {
      console.error('Error deactivating member:', error);
      alert('Gagal menonaktifkan member. Silakan coba lagi.');
    }
  };

  const handleActivateMember = async (member: Member) => {
    const confirmed = window.confirm(`Aktifkan kembali ${member.fullName}?`);
    if (!confirmed) return;
    
    try {
      await teamAPI.members.activate(member.id);
      
      // Refresh data
      await fetchTeamMembers({ page: pagination.page, limit: pagination.limit });
      
      // Update selected member if it's the one being activated
      if (selectedMember?.id === member.id) {
        setSelectedMember({
          ...selectedMember,
          isActive: true,
          deactivationReason: '',
          deactivatedAt: ''
        });
      }
      
      alert(`Member ${member.fullName} berhasil diaktifkan kembali`);
    } catch (error) {
      console.error('Error activating member:', error);
      alert('Gagal mengaktifkan member. Silakan coba lagi.');
    }
  };

  const handleCreateMember = async (memberData: Omit<Member, 'id' | 'profileImage'>, profileImageFile?: File) => {
    try {
      // Create member dengan gambar profil jika ada
      await teamAPI.members.create(memberData, profileImageFile);

      // Refresh data setelah create
      await fetchTeamMembers({ page: pagination.page, limit: pagination.limit });
      
      setIsAddMemberModal(false); // Tutup modal
      
      // Reset form
      setNewMemberData({
        fullName: '',
        role: '',
        phoneNumber: '',
        address: '',
        joinDate: '',
        profileImageFile: null,
      });
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member. Please check the console for details.');
    }
  };

  const handleUpdateMember = async (updatedMember: Member) => {
    try {
      // Update data member
      const newData = await teamAPI.members.update(updatedMember.id, updatedMember);
      
      // Update main state
      setTeamMembersData(prev =>
        prev.map(member => member.id === newData.id ? newData : member)
      );

      // Update selected member jika sedang dipilih
      if (selectedMember?.id === newData.id) {
        setSelectedMember(newData);
        setEditFormData(newData);
      }

      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };
  const handleProfileImageChange = async (memberId: string, file: File) => {
    try {
      const response = await teamAPI.members.uploadProfileImage(memberId, file);
  
      // Perbarui kedua state
      const updatedMember = { 
        ...selectedMember!, 
        profileImage: response.fileName 
      };
      
      setSelectedMember(updatedMember);
      setEditFormData(updatedMember); // <-- Tambahkan ini
  
      return response;
    } catch (error) {
      console.error("Error uploading profile image:", error);
    }
  };

  const handleDocumentUpload = async (memberId: string, files: File[]) => {
    try {
      const uploadedFiles = await teamAPI.members.uploadDocuments(memberId, files);
      const normalized: string[] = Array.isArray(uploadedFiles)
        ? uploadedFiles
        : typeof uploadedFiles === 'string'
          ? [uploadedFiles]
          : [];
      
      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === memberId
            ? { ...member, documents: [...member.documents, ...normalized] }
            : member
        )
      );

      if (selectedMember?.id === memberId) {
        setSelectedMember(prev => prev !== null ? { ...prev, documents: [...prev.documents, ...normalized] } : prev);
      }
      
      return normalized; // Pastikan backend mengembalikan array nama file
    } catch (error) {
      console.error("Error uploading documents:", error);
      return [];
    }
  };
  // Fungsi untuk menghapus anggota
  const handleDeleteMember = async (id: string) => {
    setIsDeleting(true);
    try {
      await teamAPI.members.delete(id);
      
      // Jika member yang dihapus sedang dipilih, reset selectedMember dulu
      if (selectedMember?.id === id) {
        setSelectedMember(null);
      }

      // Refresh data setelah delete
      await fetchTeamMembers({ page: pagination.page, limit: pagination.limit });

      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting member:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete member. Please check the console for details.';
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
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

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSalaryIndex === null || !selectedMember) return;

    try {
      const salaryToUpdate = selectedMember.salaries[editingSalaryIndex];
      const salaryId = salaryToUpdate.id;

      // 1. Update data gaji
      const updatedSalary = {
        month: newSalaryMonth,
        salary: newSalaryAmount,
        loan: newLoanAmount,
        net_salary: newSalaryAmount - newLoanAmount,
        gross_salary: newSalaryAmount,
        status: newStatus
      };
      
      // 2. Upload dokumen jika ada
      if (newSalaryImages.length > 0) {
        await teamAPI.salaries.uploadDocuments(String(salaryToUpdate.id), newSalaryImages);
      }

      // 3. Update data gaji
      const updatedSalaryData = await teamAPI.salaries.update(selectedMember.id, String(salaryId), updatedSalary);

      const existingSalary = selectedMember.salaries[editingSalaryIndex];
      const mergedSalary = {
        ...updatedSalaryData,
        details: existingSalary.details || [],
        kasbons: existingSalary.kasbons || []
      };
      // 4. Update state dengan data yang baru
      const updatedSalaries = [...selectedMember.salaries];
      updatedSalaries[editingSalaryIndex] = mergedSalary;

      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id ?
            { ...member, salaries: updatedSalaries } : member
        )
      );

      setSelectedMember(prev => ({
        ...prev!,
        salaries: updatedSalaries
      }));

      // 5. Tutup modal dan reset state
      setEditModalSalary(false);
      setEditingSalaryIndex(null);
      setNewSalaryImages([]);

    } catch (error) {
      console.error("Error updating salary:", error);
    }
  };
  // const handleAddSalary = (newSalary: SalaryRecord) => {
  //   if (selectedMember) {
  //     setEditFormData((prev) => {
  //       if (!prev) return prev;
  //       return {
  //         ...prev,
  //         salaries: [...prev.salaries, newSalary],
  //       };
  //     });
  //     setSelectedMember((prev) => ({
  //       ...prev!,
  //       salaries: [...prev!.salaries, newSalary],
  //     }));
  //   }
  // };

  const handleDeleteSalary = async (salaryId: string) => {
    if (!selectedMember) return;
    const prevState = [...teamMembersData];
    
    try {
      // Delete salary using API
      await teamAPI.salaries.delete(selectedMember.id, salaryId);
      
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
      setTeamMembersData(prevState);
      console.error("Error deleting salary:", error);
    }
  };

  // Add a form to input new salary records
  const handleModalNewSalary = () => {
    setNewModalSalary(!newModalSalary)
  }
  // const handleSalaryUpload = async (memberId: string, files: File[]) => {
  //   try {
  //     const formData = new FormData();
  //     files.forEach(file => formData.append("files", file));



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
      const newSalary = await teamAPI.salaries.create(selectedMember.id, newSalaryData);

      // 3. Jika ada dokumen, upload setelah salary dibuat
      if (newSalaryImages.length > 0) {
        const salaryId = newSalary.id;
        await teamAPI.salaries.uploadDocuments(String(salaryId), newSalaryImages);
      }

      // Update team members data
      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id
            ? { ...member, salaries: [...member.salaries, newSalary] }
            : member
        )
      );

      // Update selected member
      setSelectedMember(prev => ({
        ...prev!,
        salaries: [...prev!.salaries, newSalary]
      }));

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
    const localMember = teamMembersData.find(m => m.id === member.id);
    if (localMember) {
      setSelectedMember(localMember);
      setEditFormData(localMember);
    }

    try {
      // Ambil data gaji member
      const salaries = await teamAPI.salaries.getByMemberId(member.id);

      // Ambil details dan kasbon untuk setiap salary
      const salariesWithDetails = await Promise.all(
        salaries.map(async (salary: any) => ({
          ...salary,
          details: await teamAPI.salaryDetails.getBySalaryId(salary.id),
          kasbons: await teamAPI.kasbons.getBySalaryId(salary.id)
        }))
      );

      const updatedMember = {
        ...member,
        salaries: salariesWithDetails
      };

      setSelectedMember(updatedMember);
      setTeamMembersData(prev =>
        prev.map(m => m.id === member.id ? updatedMember : m)
      );
    } catch (error) {
      console.error('Error fetching member data:', error);
    }
  };
  const handleDeleteDocument = async (fileName: string) => {
    if (!selectedMember) return;
  
    try {
      await teamAPI.members.deleteDocument(selectedMember.id, fileName);
  
      // Update state
      const updatedDocuments = selectedMember.documents.filter(name => name !== fileName);
      const updatedMember = { ...selectedMember, documents: updatedDocuments };
      
      // Perbarui kedua state
      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id ? updatedMember : member
        )
      );
      
      // Tambahkan ini untuk memperbarui member yang sedang dipilih
      setSelectedMember(updatedMember);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };
  const HandleDeleteDocumentSalary = async (fileName: string, salaryId: string) => {
    if (!selectedMember) return;
  
    try {
      await teamAPI.salaries.deleteDocument(salaryId, fileName);
  
      // Update state dengan benar
      const updatedSalaries = selectedMember.salaries.map(salary => {
        if (String(salary.id) === salaryId) {
          return {
            ...salary,
            documents: salary.documents.filter(doc => doc !== fileName)
          };
        }
        return salary;
      });
  
      const updatedMember = { 
        ...selectedMember, 
        salaries: updatedSalaries 
      };
  
      // Perbarui kedua state
      setTeamMembersData(prev =>
        prev.map(member =>
          member.id === selectedMember.id ? updatedMember : member
        )
      );
      
      setSelectedMember(updatedMember);
  
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleDeleteFile = async (docIndex: number, fileIndex: number) => {
    if (!selectedMember) return;

    try {
      const fileName = selectedMember.documents[docIndex][fileIndex];
      await teamAPI.members.deleteDocument(selectedMember.id, fileName);

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
    setIsDeleting(false);
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
      // setNewDocumentName(""); // Reset nama dokumen jika ada
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



  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'} bg-gradient-to-br from-gray-50 via-orange-50/20 to-amber-50/30 min-h-screen`}>
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-orange-900 to-amber-900 bg-clip-text text-transparent mb-2">
              Manajemen Tim
            </h2>
            <p className="text-gray-600 text-sm">Kelola anggota tim dan informasi karyawan</p>
            
            {/* Total Team Salary Card */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 rounded-xl border border-green-200">
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    Total Gaji Tim {salaryFilter.year && `- ${salaryFilter.year}${salaryFilter.month ? `-${salaryFilter.month}` : ''}`}
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    Rp {totalTeamSalary.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowSalaryTable(!showSalaryTable)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {showSalaryTable ? 'Sembunyikan' : 'Lihat'} Laporan Gaji
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddMemberModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200 hover:scale-105"
            >
              Tambah Anggota Tim
            </button>
          </div>
        </div>

        {/* Salary Report Section */}
        {showSalaryTable && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Laporan Gaji Tim
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">Analisis pembayaran gaji karyawan</p>
                </div>
                <button
                  onClick={() => setShowSalaryTable(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Tahun
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: 2025"
                    value={salaryFilter.year}
                    onChange={(e) => setSalaryFilter({ ...salaryFilter, year: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Bulan
                  </label>
                  <select
                    value={salaryFilter.month}
                    onChange={(e) => setSalaryFilter({ ...salaryFilter, month: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">Semua Bulan</option>
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Urutan
                  </label>
                  <select
                    value={salaryFilter.order}
                    onChange={(e) => setSalaryFilter({ ...salaryFilter, order: e.target.value as 'asc' | 'desc' })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="desc">Tertinggi ke Terendah</option>
                    <option value="asc">Terendah ke Tertinggi</option>
                  </select>
                </div>
                
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleSalaryFilterApply}
                    className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Filter
                  </button>
                  <button
                    onClick={handleResetSalaryFilter}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                    title="Reset Filter"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Members Salary Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Nama Karyawan
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Jabatan
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center justify-end gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Total Gaji
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!membersWithSalary || membersWithSalary.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-lg font-semibold text-gray-500">Tidak ada data gaji</p>
                          <p className="text-sm text-gray-400 mt-1">Silakan ubah filter atau tambahkan data gaji</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    membersWithSalary.map((member, index) => (
                      <tr 
                        key={member.member_id} 
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => handleMemberSalaryClick(member)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                              {member.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-bold text-gray-900">
                                {member.full_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 font-medium">
                            {member.role}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {member.is_active ? (
                            <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full flex items-center gap-1 w-fit">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Aktif
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full flex items-center gap-1 w-fit">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-gray-900">
                            Rp {member.total_salary.toLocaleString('id-ID')}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {membersWithSalary && membersWithSalary.length > 0 && (
                  <tfoot className="bg-gradient-to-r from-blue-600 to-indigo-600 border-t-4 border-blue-700">
                    <tr>
                      <td colSpan={3} className="px-6 py-5 text-right">
                        <span className="text-sm font-bold text-white uppercase tracking-wide flex items-center justify-end gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Total Keseluruhan
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-2xl font-bold text-white">
                          Rp {membersWithSalary.reduce((sum, m) => sum + m.total_salary, 0).toLocaleString('id-ID')}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {isAddMemberModal && (
          <div className="fixed inset-0 bg-white-800 bg-opacity-30 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Add New Member</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const { fullName, role, phoneNumber, address, joinDate, profileImageFile } = newMemberData;
                
                // Validasi minimal
                if (!fullName || !role || !phoneNumber || !address || !joinDate) {
                  alert('Please fill in all required fields');
                  return;
                }
                
                await handleCreateMember(
                  {
                    fullName,
                    role,
                    phoneNumber,
                    address,
                    joinDate,
                    salaries: [], // Add this property
                    documents: [], // Add this property
                  },
                  profileImageFile || undefined
                );
              }} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={newMemberData.fullName}
                    onChange={(e) => setNewMemberData({ ...newMemberData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md"
                    required
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    type="text"
                    value={newMemberData.role}
                    onChange={(e) => setNewMemberData({ ...newMemberData, role: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    value={newMemberData.phoneNumber}
                    onChange={(e) => setNewMemberData({ ...newMemberData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md"
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={newMemberData.address}
                    onChange={(e) => setNewMemberData({ ...newMemberData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md"
                    required
                  />
                </div>

                {/* Join Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Join Date</label>
                  <input
                    type="date"
                    value={newMemberData.joinDate}
                    onChange={(e) => setNewMemberData({ ...newMemberData, joinDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md"
                    required
                  />
                </div>

                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewMemberData({ ...newMemberData, profileImageFile: e.target.files[0] });
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md"
                  >
                    Create Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <PaginatedTable<Member>
            data={teamMembersData}
            pagination={pagination}
            onQueryChange={handleQueryChange}
            loading={loading}
            searchFields={[
              { key: 'fullName', label: 'Name' },
              { key: 'role', label: 'Role' },
              { key: 'phoneNumber', label: 'Phone' }
            ]}
            sortFields={[
              { key: 'id', label: 'ID' },
              { key: 'fullName', label: 'Name' },
              { key: 'role', label: 'Role' },
              { key: 'joinDate', label: 'Join Date' }
            ]}
            filterFields={[
              {
                key: 'role',
                label: 'Role',
                options: [
                  { value: 'Project Manager', label: 'Project Manager' },
                  { value: 'Developer', label: 'Developer' },
                  { value: 'Designer', label: 'Designer' },
                  { value: 'Analyst', label: 'Analyst' }
                ]
              }
            ]}
            renderHeader={() => (
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            )}
            renderRow={(member) => (
              <tr
                key={member.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleMemberClick(member)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    {member.profileImage ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}/uploads/${member.profileImage}`}
                        alt={member.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-600 font-medium">
                        {member.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {member.fullName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {member.role}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {member.phoneNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(member.joinDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMemberClick(member);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            )}
            className="mt-6"
          />

        {selectedMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    {selectedMember.profileImage ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}/uploads/${selectedMember.profileImage}`}
                        alt={selectedMember.fullName}
                        className="w-full h-full rounded-full object-cover ring-2 ring-white/50"
                      />
                    ) : (
                      <span className="text-white text-xl font-bold">
                        {selectedMember.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Detail Anggota Tim</h3>
                    <p className="text-white/80 text-sm">{selectedMember.fullName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedMember(null);
                    setIsEditMode(false);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleTabClick('Personal')}
                      className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                        selectedTab === 'Personal' 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Personal
                      </div>
                    </button>
                    <button
                      onClick={() => handleTabClick('Salary')}
                      className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                        selectedTab === 'Salary' 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Gaji
                      </div>
                    </button>
                    <button
                      onClick={() => handleTabClick('Documents')}
                      className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                        selectedTab === 'Documents' 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Dokumen
                      </div>
                    </button>
                  </div>
                </div>

            {selectedTab === 'Personal' && (
              <form className="space-y-4" onSubmit={handleEditSubmit}>
                <div className="mt-4">
                  <img  
                    // ambil dari env
                    src={`${import.meta.env.VITE_API_URL}/uploads/${selectedMember.profileImage}`}
                    alt="Profile"
                    className="w-24 h-24 rounded-full cursor-pointer"
                    onClick={() => handleImageClick(`${import.meta.env.VITE_API_URL}/uploads/${selectedMember.profileImage}`)}
                  />
                </div>
                {isEditMode && (
                  <div>
                    <label className="block font-medium text-gray-700">Profile Image:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files[0]) {
                          handleProfileImageChange(selectedMember.id, files[0]);
                        }
                      }}
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
                
                {/* Status Information - Always visible */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Status Keanggotaan</label>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-3">
                      {selectedMember.isActive !== false ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="px-4 py-1.5 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                            Aktif
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="px-4 py-1.5 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                            Nonaktif
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div>
                      {selectedMember.isActive !== false ? (
                        <button
                          onClick={() => setDeactivateModal({ isOpen: true, member: selectedMember })}
                          className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Nonaktifkan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateMember(selectedMember)}
                          className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Aktifkan
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {selectedMember.isActive === false && selectedMember.deactivationReason && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900">Alasan Nonaktif:</p>
                          <p className="text-sm text-amber-800 mt-1">{selectedMember.deactivationReason}</p>
                          {selectedMember.deactivatedAt && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Dinonaktifkan pada: {new Date(selectedMember.deactivatedAt).toLocaleDateString('id-ID', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
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
                            data={salary.details || []} // Fallback ke array kosong
                            onAdd={(newData) => handleAddSalaryDetail(Number(salary.id), newData)}
                            onEdit={(id, data) => handleUpdateSalaryDetail(String(salary.id), id, data)}
                            onDelete={(id) => handleDeleteSalaryDetail(String(salary.id), id)}
                          />

                          <SalaryDetailsTable
                            type="kasbon"
                            data={salary.kasbons || []} // Fallback ke array kosong
                            onAdd={(newData) => handleAddKasbon(Number(salary.id), newData)}
                            onEdit={(id, data) => handleEditKasbon(String(salary.id), id, data)}
                            onDelete={(id) => handleDeleteKasbon(String(salary.id), id)}
                          />
                          <p>Id : {salary.id}</p>
                          <p>Jumlah Gaji : {salary.salary}</p>
                          <p>Kasbon : {salary.loan}</p>
                          <p>Gaji Bersih : {salary.net_salary}</p>
                          <p>Gaji Kotor : {salary.gross_salary}</p>
                          <p>Status : {salary.status}</p>
                          {salary.documents && salary.documents.length > 0 && (
                            <div className="mt-2">
                              <h5 className="font-medium">Bukti Pembayaran dan Kasbon : </h5>
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
                                        src={`${import.meta.env.VITE_API_URL}/uploads/${fileName}`}
                                      alt={`Bukti ${urlIndex}`}
                                      className="w-full h-48 object-cover rounded cursor-pointer"
                                      onClick={() => handleImageClick(`${import.meta.env.VITE_API_URL}/uploads/${fileName}`)}
                                    />
                                  </div>
                                ))}
                              </div>

                            </div>
                          )}
                          {/* {salary.documents && salary.documents.length > 0 && (
                            <div className="mt-4">
                              <PDFGeneratorButton member={selectedMember} salary={salary} />
                            </div>
                          )} */}
                          <div className="mt-4">
                            <PDFGeneratorButton member={selectedMember} salary={salary} />
                          </div>
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
                  <div className="fixed inset-0 bg-white-800 bg-opacity-30 flex items-center justify-center p-4 backdrop-blur-sm">
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
                                      src={`${import.meta.env.VITE_API_URL}/uploads/${fileName}`}
                                    alt={`Document ${idx}`}
                                    className="w-full h-24 object-cover rounded cursor-pointer"
                                    onClick={() => handleImageClick(`${import.meta.env.VITE_API_URL}/uploads/${fileName}`)}
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
                              {selectedMember.salaries[editingSalaryIndex].documents && selectedMember.salaries[editingSalaryIndex].documents.map(
                                (fileName, idx) => (
                                  <img
                                    key={idx}
                                      src={`${import.meta.env.VITE_API_URL}/uploads/${fileName}`}
                                    alt={`Document ${idx}`}
                                    className="w-full h-24 object-cover rounded cursor-pointer"
                                    onClick={() => handleImageClick(`${import.meta.env.VITE_API_URL}/uploads/${fileName}`)}
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
                        {/* <input
                          type="text"
                          value={newDocumentName}
                          onChange={(e) => setNewDocumentName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. Project Contract"
                          required
                        /> */}
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
                                  const fileUrl = `${import.meta.env.VITE_API_URL}/uploads/${fileName}`; // Bangun URL lengkap
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
                        const fileUrl = `${import.meta.env.VITE_API_URL}/uploads/${fileName}`;
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


              </div>
              
              {/* Modal Footer - Action Buttons */}
              {selectedTab === "Personal" && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="flex gap-2">
                    <IDCardGeneratorButton member={selectedMember} />
                  </div>
                  
                  <div className="flex gap-2">
                    {isEditMode ? (
                      <>
                        <button 
                          className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2" 
                          onClick={() => handleUpdateMember(editFormData!)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Simpan
                        </button>
                        <button 
                          className="px-6 py-2.5 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all duration-200 flex items-center gap-2" 
                          onClick={() => setIsEditMode(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Batal
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2" 
                          onClick={() => setIsEditMode(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2" 
                          onClick={() => setIsDeleteModalOpen(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <img src={selectedImage} alt="Profile" className="w-48 h-48 rounded mb-4" />
            <button onClick={() => setIsImageModalOpen(false)} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal - Modern Design */}
      {isDeleteModalOpen && selectedMember && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              handleCloseDeleteModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 rounded-t-2xl border-b border-red-100">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Member</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0">
                  {selectedMember.profileImage ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}/uploads/${selectedMember.profileImage}`}
                      alt={selectedMember.fullName}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-red-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center ring-2 ring-red-200">
                      <span className="text-white text-xl font-bold">
                        {selectedMember.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">{selectedMember.fullName}</span>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Warning:</span> All associated data including salaries, documents, and files will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmation}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Member</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Member Modal */}
      <DeactivateMemberModal
        isOpen={deactivateModal.isOpen}
        member={deactivateModal.member}
        onClose={() => setDeactivateModal({ isOpen: false, member: null })}
        onConfirm={handleDeactivateMember}
      />

      {/* Monthly Salary Details Modal */}
      {selectedMemberForSalary && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {selectedMemberForSalary.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Detail Gaji Per Bulan</h3>
                  <p className="text-white/90 text-sm">
                    {selectedMemberForSalary.full_name} - {selectedMemberForSalary.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMemberForSalary(null);
                  setMonthlySalaryDetails([]);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {monthlySalaryDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xl font-semibold text-gray-400">Belum ada data gaji</p>
                  <p className="text-sm text-gray-400 mt-2">Tambahkan data gaji untuk member ini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlySalaryDetails.map((detail, index) => (
                    <div 
                      key={index}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-green-400 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-green-50/30"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {detail.month}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Dibuat: {new Date(detail.created_at).toLocaleDateString('id-ID', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          detail.status === 'Paid' 
                            ? 'bg-green-100 text-green-700' 
                            : detail.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {detail.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Gaji Pokok</p>
                          <p className="text-sm font-bold text-gray-800">
                            Rp {detail.salary.toLocaleString('id-ID')}
                          </p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Kasbon</p>
                          <p className="text-sm font-bold text-red-600">
                            Rp {detail.loan.toLocaleString('id-ID')}
                          </p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Gaji Kotor</p>
                          <p className="text-sm font-bold text-gray-800">
                            Rp {detail.gross_salary.toLocaleString('id-ID')}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-lg border-2 border-green-600">
                          <p className="text-xs text-white/90 mb-1">Gaji Bersih</p>
                          <p className="text-sm font-bold text-white">
                            Rp {detail.net_salary.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total: {monthlySalaryDetails.length} bulan
                </div>
                <button
                  onClick={() => {
                    setSelectedMemberForSalary(null);
                    setMonthlySalaryDetails([]);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;