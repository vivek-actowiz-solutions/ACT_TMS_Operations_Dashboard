import React, { useState, ChangeEvent, FormEvent } from "react";

interface UserForm {
  name: string;
  email: string;
  password: string;
  department: string;
  designation: string;
  role: "Admin" | "Sales" | "TL" | "Developer" | "Manager";
  slackId: string;
  reportingTo: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (user: UserForm) => void;
}


const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [form, setForm] = useState<UserForm>({
    name: "",
    email: "",
    password: "",
    department: "",
    designation: "",
    role: "Developer",
    slackId: "",
    reportingTo: ""
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  const [users, setUsers] = useState([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  // Fetch the list of users

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${apiUrl}/users/all`, {
        credentials: "include"
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.log("Failed to fetch users", err);
    }
  };

  React.useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);


  const getReportingUsers = () => {
    if (!form.role) return [];

    switch (form.role) {


      case "TL":
        return users.filter((u: any) => u.role === "Manager");

      case "Manager":
        return users.filter((u: any) => u.role === "Admin");

      case "Admin":
        return users.filter((u: any) => u.role === "Admin");



      default:
        return [];
    }
  };



  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Call the onCreate callback first (optional, if you want local state update)
      onCreate(form);

      // Send data to your backend
      const response = await fetch(`${apiUrl}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create user");
      }
      localStorage.setItem("TMSAuthToken", data.token);

      console.log("User created:", data);

      // Reset form after successful creation
      setForm({ name: "", email: "", password: "", department: "", designation: "", role: "Developer", slackId: "" });

      // Close the modal
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user. Please try again.");
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[9999]">
  <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-3xl border border-gray-200">

    <h2 className="text-3xl font-semibold mb-10 text-gray-800 text-center">
      Create New User
    </h2>

    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* Full Name */}
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

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-medium">Password</label>
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
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
          value={form.department}
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
          value={form.designation}
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
          <option value="" hidden>Select Role</option>
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
            value={form.reportingTo}
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

      {/* Slack ID — Full Width */}
      <div className="md:col-span-2 flex flex-col gap-2">
        <label className="text-gray-700 font-medium">Slack ID</label>
        <input
          name="slackId"
          placeholder="Slack ID"
          value={form.slackId}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      

      {/* Buttons Full Width */}
      <div className="md:col-span-2 flex justify-end gap-4 pt-6 border-t border-gray-200">
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
          Create
        </button>
      </div>
    </form>
  </div>
</div>

  );

};

export default CreateUserModal;
