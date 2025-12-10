import React, { useState, useEffect, useMemo } from "react";
import PageMeta from "../common/PageMeta";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { useAuth } from "../../hooks/useAuth";
import { jwtDecode } from "jwt-decode";
import { FiEye, FiEdit2, FiRotateCw } from "react-icons/fi";
import { GrCompliance } from "react-icons/gr"; // View, Edit, Submit
import { MdDeleteForever } from "react-icons/md";
import TopPopupPortal from "../TopPopupPortal";
import "react-toastify/dist/ReactToastify.css";
import { FiClipboard, FiClock, FiCheckCircle, FiPlay, FiBox } from "react-icons/fi";
import { GoIssueReopened } from "react-icons/go";
import { LuClockAlert } from "react-icons/lu";
import { MdDeleteOutline } from "react-icons/md";
import { FaThumbtack } from "react-icons/fa";
import { FaFileExcel } from "react-icons/fa";
import { MdReplay } from "react-icons/md";
import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import { Popover, Typography } from "@mui/material";
import HistoryModal from "./HistoryModal";
import { createPortal } from "react-dom";
import { toast, ToastContainer } from "react-toastify";
import GeneratePOCModal from "./GeneratePOC";
import { FaChevronDown } from "react-icons/fa6";
import { useRef } from "react";
import { RiIndeterminateCircleFill } from "react-icons/ri";

import { ArrowLeft } from "lucide-react";



interface Stats {
  total: number;
  completed: number;
  pending: number;
  delayed: number;
  inProgress: number;
  inRD: number;
  Reopened: number;
  Terminated?: number;
}

interface Domain {
  _id: string | { $oid: string };
  name: string;
  status: string;
}

interface Task {
  _id: any;
  domains?: Domain[];
  srNo: number;
  projectCode: string;
  title: string;

  assignedBy: { name: string; role: string } | null;
  assignedTo: { name: string; role: string } | null;

  assignedDate: string;
  completionDate: string;
  platform: string;
  developers?: { [domain: string]: string[] };
  status: string;
}


interface TokenPayload {
  id: string;
  email: string;
  role: string;
  name?: string;
  exp?: number;
}



