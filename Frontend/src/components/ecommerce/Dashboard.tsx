// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router";
// import { FiClipboard, FiClock, FiCheckCircle, FiPlay, FiBox, FiAlertTriangle } from "react-icons/fi";
// import { GoIssueReopened } from "react-icons/go";
// import { LuClockAlert } from "react-icons/lu";

// interface DomainStats {
//   total: number;
//   pending: number;
//   "in-progress": number;
//   delayed: number;
//   "in-R&D": number;
//   submitted: number;
//   Reopened: number
//   Terminated: number
// }

// interface Stats {
//   total: number;
//   completed: number;
//   pending: number;
//   delayed: number;
//   inProgress: number;
//   inRD: number;
//   Reopened: number
//   Terminated: number
// }

// interface DeveloperTask {
//   name: string;
//   total: number;
//   completed: number;
//   inProgress: number;
//   inRD: number;
//   delayed: number;
//   Reopened: number;
//   Terminated: number;
// }

// const Dashboard: React.FC = () => {
//   const [domainStats, setDomainStats] = useState<Record<string, DomainStats>>({});
//   const [stats, setStats] = useState<Stats>({
//     total: 0,
//     completed: 0,
//     pending: 0,
//     delayed: 0,
//     inProgress: 0,
//     inRD: 0,
//     Reopened: 0,
//     Terminated: 0
//   });
//   const [developers, setDevelopers] = useState<DeveloperTask[]>([]);
//   //console.log("nkodvm", developers)
//   const [userRole, setUserRole] = useState<string>("");
//   const navigate = useNavigate();
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const [sortBy, setSortBy] = useState<keyof DeveloperTask | "total" | "completed" | "inProgress" | "inRD" | "delayed" | "assigned" | "Reopened" | "none">("none");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

//   const [creatorSortBy, setCreatorSortBy] = useState<
//     "name" | "total" | "pending" | "in-progress" | "in-R&D" | "submitted" | "delayed" | "Reopened" | "Terminated" | "none"
//   >("none");

//   const [creatorSortOrder, setCreatorSortOrder] = useState<"asc" | "desc">("desc");


//   const [loading, setLoading] = useState<boolean>(true);
//   const [developersLoading, setDevelopersLoading] = useState<boolean>(true);


//   const [taskCreators, setTaskCreators] = useState<any[]>([]);
//   const [taskCreatorsLoading, setTaskCreatorsLoading] = useState<boolean>(false);


//   const getCookie = (name: string): string | null => {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
//     return null;
//   };

//   const fetchStats = async (token: string) => {
//     setLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/tasks/stats`, {
//         method: "GET",
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//         credentials: "include",
//       });
//       if (!res.ok) throw new Error("Failed to fetch stats");
//       const data: Record<string, DomainStats> = await res.json();

//       setDomainStats(data);

//       // Compute totals
//       let total = 0,
//         pending = 0,
//         inProgress = 0,
//         delayed = 0,
//         inRD = 0,
//         completed = 0;
//       let Reopened = 0;
//       let Terminated = 0;

//       Object.values(data).forEach((d) => {
//         total += d.total || 0;
//         pending += d.pending || 0;
//         inProgress += d["in-progress"] || 0;
//         delayed += d.delayed || 0;
//         inRD += d["in-R&D"] || 0;
//         completed += d.submitted || 0;
//         Reopened += d.Reopened || 0;
//         Terminated += d.Terminated || 0;
//       });

//       setStats({ total, pending, inProgress, delayed, inRD, completed, Reopened, Terminated });
//     } catch (err) {
//       console.error("Stats fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };



//   const fetchDevelopers = async (token: string) => {
//     setDevelopersLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/tasks/developers`, {
//         method: "GET",
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//         credentials: "include",
//       });
//       if (!res.ok) throw new Error("Failed to fetch developers");
//       const data: DeveloperTask[] = await res.json();
//       //console.log("Data", data);
//       setDevelopers(data);

//     } catch (err) {
//       console.error("Developer fetch error:", err);
//     } finally {

//       setDevelopersLoading(false);
//     }
//   };

//   const fetchTaskCreators = async (token: string) => {
//     setTaskCreatorsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/tasks/created/by-all-users`, {
//         method: "GET",
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//         credentials: "include",
//       });

//       if (!res.ok) throw new Error("Failed to fetch task creators");

//       const data = await res.json();

//       // Only sales users
//       const salesUsers = (data?.data || []).filter((u: any) => u.role === "Sales");

//       setTaskCreators(salesUsers);

