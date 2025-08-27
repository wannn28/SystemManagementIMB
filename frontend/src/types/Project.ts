import { Project } from './BasicTypes';

export const ProjectData: Project[] = [
  // {
  //   id: 1,
  //   name: 'Project Alpha',
  //   description: 'Description for Project Alpha',
  //   status: 'In Progress',
  //   startDate: '2023-10-01',
  //   endDate: '2023-12-31',
  //   maxDuration: 3,
  //   totalVolume: 150000,
  //   totalRevenue: 700000000,
  //   amountPaid: 2000000,
  //   unitPrice: 100000,
  //   unit: 'Pcs',
  //   reports: {
  //     daily: [
  //       { 
  //         id: 1,
  //         projectId: 1,
  //         date: '2023-11-01', 
  //         revenue: 500000, 
  //         paid: 200000, 
  //         volume: 100, 
  //         targetVolume: 120, 
  //         plan: 90, 
  //         aktual: 80,
  //         workers: {
  //           "Pengawas": 1,
  //           "Mandor": 2,
  //           "Supir": 3,
  //           "Operator": 2,
  //           "Pekerja": 8
  //         },
  //         equipment: {
  //           "Excavator": 1,
  //           "Dozer": 1,
  //           "Dumptruck": 3,
  //           "Loader": 0,
  //           "Bulldozer": 0
  //         },
  //         totalWorkers: 16,
  //         totalEquipment: 5,
  //         images: [
  //           {
  //             id: 1,
  //             reportDailyId: 1,
  //             imagePath: "/uploads/sample-image-1.jpg",
  //             description: "Progress penggalian area A",
  //             createdAt: 1703123456,
  //             updatedAt: 1703123456
  //           },
  //           {
  //             id: 2,
  //             reportDailyId: 1,
  //             imagePath: "/uploads/sample-image-2.jpg",
  //             description: "Kondisi alat berat di lokasi",
  //             createdAt: 1703123456,
  //             updatedAt: 1703123456
  //           }
  //         ],
  //         createdAt: 1703123456,
  //         updatedAt: 1703123456
  //       },
  //       // Helper function to create daily reports with new JSON structure
  //       ...(() => {
  //         const createDailyReport = (date: string, revenue: number, paid: number, volume: number, targetVolume: number, plan: number, aktual: number, dayIndex: number) => {
  //           const baseWorkers = {
  //             "Pengawas": 1,
  //             "Mandor": Math.floor(Math.random() * 3) + 2,
  //             "Supir": Math.floor(Math.random() * 5) + 3,
  //             "Operator": Math.floor(Math.random() * 4) + 2,
  //             "Pekerja": Math.floor(Math.random() * 10) + 8
  //           };
            
  //           const baseEquipment = {
  //             "Excavator": Math.floor(Math.random() * 3) + 1,
  //             "Dozer": Math.floor(Math.random() * 2) + 1,
  //             "Dumptruck": Math.floor(Math.random() * 5) + 3,
  //             "Loader": Math.floor(Math.random() * 2),
  //             "Bulldozer": Math.floor(Math.random() * 2)
  //           };
            
  //           const totalWorkers = Object.values(baseWorkers).reduce((sum, count) => sum + count, 0);
  //           const totalEquipment = Object.values(baseEquipment).reduce((sum, count) => sum + count, 0);
            
  //           return {
  //             id: dayIndex + 2, // Start from 2 since we have one manual entry
  //             projectId: 1,
  //             date,
  //             revenue,
  //             paid,
  //             volume,
  //             targetVolume,
  //             plan,
  //             aktual,
  //             workers: baseWorkers,
  //             equipment: baseEquipment,
  //             totalWorkers,
  //             totalEquipment,
  //             images: [],
  //             createdAt: 1703123456 + dayIndex * 86400, // Add one day per entry
  //             updatedAt: 1703123456 + dayIndex * 86400
  //           };
  //         };

  //         const reports = [
  //           createDailyReport('2023-11-02', 750000, 300000, 150, 160, 140, 130, 1),
  //           createDailyReport('2023-11-03', 1000000, 400000, 200, 220, 190, 160, 2),
  //           createDailyReport('2023-11-04', 1250000, 500000, 250, 280, 240, 190, 3),
  //           createDailyReport('2023-11-05', 1500000, 600000, 300, 340, 290, 220, 4),
  //           createDailyReport('2023-11-06', 1750000, 700000, 350, 400, 340, 250, 5),
  //           createDailyReport('2023-11-07', 2000000, 800000, 400, 460, 390, 280, 6),
  //           createDailyReport('2023-11-08', 2250000, 900000, 450, 520, 440, 310, 7),
  //           createDailyReport('2023-11-09', 2500000, 1000000, 500, 580, 490, 340, 8),
  //           createDailyReport('2023-11-10', 2750000, 1100000, 550, 640, 540, 370, 9),
  //           createDailyReport('2023-11-11', 3000000, 1200000, 600, 700, 590, 400, 10),
  //           createDailyReport('2023-11-12', 3250000, 1300000, 650, 760, 640, 430, 11),
  //           createDailyReport('2023-11-13', 3500000, 1400000, 700, 820, 690, 460, 12),
  //           createDailyReport('2023-11-14', 3750000, 1500000, 750, 880, 740, 490, 13),
  //           createDailyReport('2023-11-15', 4000000, 1600000, 800, 940, 790, 520, 14),
  //           createDailyReport('2023-11-16', 4250000, 1700000, 850, 1000, 840, 550, 15),
  //           createDailyReport('2023-11-17', 4500000, 1800000, 900, 1060, 890, 580, 16),
  //           createDailyReport('2023-11-18', 4750000, 1900000, 950, 1120, 940, 610, 17),
  //           createDailyReport('2023-11-19', 5000000, 2000000, 1000, 1180, 990, 640, 18),
  //           createDailyReport('2023-11-20', 5250000, 2100000, 1050, 1240, 1040, 670, 19),
  //           createDailyReport('2023-11-21', 5500000, 2200000, 1100, 1300, 1090, 700, 20),
  //           createDailyReport('2023-11-22', 5750000, 2300000, 1150, 1360, 1140, 730, 21),
  //           createDailyReport('2023-11-23', 6000000, 2400000, 1200, 1420, 1190, 760, 22),
  //           createDailyReport('2023-11-24', 6250000, 2500000, 1250, 1480, 1240, 790, 23),
  //           createDailyReport('2023-11-25', 6500000, 2600000, 1300, 1540, 1290, 820, 24),
  //           createDailyReport('2023-11-26', 6750000, 2700000, 1350, 1600, 1340, 850, 25),
  //           createDailyReport('2023-11-27', 7000000, 2800000, 1400, 1660, 1390, 880, 26),
  //           createDailyReport('2023-11-28', 7250000, 2900000, 1450, 1720, 1440, 910, 27),
  //           createDailyReport('2023-11-29', 7500000, 3000000, 1500, 1780, 1490, 940, 28),
  //           createDailyReport('2023-11-30', 7750000, 3100000, 1550, 1840, 1540, 970, 29),
  //         ];

  //         return reports;
  //       })(),
  //       // Helper function to create remaining daily reports with new JSON structure
  //       ...(() => {
  //         const createRemainingDailyReport = (date: string, revenue: number, paid: number, volume: number, targetVolume: number, plan: number, aktual: number, dayIndex: number) => {
  //           const baseWorkers = {
  //             "Pengawas": 1,
  //             "Mandor": Math.floor(Math.random() * 3) + 2,
  //             "Supir": Math.floor(Math.random() * 10) + 15,
  //             "Operator": Math.floor(Math.random() * 8) + 12,
  //             "Pekerja": Math.floor(Math.random() * 15) + 20
  //           };
            
  //           const baseEquipment = {
  //             "Excavator": Math.floor(Math.random() * 5) + 8,
  //             "Dozer": Math.floor(Math.random() * 4) + 6,
  //             "Dumptruck": Math.floor(Math.random() * 8) + 15,
  //             "Loader": Math.floor(Math.random() * 3),
  //             "Bulldozer": Math.floor(Math.random() * 2)
  //           };
            
  //           const totalWorkers = Object.values(baseWorkers).reduce((sum, count) => sum + count, 0);
  //           const totalEquipment = Object.values(baseEquipment).reduce((sum, count) => sum + count, 0);
            
  //           return {
  //             id: dayIndex + 32, // Start from 32 since we have 31 entries from previous helper
  //             projectId: 1,
  //             date,
  //             revenue,
  //             paid,
  //             volume,
  //             targetVolume,
  //             plan,
  //             aktual,
  //             workers: baseWorkers,
  //             equipment: baseEquipment,
  //             totalWorkers,
  //             totalEquipment,
  //             images: [],
  //             createdAt: 1703123456 + dayIndex * 86400,
  //             updatedAt: 1703123456 + dayIndex * 86400
  //           };
  //         };

  //         const reports = [
  //           createRemainingDailyReport('2023-12-01', 8000000, 3200000, 1600, 1900, 1590, 1000, 0),
  //           createRemainingDailyReport('2023-12-02', 8250000, 3300000, 1650, 1960, 1640, 1030, 1),
  //           createRemainingDailyReport('2023-12-03', 8500000, 3400000, 1700, 2020, 1690, 1060, 2),
  //           createRemainingDailyReport('2023-12-04', 8750000, 3500000, 1750, 2080, 1740, 1090, 3),
  //           createRemainingDailyReport('2023-12-05', 9000000, 3600000, 1800, 2140, 1790, 1120, 4),
  //           createRemainingDailyReport('2023-12-06', 9250000, 3700000, 1850, 2200, 1840, 1150, 5),
  //           createRemainingDailyReport('2023-12-07', 9500000, 3800000, 1900, 2260, 1890, 1180, 6),
  //           createRemainingDailyReport('2023-12-08', 9750000, 3900000, 1950, 2320, 1940, 1210, 7),
  //           createRemainingDailyReport('2023-12-09', 10000000, 4000000, 2000, 2380, 1990, 1240, 8),
  //           createRemainingDailyReport('2023-12-10', 10250000, 4100000, 2050, 2440, 2040, 1270, 9),
  //           createRemainingDailyReport('2023-12-11', 10500000, 4200000, 2100, 2500, 2090, 1300, 10),
  //           createRemainingDailyReport('2023-12-12', 10750000, 4300000, 2150, 2560, 2140, 1330, 11),
  //           createRemainingDailyReport('2023-12-13', 11000000, 4400000, 2200, 2620, 2190, 1360, 12),
  //           createRemainingDailyReport('2023-12-14', 11250000, 4500000, 2250, 2680, 2240, 1390, 13),
  //           createRemainingDailyReport('2023-12-15', 11500000, 4600000, 2300, 2740, 2290, 1420, 14),
  //           createRemainingDailyReport('2023-12-16', 11750000, 4700000, 2350, 2800, 2340, 1450, 15),
  //           createRemainingDailyReport('2023-12-17', 12000000, 4800000, 2400, 2860, 2390, 1480, 16),
  //           createRemainingDailyReport('2023-12-18', 12250000, 4900000, 2450, 2920, 2440, 1510, 17),
  //           createRemainingDailyReport('2023-12-19', 12500000, 5000000, 2500, 2980, 2490, 1540, 18),
  //           createRemainingDailyReport('2023-12-20', 12750000, 5100000, 2550, 3040, 2540, 1570, 19),
  //           createRemainingDailyReport('2023-12-21', 13000000, 5200000, 2600, 3100, 2590, 1600, 20),
  //           createRemainingDailyReport('2023-12-22', 13250000, 5300000, 2650, 3160, 2640, 1630, 21),
  //           createRemainingDailyReport('2023-12-23', 13500000, 5400000, 2700, 3220, 2690, 1660, 22),
  //           createRemainingDailyReport('2023-12-24', 13750000, 5500000, 2750, 3280, 2740, 1690, 23),
  //           createRemainingDailyReport('2023-12-25', 14000000, 5600000, 2800, 3340, 2790, 1720, 24),
  //           createRemainingDailyReport('2023-12-26', 14250000, 5700000, 2850, 3400, 2840, 1750, 25),
  //           createRemainingDailyReport('2023-12-27', 14500000, 5800000, 2900, 3460, 2890, 1780, 26),
  //           createRemainingDailyReport('2023-12-28', 14750000, 5900000, 2950, 3520, 2940, 1810, 27),
  //           createRemainingDailyReport('2023-12-29', 15000000, 6000000, 3000, 3580, 2990, 1840, 28),
  //           createRemainingDailyReport('2023-12-30', 15250000, 6100000, 3050, 3640, 3040, 1870, 29),
  //           createRemainingDailyReport('2023-12-31', 15500000, 6200000, 3100, 3700, 3090, 1900, 30),
  //           createRemainingDailyReport('2024-01-01', 15750000, 6300000, 3150, 3760, 3140, 1930, 31),
  //           createRemainingDailyReport('2024-01-02', 16000000, 6400000, 3200, 3820, 3190, 1960, 32),
  //           createRemainingDailyReport('2024-01-03', 16250000, 6500000, 3250, 3880, 3240, 1990, 33),
  //           createRemainingDailyReport('2024-01-04', 16500000, 6600000, 3300, 3940, 3290, 2020, 34),
  //           createRemainingDailyReport('2024-01-05', 16750000, 6700000, 3350, 4000, 3340, 2050, 35),
  //           createRemainingDailyReport('2024-01-06', 17000000, 6800000, 3400, 4060, 3390, 2080, 36),
  //           createRemainingDailyReport('2024-01-07', 17250000, 6900000, 3450, 4120, 3440, 2110, 37),
  //           createRemainingDailyReport('2024-01-08', 17500000, 7000000, 3500, 4180, 3490, 2140, 38),
  //           createRemainingDailyReport('2024-01-09', 17750000, 7100000, 3550, 4240, 3540, 2170, 39),
  //           createRemainingDailyReport('2024-01-10', 18000000, 7200000, 3600, 4300, 3590, 2200, 40),
  //           createRemainingDailyReport('2024-01-11', 18250000, 7300000, 3650, 4360, 3640, 2230, 41),
  //           createRemainingDailyReport('2024-01-12', 18500000, 7400000, 3700, 4420, 3690, 2260, 42),
  //           createRemainingDailyReport('2024-01-13', 18750000, 7500000, 3750, 4480, 3740, 2290, 43),
  //           createRemainingDailyReport('2024-01-14', 19000000, 7600000, 3800, 4540, 3790, 2320, 44),
  //           createRemainingDailyReport('2024-01-15', 19250000, 7700000, 3850, 4600, 3840, 2350, 45),
  //           createRemainingDailyReport('2024-01-16', 19500000, 7800000, 3900, 4660, 3890, 2380, 46),
  //           createRemainingDailyReport('2024-01-17', 19750000, 7900000, 3950, 4720, 3940, 2410, 47),
  //           createRemainingDailyReport('2024-01-18', 20000000, 8000000, 4000, 4780, 3990, 2440, 48),
  //           createRemainingDailyReport('2024-01-19', 20250000, 8100000, 4050, 4840, 4040, 2470, 49),
  //           createRemainingDailyReport('2024-01-20', 20500000, 8200000, 4100, 4900, 4090, 2500, 50),
  //           createRemainingDailyReport('2024-01-21', 20750000, 8300000, 4150, 4960, 4140, 2530, 51),
  //           createRemainingDailyReport('2024-01-22', 21000000, 8400000, 4200, 5020, 4190, 2560, 52),
  //           createRemainingDailyReport('2024-01-23', 21250000, 8500000, 4250, 5080, 4240, 2590, 53),
  //           createRemainingDailyReport('2024-01-24', 21500000, 8600000, 4300, 5140, 4290, 2620, 54),
  //           createRemainingDailyReport('2024-01-25', 21750000, 8700000, 4350, 5200, 4340, 2650, 55),
  //           createRemainingDailyReport('2024-01-26', 22000000, 8800000, 4400, 5260, 4390, 2680, 56),
  //           createRemainingDailyReport('2024-01-27', 22250000, 8900000, 4450, 5320, 4440, 2710, 57),
  //           createRemainingDailyReport('2024-01-28', 22500000, 9000000, 4500, 5380, 4490, 2740, 58),
  //           createRemainingDailyReport('2024-01-29', 22750000, 9100000, 4550, 5440, 4540, 2770, 59),
  //           createRemainingDailyReport('2024-01-30', 23000000, 9200000, 4600, 5500, 4590, 2800, 60),
  //           createRemainingDailyReport('2024-01-31', 23250000, 9300000, 4650, 5560, 4640, 2830, 61),
  //         ];

  //         return reports;
  //       })(),

  //       { 
  //         date: '2023-12-07', 
  //         revenue: 9500000, 
  //         paid: 3800000, 
  //         volume: 1900, 
  //         targetVolume: 2260, 
  //         plan: 1890, 
  //         aktual: 1180,
  //         pengawas: 1,
  //         supir: 22,
  //         operator: 20,
  //         totalWorkers: 43,
  //         excavator: 10,
  //         dozer: 10,
  //         dumptruck: 22,
  //         totalEquipment: 42,
  //         images: [],
  //         imageDescriptions: []
  //       },
  //       { 
  //         date: '2023-12-08', 
  //         revenue: 9750000, 
  //         paid: 3900000, 
  //         volume: 1950, 
  //         targetVolume: 2320, 
  //         plan: 1940, 
  //         aktual: 1210,
  //         pengawas: 1,
  //         supir: 22,
  //         operator: 20,
  //         totalWorkers: 43,
  //         excavator: 10,
  //         dozer: 10,
  //         dumptruck: 22,
  //         totalEquipment: 42,
  //         images: [],
  //         imageDescriptions: []
  //       },
  //       { 
  //         date: '2023-12-09', 
  //         revenue: 10000000, 
  //         paid: 4000000, 
  //         volume: 2000, 
  //         targetVolume: 2380, 
  //         plan: 1990, 
  //         aktual: 1240,
  //         pengawas: 1,
  //         supir: 23,
  //         operator: 21,
  //         totalWorkers: 45,
  //         excavator: 11,
  //         dozer: 10,
  //         dumptruck: 23,
  //         totalEquipment: 44,
  //         images: [],
  //         imageDescriptions: []
  //       },
  //       { 
  //         date: '2023-12-10', 
  //         revenue: 10250000, 
  //         paid: 4100000, 
  //         volume: 2050, 
  //         targetVolume: 2440, 
  //         plan: 2040, 
  //         aktual: 1270,
  //         pengawas: 1,
  //         supir: 23,
  //         operator: 21,
  //         totalWorkers: 45,
  //         excavator: 11,
  //         dozer: 10,
  //         dumptruck: 23,
  //         totalEquipment: 44,
  //         images: [],
  //         imageDescriptions: []
  //       },
  //       // Helper function to create daily report with new fields
  //       ...(() => {
  //         const createDailyReport = (date: string, revenue: number, paid: number, volume: number, targetVolume: number, plan: number, aktual: number) => ({
  //           date,
  //           revenue,
  //           paid,
  //           volume,
  //           targetVolume,
  //           plan,
  //           aktual,
  //           pengawas: 1,
  //           supir: Math.floor(Math.random() * 10) + 15,
  //           operator: Math.floor(Math.random() * 8) + 12,
  //           totalWorkers: 0, // Will be calculated
  //           excavator: Math.floor(Math.random() * 5) + 8,
  //           dozer: Math.floor(Math.random() * 4) + 6,
  //           dumptruck: Math.floor(Math.random() * 8) + 15,
  //           totalEquipment: 0, // Will be calculated
  //           images: [],
  //           imageDescriptions: []
  //         });

  //         const reports = [
  //           createDailyReport('2023-12-11', 10500000, 4200000, 2100, 2500, 2090, 1300),
  //           createDailyReport('2023-12-12', 10750000, 4300000, 2150, 2560, 2140, 1330),
  //           createDailyReport('2023-12-13', 11000000, 4400000, 2200, 2620, 2190, 1360),
  //           createDailyReport('2023-12-14', 11250000, 4500000, 2250, 2680, 2240, 1390),
  //           createDailyReport('2023-12-15', 11500000, 4600000, 2300, 2740, 2290, 1420),
  //           createDailyReport('2023-12-16', 11750000, 4700000, 2350, 2800, 2340, 1450),
  //           createDailyReport('2023-12-17', 12000000, 4800000, 2400, 2860, 2390, 1480),
  //           createDailyReport('2023-12-18', 12250000, 4900000, 2450, 2920, 2440, 1510),
  //           createDailyReport('2023-12-19', 12500000, 5000000, 2500, 2980, 2490, 1540),
  //           createDailyReport('2023-12-20', 12750000, 5100000, 2550, 3040, 2540, 1570),
  //           createDailyReport('2023-12-21', 13000000, 5200000, 2600, 3100, 2590, 1600),
  //           createDailyReport('2023-12-22', 13250000, 5300000, 2650, 3160, 2640, 1630),
  //           createDailyReport('2023-12-23', 13500000, 5400000, 2700, 3220, 2690, 1660),
  //           createDailyReport('2023-12-24', 13750000, 5500000, 2750, 3280, 2740, 1690),
  //           createDailyReport('2023-12-25', 14000000, 5600000, 2800, 3340, 2790, 1720),
  //           createDailyReport('2023-12-26', 14250000, 5700000, 2850, 3400, 2840, 1750),
  //           createDailyReport('2023-12-27', 14500000, 5800000, 2900, 3460, 2890, 1780),
  //           createDailyReport('2023-12-28', 14750000, 5900000, 2950, 3520, 2940, 1810),
  //           createDailyReport('2023-12-29', 15000000, 6000000, 3000, 3580, 2990, 1840),
  //           createDailyReport('2023-12-30', 15250000, 6100000, 3050, 3640, 3040, 1870),
  //           createDailyReport('2023-12-31', 15500000, 6200000, 3100, 3700, 3090, 1900),
  //           createDailyReport('2024-01-01', 15750000, 6300000, 3150, 3760, 3140, 1930),
  //           createDailyReport('2024-01-02', 16000000, 6400000, 3200, 3820, 3190, 1960),
  //           createDailyReport('2024-01-03', 16250000, 6500000, 3250, 3880, 3240, 1990),
  //           createDailyReport('2024-01-04', 16500000, 6600000, 3300, 3940, 3290, 2020),
  //           createDailyReport('2024-01-05', 16750000, 6700000, 3350, 4000, 3340, 2050),
  //           createDailyReport('2024-01-06', 17000000, 6800000, 3400, 4060, 3390, 2050),
  //           createDailyReport('2024-01-07', 17250000, 6900000, 3450, 4120, 3440, 2080),
  //           createDailyReport('2024-01-08', 17500000, 7000000, 3500, 4180, 3490, 2110),
  //           createDailyReport('2024-01-09', 17750000, 7100000, 3550, 4240, 3540, 2140),
  //           createDailyReport('2024-01-10', 18000000, 7200000, 3600, 4300, 3590, 2170),
  //           createDailyReport('2024-01-11', 18250000, 7300000, 3650, 4360, 3640, 2200),
  //           createDailyReport('2024-01-12', 18500000, 7400000, 3700, 4420, 3690, 2230),
  //           createDailyReport('2024-01-13', 18750000, 7500000, 3750, 4480, 3740, 2260),
  //           createDailyReport('2024-01-14', 19000000, 7600000, 3800, 4540, 3790, 2290),
  //           createDailyReport('2024-01-15', 19250000, 7700000, 3850, 4600, 3840, 2320),
  //           createDailyReport('2024-01-16', 19500000, 7800000, 3900, 4660, 3890, 2350),
  //           createDailyReport('2024-01-17', 19750000, 7900000, 3950, 4720, 3940, 2380),
  //           createDailyReport('2024-01-18', 20000000, 8000000, 4000, 4780, 3990, 2410),
  //           createDailyReport('2024-01-19', 20250000, 8100000, 4050, 4840, 4040, 2440),
  //           createDailyReport('2024-01-20', 20500000, 8200000, 4100, 4900, 4090, 2470),
  //           createDailyReport('2024-01-21', 20750000, 8300000, 4150, 4960, 4140, 2500),
  //           createDailyReport('2024-01-22', 21000000, 8400000, 4200, 5020, 4190, 2530),
  //           createDailyReport('2024-01-23', 21250000, 8500000, 4250, 5080, 4240, 2560),
  //           createDailyReport('2024-01-24', 21500000, 8600000, 4300, 5140, 4290, 2590),
  //           createDailyReport('2024-01-25', 21750000, 8700000, 4350, 5200, 4340, 2620),
  //           createDailyReport('2024-01-26', 22000000, 8800000, 4400, 5260, 4390, 2650),
  //           createDailyReport('2024-01-27', 22250000, 8900000, 4450, 5320, 4440, 2680),
  //           createDailyReport('2024-01-28', 22500000, 9000000, 4500, 5380, 4490, 2710),
  //           createDailyReport('2024-01-29', 22750000, 9100000, 4550, 5440, 4540, 2740),
  //           createDailyReport('2024-01-30', 23000000, 9200000, 4600, 5500, 4590, 2770),
  //           createDailyReport('2024-01-31', 23250000, 9300000, 4650, 5560, 4640, 2800),
  //         ];

  //         // Calculate totals for each report
  //         return reports.map(report => ({
  //           ...report,
  //           totalWorkers: report.pengawas + report.supir + report.operator,
  //           totalEquipment: report.excavator + report.dozer + report.dumptruck
  //         }));
  //       })(),
  //     ],
  //     weekly: [
  //       { 
  //         targetPlan: 1000, 
  //         targetAktual: 950, 
  //         week: 'Week 1', 
  //         volume: 800, 
  //         targetVolume: 1000,
  //         totalWorkers: 45,
  //         avgWorkers: 9.0,
  //         totalEquipment: 38,
  //         avgEquipment: 7.6,
  //         workers: {
  //           "Pengawas": 7,
  //           "Mandor": 14,
  //           "Supir": 35,
  //           "Operator": 28,
  //           "Pekerja": 70
  //         },
  //         avgWorkersByType: {
  //           "Pengawas": 1.4,
  //           "Mandor": 2.8,
  //           "Supir": 7.0,
  //           "Operator": 5.6,
  //           "Pekerja": 14.0
  //         },
  //         equipment: {
  //           "Excavator": 18,
  //           "Dozer": 14,
  //           "Dumptruck": 35,
  //           "Loader": 7,
  //           "Bulldozer": 4
  //         },
  //         avgEquipmentByType: {
  //           "Excavator": 3.6,
  //           "Dozer": 2.8,
  //           "Dumptruck": 7.0,
  //           "Loader": 1.4,
  //           "Bulldozer": 0.8
  //         }
  //       },
  //       { 
  //         targetPlan: 1100, 
  //         targetAktual: 1050, 
  //         week: 'Week 2', 
  //         volume: 900, 
  //         targetVolume: 1100,
  //         totalWorkers: 50,
  //         avgWorkers: 10.0,
  //         totalEquipment: 42,
  //         avgEquipment: 8.4,
  //         workers: {
  //           "Pengawas": 7,
  //           "Mandor": 16,
  //           "Supir": 38,
  //           "Operator": 30,
  //           "Pekerja": 75
  //         },
  //         avgWorkersByType: {
  //           "Pengawas": 1.4,
  //           "Mandor": 3.2,
  //           "Supir": 7.6,
  //           "Operator": 6.0,
  //           "Pekerja": 15.0
  //         },
  //         equipment: {
  //           "Excavator": 20,
  //           "Dozer": 16,
  //           "Dumptruck": 38,
  //           "Loader": 8,
  //           "Bulldozer": 4
  //         },
  //         avgEquipmentByType: {
  //           "Excavator": 4.0,
  //           "Dozer": 3.2,
  //           "Dumptruck": 7.6,
  //           "Loader": 1.6,
  //           "Bulldozer": 0.8
  //         }
  //       },
  //       { 
  //         targetPlan: 1200, 
  //         targetAktual: 1150, 
  //         week: 'Week 3', 
  //         volume: 1000, 
  //         targetVolume: 1200,
  //         totalWorkers: 55,
  //         avgWorkers: 11.0,
  //         totalEquipment: 46,
  //         avgEquipment: 9.2,
  //         workers: {
  //           "Pengawas": 7,
  //           "Mandor": 18,
  //           "Supir": 40,
  //           "Operator": 32,
  //           "Pekerja": 80
  //         },
  //         avgWorkersByType: {
  //           "Pengawas": 1.4,
  //           "Mandor": 3.6,
  //           "Supir": 8.0,
  //           "Operator": 6.4,
  //           "Pekerja": 16.0
  //         },
  //         equipment: {
  //           "Excavator": 22,
  //           "Dozer": 18,
  //           "Dumptruck": 40,
  //           "Loader": 9,
  //           "Bulldozer": 5
  //         },
  //         avgEquipmentByType: {
  //           "Excavator": 4.4,
  //           "Dozer": 3.6,
  //           "Dumptruck": 8.0,
  //           "Loader": 1.8,
  //           "Bulldozer": 1.0
  //         }
  //       }
  //     ],
  //     monthly: [
  //       { 
  //         targetPlan: 4000, 
  //         targetAktual: 3800, 
  //         month: 'January 2024', 
  //         volume: 3500, 
  //         targetVolume: 4000,
  //         totalWorkers: 210,
  //         avgWorkers: 6.8,
  //         totalEquipment: 175,
  //         avgEquipment: 5.6,
  //         workers: {
  //           "Pengawas": 31,
  //           "Mandor": 62,
  //           "Supir": 155,
  //           "Operator": 124,
  //           "Pekerja": 310
  //         },
  //         avgWorkersByType: {
  //           "Pengawas": 1.0,
  //           "Mandor": 2.0,
  //           "Supir": 5.0,
  //           "Operator": 4.0,
  //           "Pekerja": 10.0
  //         },
  //         equipment: {
  //           "Excavator": 84,
  //           "Dozer": 68,
  //           "Dumptruck": 155,
  //           "Loader": 34,
  //           "Bulldozer": 18
  //         },
  //         avgEquipmentByType: {
  //           "Excavator": 2.7,
  //           "Dozer": 2.2,
  //           "Dumptruck": 5.0,
  //           "Loader": 1.1,
  //           "Bulldozer": 0.6
  //         }
  //       },
  //       { 
  //         targetPlan: 4200, 
  //         targetAktual: 4000, 
  //         month: 'February 2024', 
  //         volume: 3700, 
  //         targetVolume: 4200,
  //         totalWorkers: 225,
  //         avgWorkers: 8.0,
  //         totalEquipment: 188,
  //         avgEquipment: 6.7,
  //         workers: {
  //           "Pengawas": 28,
  //           "Mandor": 67,
  //           "Supir": 168,
  //           "Operator": 134,
  //           "Pekerja": 336
  //         },
  //         avgWorkersByType: {
  //           "Pengawas": 1.0,
  //           "Mandor": 2.4,
  //           "Supir": 6.0,
  //           "Operator": 4.8,
  //           "Pekerja": 12.0
  //         },
  //         equipment: {
  //           "Excavator": 90,
  //           "Dozer": 75,
  //           "Dumptruck": 168,
  //           "Loader": 37,
  //           "Bulldozer": 20
  //         },
  //         avgEquipmentByType: {
  //           "Excavator": 3.2,
  //           "Dozer": 2.7,
  //           "Dumptruck": 6.0,
  //           "Loader": 1.3,
  //           "Bulldozer": 0.7
  //         }
  //       },
  //       { 
  //         targetPlan: 4400, 
  //         targetAktual: 4200, 
  //         month: 'March 2024', 
  //         volume: 3900, 
  //         targetVolume: 4400,
  //         totalWorkers: 240,
  //         avgWorkers: 7.7,
  //         totalEquipment: 200,
  //         avgEquipment: 6.5,
  //         workers: {
  //           "Pengawas": 30,
  //           "Mandor": 72,
  //           "Supir": 180,
  //           "Operator": 144,
  //           "Pekerja": 360
  //         },
  //         avgWorkersByType: {
  //           "Pengawas": 1.0,
  //           "Mandor": 2.4,
  //           "Supir": 6.0,
  //           "Operator": 4.8,
  //           "Pekerja": 12.0
  //         },
  //         equipment: {
  //           "Excavator": 96,
  //           "Dozer": 80,
  //           "Dumptruck": 180,
  //           "Loader": 40,
  //           "Bulldozer": 22
  //         },
  //         avgEquipmentByType: {
  //           "Excavator": 3.2,
  //           "Dozer": 2.7,
  //           "Dumptruck": 6.0,
  //           "Loader": 1.3,
  //           "Bulldozer": 0.7
  //         }
  //       }
  //     ],
  //   }
  // },
];