interface DomainStats {
  total: number;
  pending: number;
  "in-progress": number;
  delayed: number;
  "in-R&D": number;
  submitted: number;
  Reopened: number;
  Terminated: number;
}

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState("");

  const [selectedTask, setSelectedTask] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const { role } = useAuth();
  const [domainStats, setDomainStats] = useState<Record<string, DomainStats>>(
    {}
  );
  const [currentDomain, setCurrentDomain] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [showAssignDevPopup, setShowAssignDevPopup] = useState(false);



  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    delayed: 0,
    inProgress: 0,
    inRD: 0,
    Reopened: 0,
    Terminated: 0,
  });

  const [userRole, setUserRole] = useState<string>("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const [newStatus, setNewStatus] = useState("in-R&D");
  const [statusReason, setStatusReason] = useState("");

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  //const [hoveredDevelopers, setHoveredDevelopers] = useState([]);

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredDevelopers, setHoveredDevelopers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [assignedByFilter, setAssignedByFilter] = useState("");

  const [salesList, setSalesList] = useState<any[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const [showPOCModal, setShowPOCModal] = useState(false);
  // const [showPOCForm, setShowPOCForm] = useState(false);


  const fetchSalesUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/users/all/rd`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const users = await response.json();

      // Filter only Sales
      const sales = users.filter((u: any) => u.role === "Manager" || u.role === "Sales");

      setSalesList(sales);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchSalesUsers();
  }, []); // only once

  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenStatusDropdown(false); // close dropdown
      }
    };

    if (openStatusDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openStatusDropdown]);


  const handlePopoverClose = () => {
    setAnchorEl(null);
    setHoveredDevelopers([]);
  };

  const open = Boolean(anchorEl);
  const [loading, setLoading] = useState(true);
  const [tableloading, setTableLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);


  // --- openStatusModal (update so domain includes id + status) ---
  const openStatusModal = (
    task: Task,
    domain?: { id: string; name: string; status?: string }
  ) => {
    setCurrentTask(task);
    if (domain) {
      setCurrentDomain(domain);
    } else {
      setCurrentDomain(null);
    }
    // prefer domain.status if provided, else fallback to task.status
    setNewStatus("in-R&D");
    setStatusReason("");
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setCurrentTask(null);
  };

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  const fetchStats = async (token: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/tasks-rd/stats`, {
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

      setStats({ total, pending, inProgress, delayed, inRD, completed, Reopened, Terminated });
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false)
    }
  };

  const token = getCookie("TMSAuthToken");
  if (!token) return navigate("/TMS-operations/login");

  useEffect(() => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);
      setUserId(payload.id || payload._id || payload.email);
      setUserName(payload.name || payload.fullName || payload.username || "");
      fetchStats(token);

      // if (payload.role === "Manager") fetchDevelopers(token);
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/TMS-operations/login");
    }
  }, []);

  const cards = [
    //{ label: "Total ", value: stats.total, icon: <FiClipboard />, bgColor: "bg-blue-50", textColor: "text-gray-500" },
    { label: "Completed ", value: stats.completed, icon: <FiCheckCircle />, bgColor: "bg-green-50", textColor: "text-gray-500" },
    // { label: "Pending ", value: stats.pending, icon: <FiClock />, bgColor: "bg-yellow-50", textColor: "text-gray-500" },
    // { label: "In-Progress ", value: stats.inProgress, icon: <FiPlay />, bgColor: "bg-purple-50", textColor: "text-gray-500" },
    // { label: "Delayed ", value: stats.delayed, icon: <LuClockAlert />, bgColor: "bg-red-50", textColor: "text-gray-500" },
    // { label: "In-R&D", value: stats.inRD, icon: <FiBox />, bgColor: "bg-orange-50", textColor: "text-gray-500" },
    // { label: "Reopened", value: stats.Reopened, icon: <GoIssueReopened />, bgColor: "bg-pink-50", textColor: "text-gray-500" },
    // { label: "Terminated", value: stats.Terminated || 0, icon: <MdDeleteOutline />, bgColor: "bg-gray-50", textColor: "text-gray-500" },
  ];

  if (token) {
    const decoded = jwtDecode<TokenPayload>(token);
    //console.log("Decoded user info:", decoded);
  }

  const limit = 10;

  const statuses = [
    "All",
    "Pending",
    "In-Progress",
    "Submitted",
    "Delayed",
    "In-R&D",
    "Reopened",
    "Terminated",
  ];
  const statusDisplayMap = {
    "pending": "Pending",
    "in-progress": "In-Progress",
    "submitted": "Submitted",
    "delayed": "Delayed",
    "in-R&D": "In-R&D",
    "Reopened": "Reopened",
    "Terminated": "Terminated",
  };


  const fetchTasks = async () => {
    setTableLoading(true)
    try {
      const statusParam =
        statusFilter && statusFilter !== "All" ? statusFilter : "";

      const queryParams = new URLSearchParams({
        search: searchText,
        status: selectedStatuses.join(","),
        page: page.toString(),
        assignedBy: assignedByFilter,

        limit: pageSize.toString(),
      }).toString();

      const res = await fetch(`${apiUrl}/tasks-rd?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });

      const data = await res.json();


      setTasks(data.tasks || []);


      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.log(err);

      console.error(err);
    } finally {

      setTableLoading(false)
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchText, selectedStatuses, assignedByFilter, page, pageSize]);

  const expandedRows = useMemo(() => {
    const rows: any[] = [];

    tasks.forEach((task) => {
      if (task.domainName) {
        const domainObj =
          task.domain?.find((d) => d.name === task.domainName) ||
          task.domain?.[0];
        rows.push({
          task,
          domainName: task.domainName,
          domainId: domainObj
            ? typeof domainObj._id === "object"
              ? domainObj._id.$oid
              : domainObj._id
            : "",
          domainStatus: task.domainStatus,
          developers: task.domainDevelopers || [],
        });
      } else {
        rows.push({
          task,
          domainName: null,
          domainStatus: task.domainStatus || task.status || "Pending",
          developers: [],
        });
      }
    });
    return rows;
  }, [tasks]);

  const paginatedRows = expandedRows; // backend already paginated
  const totalPagesComputed = totalPages; // from backend response

  const getStatusClass = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800"; // fallback for undefined
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      case "in-r&d":
      case "in-rd":
        return "bg-orange-100 text-orange-800";
      case "Reopened":
        return "bg-pink-100 text-pink-800";
      case "Terminated":
        return "bg-gray-200 text-gray-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  const formatDate = (dateStr: string | number | Date) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : format(d, "yyyy-MM-dd");
  };

  const formatStatus = (status?: string) => {
    if (!status) return "-";
    return status
      .split(/[-\s]/) // split by hyphen or space
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("-"); // join with hyphen
  };

  // --- Updated handleStatusUpdate (use currentDomain/currentTask internally) ---
  const handleStatusUpdate = async () => {

    if (!currentTask || !currentDomain) return;

    if (!statusReason.trim()) {
      toast.error("Reason is required before updating the status.");
      return;
    }

    const formData = new FormData();
    formData.append("taskId", currentTask._id);
    formData.append("domainName", currentTask.domainName);
    formData.append("status", newStatus);
    formData.append("reason", statusReason);

    if (file) formData.append("file", file);

    if (url) {
      // always ensure it's a string before appending
      formData.append("url", typeof url === "string" ? url : url.path || "");
    }


    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/tasks/domain-status`, {
        method: "PUT",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Update failed");

      await fetchTasks();
      closeStatusModal();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
      </div>
    );
  }

  const avatarColor = (name: string) => {
    const colors = ["#FFCA28", "#29B6F6", "#AB47BC", "#FF7043", "#66BB6A"];
    return colors[name.length % colors.length];
  };

  const renderBubbleList = (names: string[] = [], uniqueId: string) => (
    <div
      className="flex items-center justify-center gap-1 relative w-full h-full"
      onMouseEnter={(e) => {
        setHoveredTask(uniqueId);
        setHoveredDevelopers(names);

        const rect = e.currentTarget.getBoundingClientRect();
        setDropdownPos({ x: rect.left, y: rect.bottom + 8 });
      }}
      onMouseLeave={() => {
        setHoveredTask(null);
        setHoveredDevelopers([]);
      }}
    >
      {/* main two bubbles */}
      {names.slice(0, 2).map((n, i) => (
        <div
          key={i}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition"
          style={{ backgroundColor: avatarColor(n) }}
        >
          {n.split(" ").map((p) => p[0]).join("")}
        </div>
      ))}

      {/* +X indicator */}
      {names.length > 2 && (
        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center cursor-pointer">
          +{names.length - 2}
        </div>
      )}

      {/* hover tooltip */}
      {hoveredTask === uniqueId && hoveredDevelopers.length > 0 &&
        createPortal(
          <div
            className="fixed bg-white shadow-lg rounded-lg p-2 w-56 z-[9999] border animate-fade-in"
            style={{ top: dropdownPos.y, left: dropdownPos.x }}
            onMouseLeave={() => setHoveredTask(null)}
          >
            <p className="text-xs font-semibold mb-2 text-gray-700">
              All Assignees
            </p>
            {hoveredDevelopers.map((dev, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: avatarColor(dev) }}
                >
                  {dev.split(" ").map((p) => p[0]).join("")}
                </div>
                <span className="text-sm">{dev}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );

  const handleTerminateDomain = async (taskId, domainName) => {
    try {
      const response = await fetch(`${apiUrl}/tasks/domain/terminate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // ⭐ VERY IMPORTANT for cookie auth
        body: JSON.stringify({
          taskId,
          domainName,

        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to terminate");
        return;
      }

      toast.success("Domain terminated successfully");

      fetchTasks();
      fetchStats(token);

    } catch (error) {
      console.error("Terminate error", error);
      toast.error("Something went wrong");
    }
  };



  return (
    <>
      <PageMeta title="Dashboard | Task" description="Task Dashboard" />
      <button
        onClick={() => navigate(-1)}
        className="top-5 left-5 bg-gray-800 text-white px-4 py-2 mb-3 rounded flex items-center gap-2 hover:bg-gray-900 "
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/TMS-operations/" },
          { title: "Tasks", path: "/TMS-operations/tasks" },
          { title: "Feasible Tasks", path: "/TMS-operations/tasks-rd" },
        ]}
      />

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        style={{
          position: "fixed",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999
        }}
      />
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


      

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 flex-wrap">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
          <input
            type="text"
            placeholder="Search by project, code, or developer"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            autoFocus
            className="flex-grow w-full sm:w-64 md:w-80 p-2 rounded-lg border border-gray-300 bg-white text-gray-800"
          />

          {(role === "Admin" || role === "Manager" || role === "TL") && (
            <select
              value={assignedByFilter}
              onChange={(e) => {
                setAssignedByFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-48 p-2 rounded-lg border border-gray-300 bg-white text-gray-800"
            >
              <option value="" hidden>Assigned By</option>
              {salesList.map((user) => (
                <option key={user._id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* <div className="relative w-full sm:w-48" ref={dropdownRef}>
          <div
            className="border rounded-lg px-3 py-3 bg-white flex items-center justify-between cursor-pointer"
            onClick={() => setOpenStatusDropdown(!openStatusDropdown)}
          >
            <span className="text-sm text-gray-700 font-semibold">
              {selectedStatuses.length === 0
                ? "Select Status"
                : selectedStatuses.join(", ")}
            </span>

            <svg
              className={`w-4 h-4 transform transition ${openStatusDropdown ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {openStatusDropdown && (
            <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 p-2 max-h-48 overflow-y-auto">
              {["pending", "in-progress", "Reopened", "submitted", "delayed", "in-R&D", "Terminated"].map((status) => (
                <label key={status} className="flex items-center gap-2 p-1 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStatuses([...selectedStatuses, status]);
                      } else {
                        setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
                      }
                    }}
                  />
                  {statusDisplayMap[status]}
                </label>
              ))}
            </div>
          )}
        </div> */}

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <button
            onClick={() => {
              setSearchText("");
              setSelectedStatuses([]);
              setAssignedByFilter("");
              setPage(1);
              setOpenStatusDropdown(false);
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
          >
            Clear Filters
          </button>

          {/* {(role === "Admin"  || role === "Manager") && (
      <button
        onClick={() => navigate("/create")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold w-full sm:w-auto"
      >
        + Create Task
      </button>
    )}

    {(role === "Admin" || role === "Manager" ) && (
      <button
        onClick={() => setShowPOCModal(true)}
        className="bg-[#3C01AF] hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold w-full sm:w-auto"
      >
        💡 Generate POC File
      </button>
    )} */}
        </div>
      </div>
      {tableloading ? <>  <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
      </div></> : <>

        <div className=" ">
          <Box
            sx={{
              height: "100%",
              width: "100%",
              overflowX: "auto", // ✅ horizontal scroll for smaller screens
              "& .MuiDataGrid-root": {
                minWidth: "100%", // ✅ Prevent squishing columns
              },
              "@media (max-width: 768px)": {
                "& .MuiDataGrid-columnHeaders": { fontSize: "0.75rem" },
                "& .MuiDataGrid-cell": { fontSize: "0.7rem", padding: "4px" },
                "& .MuiDataGrid-footerContainer": { fontSize: "0.75rem" },
              },
            }}
          >
            <DataGrid
              disableColumnResize
              disableColumnMenu
              disableColumnSelector
              disableColumnFilter
              disableRowSelectionOnClick
              hideFooterSelectedRowCount
              rows={paginatedRows.map((row, idx) => ({
                id: `${row.task._id}-${row.domainName ?? "none"}`,
                srNo: (page - 1) * pageSize + idx + 1, // ✅ Always sequential
                projectCode: row.task.projectCode,
                platform: row.domainName || "-",
                project: row.task.title,
                assignedBy: row.task.assignedBy?.name || row.task.assignedBy || "-",
                feasible: row.task.feasible,

                assignedDate: formatDate(row.task.taskAssignedDate),
                completionDate: formatDate(row.task.completeDate),

                developers: row.developers || [],
                status: row.domainStatus,
                task: row.task,
                domainName: row.domainName,
                previousDomain: row.task.previousDomain || [],
                reopenCount: row.task.reopenCount,
              }))}
              columns={[
                // ✅ No. column
                { field: "srNo", headerName: "No.", width: 70 },

                // ✅ Project Code column
                { field: "projectCode", headerName: "Project Code", width: 100 },


                // ✅ Platform column with clickable URL
                {
                  field: "platform",
                  headerName: "Platform",
                  width: 200,
                  renderCell: (params) => {
                    const platform = params.row.platform || "-";

                    // Check if platform is a valid URL
                    const isUrl =
                      platform.startsWith("http://") ||
                      platform.startsWith("https://") ||
                      platform.includes(".");


                    // If platform is URL → make it clickable
                    if (isUrl) {
                      const finalUrl = platform.startsWith("http")
                        ? platform
                        : `https://${platform}`;

                      return (
                        <a
                          href={finalUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600  hover:text-blue-800 focus:outline-none"
                          style={{ outline: "none", boxShadow: "none" }}
                        >
                          {platform}
                        </a>

                      );
                    }

                    // Not a URL → show plain text
                    return <span>{platform}</span>;
                  },
                }
                ,
                // ✅ Project column
                { field: "project", headerName: "Project", width: 180 },

                // ✅ Assigned By column
                {
                  field: "assignedBy",
                  headerName: "Assigned By",
                  width: 130,

                },
                // ✅ Feasible column
                {
                  field: "feasible",
                  headerName: "Feasible",
                  width: 120,
                  renderCell: (params) => {
                    const val = params.row.feasible;

                    if (val === "true" || val === true)
                      return (
                        <span className="text-green-600 text-xl font-bold">
                          ✔
                        </span>
                      );

                    if (val === "false" || val === false)
                      return (
                        <span className="text-red-600 text-xl font-bold">
                          ✘
                        </span>
                      );

                    return <span>–</span>; // no submission exists
                  },
                },
                // ✅ Assigned Date column
                { field: "assignedDate", headerName: "Assigned Date", width: 130, },

                // ✅ Completion Date column
                { field: "completionDate", headerName: "Completion Date", width: 130, },

                // ✅ Developers column
                {
                  field: "developers",
                  headerName: "Developers",
                  width: 130,
                  sortable: false,
                  renderCell: (params) => {
                    const devs = params.row.developers || [];

                    return (
                      <div
                        className={`flex flex-wrap w-full ${devs.length === 1
                          ? "justify-center items-center text-center pt-4"   // center for 1 name
                          : "justify-start"                             // normal for multiple
                          }`}
                      >
                        {devs.map((dev, index) => (
                          <span
                            key={index}
                            className="px-1 py-[2px] text-xs font-medium"
                          >
                            {dev}
                          </span>
                        ))}
                      </div>
                    );
                  },
                }
                ,

                // ✅ Status column
                {
                  field: "status",
                  headerName: "Status",
                  width: 130,
                  renderCell: (params) => (
                    <span
                      // onClick={() => {
                      //   if (params.row.status === "submitted") return;
                      //   if (params.row.status === "Terminated") return;
                      //   if (["TL", "Manager", "Admin"].includes(role)) {
                      //     const domainObj =
                      //       params.row.task?.domains?.find(
                      //         (d) => d.name === params.row.domainName
                      //       ) || params.row.task?.domains?.[0];
                      //     const domainId =
                      //       typeof domainObj?._id === "object"
                      //         ? domainObj._id.$oid ?? ""
                      //         : domainObj?._id ?? "";
                      //     openStatusModal(params.row.task, {
                      //       id: domainId,
                      //       name: domainObj?.name || "Unknown",
                      //       status:
                      //         domainObj?.status ||
                      //         params.row.domainStatus ||
                      //         "Pending",
                      //     });
                      //   }
                      // }}
                      className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${getStatusClass(
                        params.row.status
                      )}`}
                      title={
                        ["TL", "Manager", "Admin"].includes(role)
                          ? "Click to change status"
                          : ""
                      }
                    >
                      {formatStatus(params.row.status)}
                    </span>
                  ),
                },
                // ✅ Actions column
                {
                  field: "actions",
                  headerName: "Actions",
                  flex: 1,
                  sortable: false,
                  renderCell: (params) => (
                    <div className="flex items-center pt-2 gap-2 flex-wrap w-full">
                      <FiEye
                        onClick={(e) => {
                          e.stopPropagation(); // prevent row click issues

                          const url = `/TMS-operations/tasks-rd/${params.row.task._id}${params.row.domainName
                            ? `?domain=${encodeURIComponent(params.row.domainName)}`
                            : ""
                            }`;

                          window.open(url, "_blank"); // 🔥 opens in new tab
                        }}
                        className="cursor-pointer text-blue-600 hover:text-blue-800"
                        title="View"
                        size={18}
                      />

                      {/* {(role === "Admin" ||
                        role === "TL" ||
                        role === "Manager") &&

                        params.row.status?.trim().toLowerCase() !== "terminated" &&
                        (
                          <FiEdit2
                            onClick={() => navigate(
                              `/edit/${params.row.task._id}?domain=${encodeURIComponent(
                                params.row.domainName
                              )}`
                            )}
                            className="cursor-pointer text-yellow-500 hover:text-yellow-600"
                            title="Edit"
                            size={18}
                          />
                        )} */}
                      {/* {(
                        ["Admin", "TL"].includes(role) ||
                        (role === "Developer" &&
                          params.row.developers?.some(
                            (dev: string) =>
                              dev?.toLowerCase()?.trim() === userName?.toLowerCase()?.trim()
                          ))
                      ) &&
                        params.row.status?.trim().toLowerCase() !== "submitted" &&
                        params.row.status?.trim().toLowerCase() !== "terminated" &&
                        (
                          <GrCompliance
                            onClick={() => {
                              const devs = params.row.developers || [];



                              if (devs.length === 0) {
                                setShowAssignDevPopup(true);   // your existing popup logic
                                return;
                              }

                              navigate(
                                `/submit/${params.row.task._id}${params.row.domainName
                                  ? `?domain=${encodeURIComponent(params.row.domainName)}`
                                  : ""
                                }`
                              );
                            }}

                            // 🔥 If no dev assigned = grey color + disabled cursor
                            className={`
    ${(params.row.developers || []).length === 0
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-green-600 hover:text-green-700 cursor-pointer"
                              }
  `}

                            title={
                              (params.row.developers || []).length === 0
                                ? "Assign a developer to enable submission"
                                : "Submit"
                            }

                            size={18}
                          />

                        )} */}
                      {/* {(role === "Admin" || role === "Manager") &&
                        <FiRotateCw
                          onClick={() => {
                            const fullUrl = params.row.domainName; // full domain URL
                            setSelectedTask({
                              task: params.row.task,
                              domainName: encodeURIComponent(fullUrl)
                            });
                            setShowHistory(true);
                          }}
                          className="cursor-pointer text-purple-600 hover:text-purple-700"
                          title="View History"
                          size={18}
                        />
                      } */}
                      {/* {(role === "Admin" || role === "Manager") &&
                        params.row.status?.trim().toLowerCase() === "submitted" &&
                        params.row.reopenCount === 0 &&
                        (
                          <MdReplay
                            onClick={() => navigate(`/tasks/${params.row.task._id}/reopen`)}
                            className="cursor-pointer text-red-600 hover:text-red-700"
                            title="Reopen Task"
                            size={18}
                          />
                        )} */}
                      {/* {(role === "Admin" || role === "Manager") &&
                        params.row.status?.trim().toLowerCase() !== "terminated" &&
                        params.row.status?.trim().toLowerCase() !== "submitted" &&
                        (
                          <MdDeleteForever
                            onClick={() => {
                              if (window.confirm("Are you sure you want to terminate this domain?"))
                              handleTerminateDomain(params.row.task._id, params.row.domainName);
                            }}
                            className="cursor-pointer text-red-600 hover:text-red-800"
                            title="Terminate Domain"
                            size={20}
                          />
                          <RiIndeterminateCircleFill
                            onClick={() => {
                              setPopupData({
                                id: params.row.task._id,
                                domain: params.row.domainName,
                              });
                              setShowPopup(true);
                            }}
                            className="cursor-pointer text-red-600 hover:text-red-800"
                            title="Terminate Domain"
                            size={20}
                          />

                        )} */}
                    </div>
                  ),
                },
              ]}
              paginationMode="server"
              rowCount={totalPages * pageSize}
              paginationModel={{
                page: page - 1,
                pageSize: pageSize,
              }}
              onPaginationModelChange={(newModel) => {
                const newPage = newModel.page + 1;
                const newPageSize = newModel.pageSize;
                if (newPage !== page) setPage(newPage);
                if (newPageSize !== pageSize) {
                  setPageSize(newPageSize);
                  setPage(1);
                }
              }}
              pageSizeOptions={[10, 20, 30]}
              sx={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",

                // ✅ HEADER STYLE (make it bold and visible)
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#1e293b", // dark header
                  color: "#000000",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  borderBottom: "2px solid #334155",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: "700",

                  letterSpacing: "0.5px",
                },

                // ✅ Body cells
                "& .MuiDataGrid-cell": {
                  color: "#374151",
                  fontSize: "0.875rem",
                  borderBottom: "1px solid #e5e7eb",
                },

                // ✅ Hover effect
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f3f4f6",
                },

                // ✅ Footer (pagination) area
                "& .MuiDataGrid-footerContainer": {
                  backgroundColor: "#f9fafb",
                  borderTop: "1px solid #d1d5db",
                },

                // ✅ Remove unwanted outlines
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                  outline: "none !important",
                },

                "& .MuiDataGrid-cell:focus-within": {
                  outline: "none !important",
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none !important",
                },
              }}
            />
          </Box>


          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            PaperProps={{
              sx: {
                p: 1.5,
                width: 220,
                borderRadius: "8px",
                boxShadow: 3,
                border: "1px solid #e5e7eb",
                backgroundColor: "#fff",
              },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "#374151", fontWeight: 600, fontSize: "0.8rem" }}
            >
              All Assignees
            </Typography>

            {hoveredDevelopers.map((dev, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 0.8,
                  borderRadius: "6px",
                  "&:hover": { backgroundColor: "#f3f4f6" },
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: avatarColor(dev) }}
                >
                  {dev
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <Typography sx={{ fontSize: "0.85rem", color: "#1f2937" }}>
                  {dev}
                </Typography>
              </Box>
            ))}
          </Popover>

        </div>
      </>}

      {statusModalOpen && currentTask && currentDomain && currentDomain.status.toLowerCase() !== 'submitted' &&
        (
          <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-6 w-96">
              <h2 className="text-lg font-semibold mb-4">Update Status</h2>

              <div className="mb-4">
                <label className="block mb-1 font-medium">New Status</label>

                {/* The status is already set to 'in-R&D' in openStatusModal */}
                <h3 className="w-full p-2 border rounded bg-gray-100 text-gray-800 font-semibold">
                  in-R&D
                </h3>

              </div>

              <div className="mb-4">
                <label className="block mb-1 font-medium">Reason</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter reason for status change"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="border rounded p-1 w-full"
                />
              </div>
              <span className="flex items-center justify-center text-gray-500">OR</span>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Upload Url</label>
                <input
                  type="text"
                  placeholder="Enter the URL"
                  onChange={(e) => setUrl(e.target.value)}
                  className="border rounded p-1 w-full"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading}
                  className={`px-4 py-2 rounded text-white font-medium transition ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {loading ? "Updating..." : "Update"}
                </button>
                <button
                  onClick={closeStatusModal}
                  className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      {showAssignDevPopup && (
        <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-80 text-center shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Cannot Submit</h2>
            <p className="mb-4">Please assign at least one developer before submitting this task.</p>
            <button
              onClick={() => setShowAssignDevPopup(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <HistoryModal
          open={showHistory}
          onClose={() => setShowHistory(false)}
          task={selectedTask?.task}
          domainName={selectedTask?.domainName}
        />
      )}

      {showPOCModal && (
        <GeneratePOCModal
          onClose={() => setShowPOCModal(false)}
          onSelect={(taskId: string) => {
            setShowPOCModal(false);
            navigate(`/TMS-operations/poc/create/${taskId}`);
          }}
        />
      )}
      {showPopup && (
        <TopPopupPortal>
          <div
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 999999,
            }}
            className="bg-white border border-gray-300 shadow-2xl rounded-lg 
               px-6 py-9 w-[400px] h-[200px] animate-slideDown "
          >
            <p className="text-gray-800 font-medium text-center text-xl">
              Are you sure you want to terminate this domain?
            </p>

            <div className="flex justify-center gap-4 mt-4">
              <button
                className="px-4 py-1 bg-[#3C01AF] text-white rounded hover:bg-purple-700"
                onClick={() => {
                  handleTerminateDomain(popupData.id, popupData.domain);
                  setShowPopup(false);
                }}
              >
                Yes
              </button>

              <button
                className="px-4 py-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowPopup(false)}
              >
                No
              </button>
            </div>
          </div>
        </TopPopupPortal>

      )}
    </>
  );
};

export default TaskPage;