//     } catch (err) {
//       console.error("Task creators fetch error:", err);
//     } finally {
//       setTaskCreatorsLoading(false);
//     }
//   };


//   useEffect(() => {
//     const token = getCookie("TMSAuthToken");
//     if (!token) {
//       navigate("/TMS-operations/login");
//       return;
//     }

//     const init = async () => {
//       try {
//         const payload = JSON.parse(atob(token.split(".")[1]));
//         setUserRole(payload.role);
//         await fetchStats(token);
//         await fetchDevelopers(token);
//         await fetchTaskCreators(token);

//         // if (payload.role === "Manager") fetchDevelopers(token);
//       } catch (err) {
//         console.error("Invalid token", err);
//         navigate("/TMS-operations/login");
//       }
//     };

//     init();
//   }, []);


//   const cards = [
//     { label: "Total", value: stats.total, icon: <FiClipboard />, bgColor: "bg-blue-50", textColor: "text-gray-500" },
//     { label: "Completed", value: stats.completed, icon: <FiCheckCircle />, bgColor: "bg-green-50", textColor: "text-gray-500" },
//     { label: "Pending", value: stats.pending, icon: <FiClock />, bgColor: "bg-yellow-50", textColor: "text-gray-500" },
//      { label: "In-Progress", value: stats.inProgress, icon: <FiPlay />, bgColor: "bg-purple-50", textColor: "text-gray-500" },
//     { label: "Delayed", value: stats.delayed, icon: <LuClockAlert />, bgColor: "bg-red-50", textColor: "text-gray-500" },
//     { label: "In-R&D", value: stats.inRD, icon: <FiBox />, bgColor: "bg-orange-50", textColor: "text-gray-500" },
//     { label: "Reopened", value: stats.Reopened, icon: <GoIssueReopened />, bgColor: "bg-pink-50", textColor: "text-gray-500" },
//     { label: "Terminated", value: stats.Terminated, icon: <FiAlertTriangle />, bgColor: "bg-gray-50", textColor: "text-gray-500" },
//   ];

//   const sortedDevelopers = [...developers].sort((a, b) => {
//     if (sortBy === "none") return 0;
//     const aValue = (a as any)[sortBy] || 0;
//     const bValue = (b as any)[sortBy] || 0;
//     return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
//   });

//   const sortedTaskCreators = [...taskCreators].sort((a, b) => {
//     if (creatorSortBy === "none") return 0;

//     const aValue = a[creatorSortBy] || 0;
//     const bValue = b[creatorSortBy] || 0;

//     return creatorSortOrder === "asc"
//       ? aValue - bValue
//       : bValue - aValue;
//   });


//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen">


//       <div className="mb-5 text-black w-full">

//         {/* First row: 3 cards (responsive) */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
//           {cards.slice(0, 3).map((card, idx) => (
//             <div
//               key={idx}
//               className={`${card.bgColor} rounded-lg p-4 text-center shadow hover:shadow-lg transition text-black flex flex-col items-center justify-center`}
//             >
//               <div className="flex items-center justify-center gap-2 mb-2">
//                 <span className="text-2xl">{card.icon}</span>
//                 <h3 className="text-lg font-medium whitespace-nowrap">{card.label}</h3>
//               </div>
//               <p className="text-2xl font-bold">{card.value}</p>
//             </div>
//           ))}
//         </div>

//         {/* Second row: remaining cards (responsive) */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//           {cards.slice(3).map((card, idx) => (
//             <div
//               key={idx}
//               className={`${card.bgColor} rounded-lg p-4 text-center shadow hover:shadow-lg transition text-black flex flex-col items-center justify-center`}
//             >
//               <div className="flex items-center justify-center gap-2 mb-2">
//                 <span className="text-2xl">{card.icon}</span>
//                 <h3 className="text-lg font-medium whitespace-nowrap">{card.label}</h3>
//               </div>
//               <p className="text-2xl font-bold">{card.value}</p>
//             </div>
//           ))}
//         </div>

//       </div>


//       {/* Developer Table (Manager only) */}
//       {(userRole === "Admin" || userRole === "Manager" || userRole === "SuperAdmin") && (
//         <div className="overflow-x-auto bg-gray-100 rounded-lg shadow p-4">
//           <h2 className="text-xl font-semibold mb-4">TL Summary</h2>

