//  {selectedProject === project.id && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="p-4 border rounded-lg">
//                     <h3 className="text-lg font-semibold mb-4">Revenue vs Total Revenue ({timeRange})</h3>

//                     <LineChart width={500} height={300} data={getTimeRangeData(project)}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'} />
//                       <YAxis />
//                       <Tooltip content={({ active, payload }) => {
//                         if (active && payload && payload.length) {
//                           const data = payload[0].payload;
//                           const percentage = ((data.revenue / data.totalRevenue) * 100).toFixed(2);
//                           const remaining = data.totalRevenue - data.revenue;

//                           return (
//                             <div className="bg-white p-3 border rounded-lg shadow-sm">
//                               <p className="font-semibold">
//                                 {data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'] instanceof Date
//                                   ? data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'].toLocaleDateString()
//                                   : data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart']}
//                               </p>
//                               <p className="text-[#8884d8]">Realisasi: Rp{data.revenue?.toLocaleString()}</p>
//                               <p className="text-[#82ca9d]">Total Revenue: Rp{data.totalRevenue?.toLocaleString()}</p>
//                               <p className="mt-2">Terbayar: {percentage}%</p>
//                               <p>Sisa: Rp{remaining?.toLocaleString()}</p>
//                             </div>
//                           );
//                         }
//                         return null;
//                       }} />
//                       <Legend />
//                       <Line
//                         type="monotone"
//                         dataKey="revenue"
//                         stroke="#8884d8"
//                         name="Realisasi"
//                         strokeWidth={2}
//                         dot={{ r: 4 }}
//                       />
//                       {showTotals && (
//                         <Line
//                           type="monotone"
//                           dataKey="totalRevenue"
//                           stroke="#82ca9d"
//                           name="Total Revenue"
//                           strokeWidth={2}
//                           strokeDasharray="5 5"
//                           dot={{ r: 4 }}
//                         />
//                       )}
//                     </LineChart>
//                   </div>

//                   <div className="p-4 border rounded-lg">
//                     <h3 className="text-lg font-semibold mb-4">Progress Volume</h3>
//                     <LineChart width={500} height={300} data={getVolumeData(project)}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'} />
//                       <YAxis />
//                       <Legend />
//                       <Tooltip content={({ active, payload }) => {
//                         if (active && payload && payload.length) {
//                           const data = payload[0].payload;
//                           const targetPercentage = ((data.volume / data.targetVolume) * 100).toFixed(2);
//                           const totalPercentage = ((data.volume / data.totalVolume) * 100).toFixed(2);
//                           const remainingToTotal = data.totalVolume - data.volume;

//                           return (
//                             <div className="bg-white p-3 border rounded-lg shadow-sm">
//                               <p className="font-semibold">
//                                 {(() => {
//                                   const dateVal = data[
//                                     timeRange === 'daily'
//                                       ? 'date'
//                                       : timeRange === 'weekly'
//                                         ? 'weekStart'
//                                         : 'monthStart'
//                                   ];
//                                   return dateVal instanceof Date
//                                     ? dateVal.toLocaleDateString()
//                                     : String(dateVal); // atau dateVal?.toString() jika dateVal bisa null
//                                 })()}
//                               </p>
//                               <p className="text-[#82ca9d]">Volume: {data.volume?.toLocaleString()}</p>
//                               <p className="text-[#ff7300]">Target Volume: {data.targetVolume?.toLocaleString()}</p>
//                               <p className="text-[#8884d8]">Total Volume: {data.totalVolume?.toLocaleString()}</p>
//                               <div className="mt-2">
//                                 <p>Capai Target: {targetPercentage}%</p>
//                                 <p>Progress Total: {totalPercentage}%</p>
//                                 <p>Sisa ke Total: {remainingToTotal?.toLocaleString()}</p>
//                               </div>
//                             </div>
//                           );
//                         }
//                         return null;
//                       }} />
//                       <Line
//                         type="monotone"
//                         dataKey="volume"
//                         stroke="#82ca9d"
//                         name="Volume"
//                         strokeWidth={2}
//                         dot={{ r: 4 }}
//                       />
//                       <Line
//                         type="monotone"
//                         dataKey="targetVolume"
//                         stroke="#ff7300"
//                         name="Target Volume"
//                         connectNulls={false}
//                         strokeWidth={2}
//                         dot={{ r: 4 }}
//                       />
//                       {showTotals && (
//                         <Line
//                           type="monotone"
//                           dataKey="totalVolume"
//                           stroke="#8884d8"
//                           name="Total Volume"
//                           strokeWidth={2}
//                           strokeDasharray="5 5"
//                           dot={{ r: 4 }}
//                         />
//                       )}
//                     </LineChart>
//                   </div>

//                   <div className="col-span-full p-4 border rounded-lg">
//                     <h3 className="text-lg font-semibold mb-4">Volume Data ({timeRange})</h3>
//                     <LineChart width={500} height={300} data={getVolumeData(project)}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'} />
//                       <YAxis />
//                       <Tooltip content={({ active, payload }) => {
//                         if (active && payload && payload.length) {
//                           const data = payload[0].payload;
//                           const aktualPercentage = ((data.aktual / data.plan) * 100).toFixed(2);
//                           const volumePercentage = ((data.volume / data.targetVolume) * 100).toFixed(2);
//                           const remainingAktual = data.plan - data.aktual;
//                           const remainingVolume = data.targetVolume - data.volume;

