import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { User } from "./types.ts";


interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (updatedUser: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [form, setForm] = useState<User | null>(user);
  const [users, setUsers] = useState<User[]>([]);



  const apiUrl = import.meta.env.VITE_API_URL;
  useEffect(() => {
  if (isOpen) {
    fetchAllUsers();
    setForm(user);
  }
}, [isOpen, user]);
const fetchAllUsers = async () => {
  try {
    const res = await fetch(`${apiUrl}/users/all`, {
      credentials: "include",
    });
    const data = await res.json();
    setUsers(data);
  } catch (err) {
    console.error("Failed to fetch users", err);
  }
};

const getReportingUsers = () => {
  if (!form) return [];

  switch (form.role) {
    

    case "TL":
      return users.filter((u) => u.role === "Manager");

    case "Manager":
      return users.filter((u) => u.role === "Admin");

    case "Admin":
      return users.filter((u) => u.role === "Admin");

    

    default:
      return [];
  }
};


  if (!isOpen || !form) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;
    
    try {
      const response = await fetch(`${apiUrl}/users/edit/${form._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // send HTTP-only cookie automatically
      body: JSON.stringify(form),
      });

      const data = await response.json();


      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }
      //Error updating user. Please try again.


      console.log("User updated:", data);

      // Only update state and close modal after successful API call
      onUpdate(data);
      onClose();
       window.location.reload();
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Error updating user. Please try again.");
    }
  };


  return (
//   <div className="fixed inset-0 bg-black/30 backdrop-filter backdrop-blur-md flex items-center justify-center z-[9999]">
//     <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-lg">
//       <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Edit User</h2>
      
//       <form className="space-y-4" onSubmit={handleSubmit}>
//         <input
//           name="name"
//           placeholder="Name"
//           value={form.name}
//           onChange={handleChange}
//           className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           required
//         />
//         <input
//           name="email"
//           type="email"
//           placeholder="Email"
//           value={form.email}
//           onChange={handleChange}
//           className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           required
//         />
//         <input
//           name="department"
//           placeholder="Department"
//           value={form.department || ""}
//           onChange={handleChange}
//           className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <input
//           name="designation"
//           placeholder="Designation"
//           value={form.designation || ""}
//           onChange={handleChange}
//           className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <select
//           name="role"
//           value={form.role}
//           onChange={handleChange}
//           className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           required
//         >
//           <option value="Admin">Admin</option>
//           <option value="TL">TL</option>
//           <option value={"Manager"}>Manager</option>
//           {/* <option value="Developer">Developer</option> */}
//           <option value="Sales">Sales</option>
//           <option value="SuperAdmin">Super Admin</option>
//         </select>

//         {/* Reporting To Field */}
// {form.role !== "SuperAdmin" && (
//   <select
//     name="reportingTo"
//     value={form.reportingTo || ""}
//     onChange={handleChange}
//     className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//     required
//   >
//     <option value="" hidden>Select Reporting To</option>

//     {getReportingUsers().map((u) => (
//       <option key={u._id} value={u._id}>
//         {u.name} 
//       </option>
//     ))}
//   </select>
// )}

//         <input
//           name="slackId"
//           placeholder="Slack ID"
//           value={form.slackId || ""}
//           onChange={handleChange}
//           className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <select
//           name="isActive"
//           value={form.isActive ? "true" : "false"}
//           onChange={(e) =>
//             setForm({ ...form, isActive: e.target.value === "true" })
//           }
//           className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           required
//         >
//           <option value="true">Active</option>
//           <option value="false">Inactive</option>
//         </select>
//         <div className="flex justify-end gap-3 mt-6">
//           <button
//             type="button"
//             onClick={onClose}
//             className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
//           >
//             Cancel
//           </button>
//           <button 
//             type="submit"
//             className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
//           >
//             Update
//           </button>
//         </div>
//       </form>
//     </div>
//   </div>

<div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[9999]">
  <div className="bg-white p-10 rounded-2xl w-full max-w-3xl shadow-xl border border-gray-200">
    
    <h2 className="text-3xl font-semibold mb-10 text-gray-800 text-center">
      Edit User
    </h2>

    <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSubmit}>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-medium">Full Name</label>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-medium">Email</label>
        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Department */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-medium">Department</label>
        <input
          name="department"
          placeholder="Department"
          value={form.department || ""}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Designation */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-medium">Designation</label>
        <input
          name="designation"
          placeholder="Designation"
          value={form.designation || ""}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-medium">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="Admin">Admin</option>
          <option value="TL">Team Lead</option>
          <option value="Manager">Manager</option>
          <option value="Sales">Sales</option>
          <option value="SuperAdmin">Super Admin</option>
        </select>
      </div>

      {/* Reporting To */}
      {form.role !== "SuperAdmin" && (
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Reporting To</label>
          <select
            name="reportingTo"
            value={form.reportingTo || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
          >
            <option value="" hidden>Select Reporting To</option>
            {getReportingUsers().map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Slack ID – Full width */}
      <div className="flex flex-col gap-2 md:col-span-2">
        <label className="text-gray-700 font-medium">Slack ID</label>
        <input
          name="slackId"
          placeholder="Slack ID"
          value={form.slackId || ""}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Active / Inactive */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-medium">Status</label>
        <select
          name="isActive"
          value={form.isActive ? "true" : "false"}
          onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Buttons Full Width */}
      <div className="flex justify-end gap-4 md:col-span-2 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Update
        </button>
      </div>

    </form>
  </div>
</div>

);

};

export default EditUserModal;