//           {developersLoading ? (
//             <div className="flex justify-center items-center py-10">
//               <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600"></div>
//             </div>
//           ) : developers.length > 0 ? (
//             <table className="w-full border-collapse bg-white">
//               <thead className="bg-gray-300">
//                 <tr>
//                   <th className="border px-4 py-2">No.</th>
//                   <th className="border px-4 py-2">Name</th>
//                   {["total", "completed", "pending", "inRD", "delayed", 'Terminated'].map((col) => (
//                     <th
//                       key={col}
//                       className="border px-4 py-2 cursor-pointer"
//                       onClick={() => {
//                         if (sortBy === col) {
//                           setSortOrder(sortOrder === "asc" ? "desc" : "asc");
//                         } else {
//                           setSortBy(col as keyof DeveloperTask);
//                           setSortOrder("desc");
//                         }
//                       }}
//                     >
//                       {col === "total" ? "Assigned" : col === "inProgress" ? "In Progress" : col === "inRD" ? "In R&D" : col.charAt(0).toUpperCase() + col.slice(1)}
//                       {sortBy === col ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>

//               <tbody>
//                 {sortedDevelopers.map((dev, idx) => (
//                   <tr key={idx} className="hover:bg-gray-100 text-center">
//                     <td className="border px-4 py-2">{idx + 1}</td>
//                     <td className="border px-4 py-2">{dev.name}</td>
//                     <td className="border px-4 py-2">{dev.total}</td>
//                     <td className="border px-4 py-2">{dev.submitted}</td>
//                     <td className="border px-4 py-2">{dev.pending}</td>
//                     <td className="border px-4 py-2">{dev.inRD}</td>
//                     <td className="border px-4 py-2">{dev.delayed}</td>
//                     <td className="border px-4 py-2">{dev.Terminated}</td>
//                   </tr>
//                 ))}

//                 <tr className="bg-gray-200 font-bold text-center">
//                   <td className="border px-4 py-2"></td>
//                   <td className="border px-4 py-2">Total</td>
//                   <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.total, 0)}</td>
//                   <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.submitted, 0)}</td>
//                   <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.pending, 0)}</td>
//                   <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.inRD, 0)}</td>
//                   <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.delayed, 0)}</td>
//                   <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.Terminated, 0)}</td>
//                 </tr>
//               </tbody>
//             </table>
//           ) : (
//             <p className="text-center text-gray-600 py-6">No developer data found</p>
//           )}
//         </div>
//       )}

//       {/* Task Created Summary (Sales Only) */}
//       {(userRole === "Admin" || userRole === "Manager" || userRole === "SuperAdmin" || userRole === "Sales") && (
//         <div className="overflow-x-auto bg-gray-100 rounded-lg shadow p-4 mt-6">
//           <h2 className="text-xl font-semibold mb-4">Task Created Summary</h2>

//           {taskCreatorsLoading ? (
//             <div className="flex justify-center items-center py-10">
//               <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600"></div>
//             </div>
//           ) : sortedTaskCreators.length > 0 ? (
//             <table className="w-full border-collapse bg-white">
//               <thead className="bg-gray-300">
//                 <tr>
//                   <th className="border px-4 py-2">No.</th>

//                   {/* Column Headers With Sorting */}
//                   {[
//                     { key: "name", label: "User" },
//                     { key: "total", label: "Total" },
//                     { key: "pending", label: "Pending" },

//                     { key: "in-R&D", label: "In R&D" },
//                     { key: "submitted", label: "Submitted" },
//                     { key: "delayed", label: "Delayed" },
//                     { key: "Reopened", label: "Reopened" },
//                     { key: "Terminated", label: "Terminated" },
//                   ].map((col) => (
//                     <th
//                       key={col.key}
//                       className="border px-4 py-2 cursor-pointer"
//                       onClick={() => {
//                         if (creatorSortBy === col.key) {
//                           setCreatorSortOrder(creatorSortOrder === "asc" ? "desc" : "asc");
//                         } else {
//                           setCreatorSortBy(col.key as any);
//                           setCreatorSortOrder("desc");
//                         }
//                       }}
//                     >
//                       {col.label}
//                       {creatorSortBy === col.key
//                         ? creatorSortOrder === "asc"
//                           ? " ↑"
//                           : " ↓"
//                         : ""}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>

//               <tbody>
//                 {sortedTaskCreators.map((u, idx) => (
//                   <tr key={idx} className="hover:bg-gray-100 text-center">
//                     <td className="border px-4 py-2">{idx + 1}</td>
//                     <td className="border px-4 py-2">{u.name}</td>
//                     <td className="border px-4 py-2">{u.total}</td>
//                     <td className="border px-4 py-2">{u.pending}</td>