//                           return (
//                             <div className="bg-white p-3 border rounded-lg shadow-sm">
//                               <p className="font-semibold">
//                                 {(() => {
//                                   const dateVal = data[
//                                     timeRange === 'daily'
//                                       ? 'date'
//                                       : timeRange === 'weekly'
//                                         ? 'weekStart'
//                                         : 'monthStart'
//                                   ];
//                                   return dateVal instanceof Date
//                                     ? dateVal.toLocaleDateString()
//                                     : String(dateVal);
//                                 })()}
//                               </p>
//                               <div className="grid grid-cols-2 gap-2">
//                                 <div className="text-[#82ca9d]">
//                                   <p>Volume: {data.volume?.toLocaleString()}</p>
//                                   <p>Target: {data.targetVolume?.toLocaleString()}</p>
//                                   <p>Capai: {volumePercentage}%</p>
//                                   <p>Sisa: {remainingVolume?.toLocaleString()}</p>
//                                 </div>
//                                 <div className="text-[#ffc658]">
//                                   <p>Aktual: {data.aktual?.toLocaleString()}</p>
//                                   <p>Plan: {data.plan?.toLocaleString()}</p>
//                                   <p>Capai: {aktualPercentage}%</p>
//                                   <p>Sisa: {remainingAktual?.toLocaleString()}</p>
//                                 </div>
//                               </div>
//                             </div>
//                           );
//                         }
//                         return null;
//                       }} />
//                       <Legend />
//                       <Line
//                         type="monotone"
//                         dataKey="volume"
//                         stroke="#82ca9d"
//                         name="Volume"
//                         strokeWidth={2}
//                         dot={{ r: 4 }}
//                       />
//                       <Line
//                         type="monotone"
//                         dataKey="targetVolume"
//                         stroke="#ff7300"
//                         name="Target Volume"
//                         strokeWidth={2}
//                         dot={{ r: 4 }}
//                         connectNulls={false}
//                       />
//                       <Line
//                         type="monotone"
//                         dataKey="plan"
//                         stroke="#8884d8"
//                         name="Plan"
//                         strokeWidth={2}
//                         strokeDasharray="5 5"
//                         dot={{ r: 4 }}
//                       />
//                       <Line
//                         type="monotone"
//                         dataKey="aktual"
//                         stroke="#ffc658"
//                         name="Aktual"
//                         strokeWidth={2}
//                         dot={{ r: 4 }}
//                       />
//                     </LineChart>
//                   </div>

//                   <div className="col-span-full grid grid-cols-3 gap-4">
//                     <div className="bg-yellow-50 p-4 rounded-lg">
//                       <p className="text-sm text-gray-600">Akumulasi Plan</p>
//                       <p className="text-2xl font-bold">{getTimeRangeData(project).reduce((acc, item) => acc + item.plan, 0)}</p>
//                     </div>
//                     <div className="bg-red-50 p-4 rounded-lg">
//                       <p className="text-sm text-gray-600">Akumulasi Aktual</p>
//                       <p className="text-2xl font-bold">{getTimeRangeData(project).reduce((acc, item) => acc + item.aktual, 0)}</p>
//                     </div>
//                     <div className="bg-blue-50 p-4 rounded-lg">
//                       <p className="text-sm text-gray-600">Deviasi</p>
//                       <p className="text-2xl font-bold">{getTimeRangeData(project).reduce((acc, item) => acc + (item.aktual - item.plan), 0)}</p>
//                     </div>
//                   </div>

//                   <div className="col-span-full p-4 border rounded-lg">
//                     <h3 className="text-lg font-semibold mb-4">Detail Volume</h3>
//                     <p className="text-sm text-gray-600">
//                       Target Volume:{" "}
//                       {getTimeRangeData(project).reduce(
//                         (acc, item) => acc + (item.targetVolume ?? 0), // Gunakan ?? untuk mengganti null dengan 0
//                         0
//                       )}
//                     </p>
//                     <p className="text-sm text-gray-600">
//                       Jumlah Volume:{" "}
//                       {getTimeRangeData(project).reduce(
//                         (acc, item) => acc + (item.volume ?? 0), // Gunakan ?? untuk mengganti null dengan 0
//                         0
//                       )}
//                     </p>
//                     <p className="text-sm text-gray-600">
//                       Sisa Volume:{" "}
//                       {getTimeRangeData(project).reduce(
//                         (acc, item) => acc + (item.targetVolume ?? 0), // Gunakan ?? untuk mengganti null dengan 0
//                         0
//                       ) -
//                         getTimeRangeData(project).reduce(
//                           (acc, item) => acc + (item.volume ?? 0), // Gunakan ?? untuk mengganti null dengan 0
//                           0
//                         )}
//                     </p>
//                     <p className="text-sm text-gray-600">
//                       Progress: {getProgress(project).toFixed(2)}%
//                     </p>
//                   </div>
//                 </div>
//               )}