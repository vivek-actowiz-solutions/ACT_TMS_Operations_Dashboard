import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-toastify";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { useNavigate } from "react-router";

const AssignTasksPage = () => {
  const { token } = useAuth();

  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignTaskId, setAssignTaskId] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch tasks
  const fetchTasks = async () => {
    const res = await fetch(`${apiUrl}/tasks/getAllTasks`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const data = await res.json();
    setTasks(data);
  };

  // Fetch users
  const fetchUsers = async () => {
    const res = await fetch(`${apiUrl}/users/all`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const data = await res.json();
    const activeUsers = data.filter((u: any) => u.role === "Manager" && u.isActive);
    setUsers(activeUsers);
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();

  }, []);

  const handleAssign = async () => {
  if (!selectedUser) {
    toast.error("Please select a user");
    return;
  }

  const res = await fetch(`${apiUrl}/tasks/assign/${assignTaskId}`, {
    method: "POST", // ✔ FIXED — must match backend
    credentials: "include", // ✔ FIXED
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ assignedTo: selectedUser }),
  });

  const data = await res.json();
  if (!res.ok) return toast.error(data.message);

  toast.success("Task Assigned!");
  setOpenModal(false);
  fetchTasks();
  navigate("/TMS-operations/tasks");
};


  return (
    <>
    <PageBreadcrumb items={[{ title: "Home", path: "/TMS-operations/" }, { title: "Tasks", path: "/TMS-operations/tasks" }, { title: "Assign To Manager" }]} />
    <div className="p-2">
      <h1 className="text-2xl font-bold mb-4 text-[#3C01AF]">Assign To Manager</h1>

      {/* Task Table */}
      <div className="bg-white  rounded p-2 w-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Project</th>
              <th className="p-2 border">Title</th>
             
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t._id} className="border text-center">
                <td className="p-2 border">{t.projectCode}</td>
                <td className="p-2 border">{t.title}</td>
               
                <td className="p-2 border">
                  <button
                    onClick={() => {
                      setAssignTaskId(t._id);
                      setOpenModal(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Assign To
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[99999]">

          <div className="bg-white w-80 p-5 rounded">
            <h3 className="text-lg font-semibold mb-3">Assign</h3>

            <select
              className="w-full border p-2 rounded mb-4"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="" hidden>Select User</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded"
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-1 bg-blue-600 text-white rounded"
                onClick={handleAssign}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AssignTasksPage;