//                     <td className="border px-4 py-2">{u["in-R&D"]}</td>
//                     <td className="border px-4 py-2">{u.submitted}</td>
//                     <td className="border px-4 py-2">{u.delayed}</td>
//                     <td className="border px-4 py-2">{u.Reopened}</td>
//                     <td className="border px-4 py-2">{u.Terminated}</td>
//                   </tr>
//                 ))}

//                 {/* ⭐ Total Row */}
//                 <tr className="bg-gray-200 font-bold text-center">
//                   <td className="border px-4 py-2"></td>
//                   <td className="border px-4 py-2">Total</td>
//                   <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.total, 0)}</td>
//                   <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.pending, 0)}</td>

//                   <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u["in-R&D"], 0)}</td>
//                   <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.submitted, 0)}</td>
//                   <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.delayed, 0)}</td>
//                   <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.Reopened, 0)}</td>
//                   <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.Terminated, 0)}</td>
//                 </tr>
//               </tbody>
//             </table>
//           ) : (
//             <p className="text-center text-gray-600 py-6">No task creation data found</p>
//           )}
//         </div>
//       )}




//     </div>
//   );
// };

// export default Dashboard;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FiClipboard, FiClock, FiCheckCircle,  FiPlay, FiBox,FiAlertTriangle } from "react-icons/fi";
import { GoIssueReopened } from "react-icons/go";
import { LuClockAlert } from "react-icons/lu";

interface DomainStats {
  total: number;
  pending: number;
  "in-progress": number;
  delayed: number;
  "in-R&D": number;
  submitted: number;
  Reopened: number
  Terminated: number
}

interface Stats {
  total: number;
  completed: number;
  pending: number;
  delayed: number;
  inProgress: number;
  inRD: number;
  Reopened: number
  Terminated: number
} 

interface DeveloperTask {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  inRD: number;
  delayed: number;
  Reopened: number;
  Terminated: number;
}

const Dashboard: React.FC = () => {
  const [domainStats, setDomainStats] = useState<Record<string, DomainStats>>({});
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    delayed: 0,
    inProgress: 0,
    inRD: 0,
    Reopened: 0,
    Terminated: 0
  });
  const [developers, setDevelopers] = useState<DeveloperTask[]>([]);
  //console.log("nkodvm", developers)
  const [userRole, setUserRole] = useState<string>("");
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [sortBy, setSortBy] = useState<keyof DeveloperTask | "total" | "completed" | "inProgress" | "inRD" | "delayed" | "assigned" |  "Reopened" |"none">("none");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [creatorSortBy, setCreatorSortBy] = useState<
  "name" | "total" | "pending" | "in-progress" | "in-R&D" | "submitted" | "delayed" | "Reopened" | "Terminated" | "none"
>("none");

const [creatorSortOrder, setCreatorSortOrder] = useState<"asc" | "desc">("desc");


  const [loading, setLoading] = useState<boolean>(true);
  const [developersLoading, setDevelopersLoading] = useState<boolean>(true);


  const [taskCreators, setTaskCreators] = useState<any[]>([]);
