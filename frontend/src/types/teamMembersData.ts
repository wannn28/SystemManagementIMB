import { Member } from './BasicTypes';

export const teamMembers: Member[] = [
  {
    id: '1',
    fullName: 'John Doe',
    role: 'Project Manager',
    phoneNumber: '123-456-7890',
    address: '123 Main St',
    joinDate: '2022-01-01',
    profileImage: 'https://via.placeholder.com/100',

    documents: [],
    salaries: [
      // { month: 'January 2025', salary: 5000, loan: 500, netSalary: 4500, grossSalary: 5000 , documents:[], status: 'Pending' },
      // { month: 'February 2025', salary: 5200, loan: 300, netSalary: 4900, grossSalary: 5200 , documents:[], status: 'Paid'},
    ],
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    role: 'Developer',
    phoneNumber: '987-654-3210',
    address: '456 Elm St',
    joinDate: '2023-03-15',
    profileImage: 'https://via.placeholder.com/100',
    documents: [],
    salaries: [
      // { month: 'January 2025', salary: 4000, loan: 200, netSalary: 3800, grossSalary: 4000, documents:[],  status: 'Pending' },
    ],
  },
];