const [taskCreatorsLoading, setTaskCreatorsLoading] = useState<boolean>(false);


  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  const fetchStats = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/tasks/stats`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data: Record<string, DomainStats> = await res.json();

      setDomainStats(data);

      // Compute totals
      let total = 0,
        pending = 0,
        inProgress = 0,
        delayed = 0,
        inRD = 0,
        completed = 0;
        let Reopened = 0;
        let Terminated = 0;

      Object.values(data).forEach((d) => {
        total += d.total || 0;
        pending += d.pending || 0;
        inProgress += d["in-progress"] || 0;
        delayed += d.delayed || 0;
        inRD += d["in-R&D"] || 0;
        completed += d.submitted || 0;
        Reopened += d.Reopened || 0;
        Terminated += d.Terminated || 0;
      });

      setStats({ total, pending, inProgress, delayed, inRD, completed ,Reopened, Terminated });
    } catch (err) {
      console.error("Stats fetch error:", err);
    }finally {
      setLoading(false);
    }
  };



  const fetchDevelopers = async (token: string) => {
    setDevelopersLoading(true);
    try {
      const res = await fetch(`${apiUrl}/tasks/developers`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch developers");
      const data: DeveloperTask[] = await res.json();
      //console.log("Data", data);
      setDevelopers(data);

    } catch (err) {
      console.error("Developer fetch error:", err);
    }finally {

      setDevelopersLoading(false);
    }
  };

  const fetchTaskCreators = async (token: string) => {
  setTaskCreatorsLoading(true);
  try {
    const res = await fetch(`${apiUrl}/tasks/created/by-all-users`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch task creators");

    const data = await res.json();

    // Only sales users
    const salesUsers = (data?.data || []).filter((u: any) => u.role === "Sales");

    setTaskCreators(salesUsers);

  } catch (err) {
    console.error("Task creators fetch error:", err);
  } finally {
    setTaskCreatorsLoading(false);
  }
};

 
  useEffect(() => {
    const token = getCookie("TMSAuthToken");
    if (!token) {
      navigate("/TMS-operations/login");
      return;
    }

    const init = async () => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
        await fetchStats(token);
        await fetchDevelopers(token);
        await fetchTaskCreators(token);

        // if (payload.role === "Manager") fetchDevelopers(token);
      } catch (err) {
        console.error("Invalid token", err);
        navigate("/TMS-operations/login");
      }
    };

    init();
  }, []);


  const cards = [
    { label: "Total", value: stats.total, icon: <FiClipboard />, bgColor: "bg-blue-50", textColor: "text-gray-500" },
    { label: "Completed", value: stats.completed, icon: <FiCheckCircle />, bgColor: "bg-green-50", textColor: "text-gray-500" },
    { label: "Pending", value: stats.pending, icon: <FiClock />, bgColor: "bg-yellow-50", textColor: "text-gray-500" },
    { label: "In-Progress", value: stats.inProgress, icon: <FiPlay />, bgColor: "bg-purple-50", textColor: "text-gray-500" },
    { label: "Delayed", value: stats.delayed, icon: <LuClockAlert />, bgColor: "bg-red-50", textColor: "text-gray-500" },
    { label: "In-R&D", value: stats.inRD, icon: <FiBox />, bgColor: "bg-orange-50", textColor: "text-gray-500" },
    { label: "Reopened", value: stats.Reopened, icon: <GoIssueReopened />, bgColor: "bg-pink-50", textColor: "text-gray-500" },
    { label: "Terminated", value: stats.Terminated, icon: <FiAlertTriangle />, bgColor: "bg-gray-50", textColor: "text-gray-500" },
  ];

  const sortedDevelopers = [...developers].sort((a, b) => {
    if (sortBy === "none") return 0;
    const aValue = (a as any)[sortBy] || 0;
    const bValue = (b as any)[sortBy] || 0;
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  const sortedTaskCreators = [...taskCreators].sort((a, b) => {
  if (creatorSortBy === "none") return 0;

  const aValue = a[creatorSortBy] || 0;
  const bValue = b[creatorSortBy] || 0;

  return creatorSortOrder === "asc"
    ? aValue - bValue
    : bValue - aValue;
});


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      

      <div className="mb-5 text-black w-full">

        {/* First row: 3 cards (responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {cards.slice(0, 3).map((card, idx) => (
            <div
              key={idx}
              className={`${card.bgColor} rounded-lg p-4 text-center shadow hover:shadow-lg transition text-black flex flex-col items-center justify-center`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="text-lg font-medium whitespace-nowrap">{card.label}</h3>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Second row: remaining cards (responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.slice(3).map((card, idx) => (
            <div
              key={idx}
              className={`${card.bgColor} rounded-lg p-4 text-center shadow hover:shadow-lg transition text-black flex flex-col items-center justify-center`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="text-lg font-medium whitespace-nowrap">{card.label}</h3>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>

      </div>


      {/* Developer Table (Manager only) */}
      {(userRole === "Admin" || userRole === "Manager" || userRole==="SuperAdmin") && (
  <div className="overflow-x-auto bg-gray-100 rounded-lg shadow p-4">
    <h2 className="text-xl font-semibold mb-4">TL Summary</h2>

    {developersLoading ? (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600"></div>
      </div>
    ) : developers.length > 0 ? (
      <table className="w-full border-collapse bg-white">
        <thead className="bg-gray-300">
          <tr>
            <th className="border px-4 py-2">No.</th>
            <th className="border px-4 py-2">Name</th>
            {["total", "completed", "inProgress", "inRD", "delayed"].map((col) => (
              <th
                key={col}
                className="border px-4 py-2 cursor-pointer"
                onClick={() => {
                  if (sortBy === col) {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy(col as keyof DeveloperTask);
                    setSortOrder("desc");
                  }
                }}
              >
                {col === "total" ? "Assigned" : col === "inProgress" ? "In Progress" : col === "inRD" ? "In R&D" : col.charAt(0).toUpperCase() + col.slice(1)}
                {sortBy === col ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedDevelopers.map((dev, idx) => (
            <tr key={idx} className="hover:bg-gray-100 text-center">
              <td className="border px-4 py-2">{idx + 1}</td>
              <td className="border px-4 py-2">{dev.name}</td>
              <td className="border px-4 py-2">{dev.total}</td>
              <td className="border px-4 py-2">{dev.completed}</td>
              <td className="border px-4 py-2">{dev.inProgress}</td>
              <td className="border px-4 py-2">{dev.inRD}</td>
              <td className="border px-4 py-2">{dev.delayed}</td>
            </tr>
          ))}

          <tr className="bg-gray-200 font-bold text-center">
            <td className="border px-4 py-2"></td>
            <td className="border px-4 py-2">Total</td>
            <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.total, 0)}</td>
            <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.completed, 0)}</td>
            <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.inProgress, 0)}</td>
            <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.inRD, 0)}</td>
            <td className="border px-4 py-2">{developers.reduce((sum, dev) => sum + dev.delayed, 0)}</td>
          </tr>
        </tbody>
      </table>
    ) : (
      <p className="text-center text-gray-600 py-6">No developer data found</p>
    )}
  </div>
)}

{/* Task Created Summary (Sales Only) */}
{(userRole === "Admin" || userRole === "Manager" || userRole === "Sales" || userRole === "SuperAdmin") && (
  <div className="overflow-x-auto bg-gray-100 rounded-lg shadow p-4 mt-6">
    <h2 className="text-xl font-semibold mb-4">Task Created Summary</h2>

    {taskCreatorsLoading ? (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600"></div>
      </div>
    ) : sortedTaskCreators.length > 0 ? (
      <table className="w-full border-collapse bg-white">
        <thead className="bg-gray-300">
          <tr>
            <th className="border px-4 py-2">No.</th>

            {/* Column Headers With Sorting */}
            {[
              { key: "name", label: "User" },
              { key: "total", label: "Total" },
              { key: "pending", label: "Pending" },
              { key: "in-progress", label: "In Progress" },
              { key: "in-R&D", label: "In R&D" },
              { key: "submitted", label: "Submitted" },
              { key: "delayed", label: "Delayed" },
              { key: "Reopened", label: "Reopened" },
              { key: "Terminated", label: "Terminated" },
            ].map((col) => (
              <th
                key={col.key}
                className="border px-4 py-2 cursor-pointer"
                onClick={() => {
                  if (creatorSortBy === col.key) {
                    setCreatorSortOrder(creatorSortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setCreatorSortBy(col.key as any);
                    setCreatorSortOrder("desc");
                  }
                }}
              >
                {col.label}
                {creatorSortBy === col.key
                  ? creatorSortOrder === "asc"
                    ? " ↑"
                    : " ↓"
                  : ""}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedTaskCreators.map((u, idx) => (
            <tr key={idx} className="hover:bg-gray-100 text-center">
              <td className="border px-4 py-2">{idx + 1}</td>
              <td className="border px-4 py-2">{u.name}</td>
              <td className="border px-4 py-2">{u.total}</td>
              <td className="border px-4 py-2">{u.pending}</td>
              <td className="border px-4 py-2">{u["in-progress"]}</td>
              <td className="border px-4 py-2">{u["in-R&D"]}</td>
              <td className="border px-4 py-2">{u.submitted}</td>
              <td className="border px-4 py-2">{u.delayed}</td>
              <td className="border px-4 py-2">{u.Reopened}</td>
              <td className="border px-4 py-2">{u.Terminated}</td>
            </tr>
          ))}

          {/* ⭐ Total Row */}
          <tr className="bg-gray-200 font-bold text-center">
            <td className="border px-4 py-2"></td>
            <td className="border px-4 py-2">Total</td>
            <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.total, 0)}</td>
            <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.pending, 0)}</td>
            <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u["in-progress"], 0)}</td>
            <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u["in-R&D"], 0)}</td>
            <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.submitted, 0)}</td>
            <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.delayed, 0)}</td>
            <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.Reopened, 0)}</td>
            <td className="border px-4 py-2">{taskCreators.reduce((s, u) => s + u.Terminated, 0)}</td>
          </tr>
        </tbody>
      </table>
    ) : (
      <p className="text-center text-gray-600 py-6">No task creation data found</p>
    )}
  </div>
)}




    </div>
  );
};

export default Dashboard;

