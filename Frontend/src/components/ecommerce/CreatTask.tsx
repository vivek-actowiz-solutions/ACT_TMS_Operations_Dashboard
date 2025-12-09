



import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays } from "date-fns";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { toast, ToastContainer } from "react-toastify";
import CreatableSelect from "react-select/creatable";


interface TaskType {
  title: string;
  assignedTo: string;
  description: string;
  sampleFileRequired: boolean;
  requiredValumeOfSampleFile?: number;
  taskAssignedDate: string;
  targetDate: string;
  completeDate: string;
  domainDetails: { domain: string; typeOfPlatform: string; domainRemarks: string }[];
  typeOfDelivery: string;
  mandatoryFields: string;
  optionalFields: string;
  frequency: string;
  oputputFormat: string;
  status: string;
  sempleFile: boolean;
  sowFile: File[] | null;
  sowUrls: string[];
  inputFile: File[] | null;
  inputUrls: string[];
  clientSampleSchemaFiles: File[] | null;
  clientSampleSchemaUrls: string[];
}

interface UserOption {
  _id: string;
  name: string;
}

const CreateTaskUI: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();
  const twoDaysLater = addDays(today, 2);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [assignedToOptions, setAssignedToOptions] = useState<UserOption[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainPlatform, setDomainPlatform] = useState("");
  const [domainRemark, setDomainRemark] = useState("");

  const [selectedFormats, setSelectedFormats] = useState<any[]>([]);

  const [task, setTask] = useState<TaskType>({
    title: "",
    assignedTo: "",
    description: "",
    sampleFileRequired: false,
    requiredValumeOfSampleFile: undefined,
    taskAssignedDate: format(today, "yyyy-MM-dd"),
    targetDate: format(twoDaysLater, "yyyy-MM-dd"),
    completeDate: "",
    domainDetails: [],
    typeOfDelivery: "",
    mandatoryFields: "",
    optionalFields: "",
    frequency: "",
    oputputFormat: "",
    status: "pending",
    sowFile: [],
    sowUrls: [],
    inputFile: [],
    inputUrls: [],
    clientSampleSchemaFiles: [],
    clientSampleSchemaUrls: [],
  });

  const DeliveryTypes = [
    { label: "API", value: "api" },
    { label: "Data as a Service", value: "data as a service" },
    { label: "Both (API & Data As A Service)", value: "both(api & data as a service)" },
  ];
  const options = [
    { label: "CSV", value: "csv" },
    { label: "JSON", value: "json" },
    { label: "Excel ", value: "excel" },
    { label: "Parquet", value: "parquet" },

  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiUrl}/users/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();

        // Filter by role AND active status
        const activeUsers = data.filter(
          (u: any) => (u.role === "TL" ) && u.isActive
        );

        setAssignedToOptions(activeUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as any;
    setTask((prev) => ({ ...prev, [name]: name === "requiredValumeOfSampleFile" ? Number(value) || undefined : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDomainAdd = () => {
    const trimmed = domainInput.trim();
    const errors = {};

    // ❌ Invalid URL
    if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
      errors.domain = "Platform must start with http:// or https://";
    }

    // ❌ Platform type missing
    if (!domainPlatform) {
      errors.domainPlatform = "Domain Platform is required";
    }

    //for remarks length
    if (domainRemark && domainRemark.length > 100) {
      errors.domainRemark = "Domain Remark cannot exceed 100 characters";
    }

    const INVALID_REMARK_REGEX = /[^a-zA-Z0-9\s.,-]/;
    if (domainRemark && INVALID_REMARK_REGEX.test(domainRemark)) {
      errors.domainRemark = "Special characters are not allowed in remark";
    }

    // special characters in remarks



    if (Object.keys(errors).length > 0) {
      setErrors(prev => ({ ...prev, ...errors }));
      return;
    }
    const newDomain = { domain: trimmed, typeOfPlatform: domainPlatform, domainRemarks: domainRemark || "" };
    setTask((prev) => ({ ...prev, domainDetails: [...prev.domainDetails, newDomain] }));
    setDomainInput("");
    setDomainPlatform("");
    setDomainRemark("");
  };

  const handleDomainRemove = (index: number) => {
    const updated = [...task.domainDetails];
    updated.splice(index, 1);
    setTask({ ...task, domainDetails: updated });
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!task.title.trim()) newErrors.title = "Title is required";
    if (task.title.length > 50) newErrors.title = "Title cannot exceed 50 characters";
    if (/[^a-zA-Z0-9\s]/.test(task.title)) {
      newErrors.title = "Title cannot contain special characters";
    }

    if (!task.assignedTo) newErrors.assignedTo = "Assigned To is required";
    if (!task.description.trim()) newErrors.description = "Description is required";
    if (!task.typeOfDelivery) newErrors.typeOfDelivery = "Type of Delivery is required";
    if (!task.mandatoryFields) newErrors.mandatoryFields = "Mandatory fields are required";

    if (!task.frequency) newErrors.frequency = "Frequency is required";
    if (!selectedFormats || selectedFormats.length === 0) {
      newErrors.oputputFormat = "Please select at least one file format.";
    }
    if (task.domainDetails.length === 0)
      newErrors.domain = "At least one platform entry is required";

    //duplicat domain name
    const extractedDomains = task.domainDetails.map((d) => d.domain.trim());
    const duplicates = extractedDomains.filter((name, index) => name && extractedDomains.indexOf(name) !== index);
    if (duplicates.length > 0) {
      newErrors.domain = "Duplicate domain names are not allowed.";
    }



    if (task.sampleFileRequired && !task.requiredValumeOfSampleFile)
      newErrors.requiredValumeOfSampleFile = "Required volume is mandatory when sample file is required";

    // if (task.inputUrls.some((url) => url && !/^https?:\/\//i.test(url.trim()))) {
    //   newErrors.inputUrls = "All Input URLs must start with http:// or https://";
    // }

    if (task.clientSampleSchemaUrls.some((url) => url && !/^https?:\/\//i.test(url.trim()))) {
      newErrors.clientSampleSchemaUrls = "All Client Sample Schema URLs must start with http:// or https://";
    }

    // if (!(task.inputUrls || []).some((u) => u.trim() !== "")) newErrors.inputUrls = "Input URL is required";
    // if (!(task.clientSampleSchemaUrls || []).some((u) => u.trim() !== ""))
    //   newErrors.clientSampleSchemaUrls = "Client Sample Schema URL is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(task).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === "domainDetails") formData.append("domains", JSON.stringify(value));
        else if (Array.isArray(value)) formData.append(key, value as any);
        else formData.append(key, value as any);
      });
      const res = await fetch(`${apiUrl}/tasks`, { method: "POST", credentials: "include", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.message || "Error creating task" });
        return;
      }
      toast.success("✅ Task created successfully!");
      setTimeout(() => navigate("/TMS-operations/tasks"), 1500);
    } catch {
      setErrors({ form: "Unexpected error creating task" });
    } finally {
      setLoading(false);
    }
  };

  const renderError = (f: string) => errors[f] && <p className="text-red-500 text-sm mt-1">{errors[f]}</p>;

  return (
    <>
      <PageBreadcrumb items={[{ title: "Home", path: "/TMS-operations/" }, { title: "Tasks", path: "/TMS-operations/tasks" }, { title: "Create Task" }]} />
      <div className="min-h-screen w-full bg-white flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl  p-8 rounded-2xl  ">
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
          <div className="ml-5">
            <h1 className="text-3xl font-bold text-[#3C01AF]">Create New Task</h1>
            <p className="text-gray-600 mb-8">Complet all the fields to create a new task</p>
            {errors.form && <p className="text-red-500 text-center mb-4">{errors.form}</p>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-10">
            {[
              { id: 1, title: "Basic Information" },
              { id: 2, title: "Platform Configuration" },
              { id: 3, title: "Configuration Details" },
              { id: 4, title: "Documents" },
            ].map((section) => (
              <div
                key={section.id}
                className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6"
              >
                <div className="w-full bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-100 rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-center gap-3 ">
                    <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-sm">
                      {section.id}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#3C01AF] leading-tight">
                        {section.title}
                      </h2>

                    </div>
                  </div>
                </div>




                {section.id === 1 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Task Name <span className="text-red-500">*</span></label>
                      <input type="text" name="title" value={task.title} onChange={handleChange} className="w-full border rounded-lg p-3" maxLength={50} />
                      {renderError("title")}
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Assigned To <span className="text-red-500">*</span></label>
                      <select name="assignedTo" value={task.assignedTo} onChange={handleChange} className="w-full border rounded-lg p-3">
                        <option value="" hidden>Select Assignee</option>
                        {assignedToOptions.map((user) => (
                          <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                      </select>
                      {renderError("assignedTo")}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        name="description"
                        value={task.description}
                        onChange={handleChange}
                        className="w-full border rounded-lg p-3 h-28"
                        maxLength={200} // limit
                      />

                      <div className="text-right text-sm text-gray-500 mt-1">
                        {task.description.length}/200 characters
                      </div>

                      {renderError("description")}
                    </div>

                  </div>
                )}

                {section.id === 2 && (
                  <>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <input type="text" value={domainInput} onChange={(e) => {
                        setDomainInput(e.target.value);
                        if (e.target.value) {
                          setErrors((prev) => ({ ...prev, domain: "" })); // Clear domain error
                        }
                      }} placeholder="https://www.xyz.com/" className="flex-1 border rounded-lg p-3" />
                      <select value={domainPlatform} onChange={(e) => {
                        setDomainPlatform(e.target.value);

                        // remove platform error instantly
                        if (e.target.value) {
                          setErrors(prev => ({ ...prev, domainPlatform: "" }));
                        }
                      }} className="border rounded-lg p-3">
                        <option value="" hidden>Select Platform Type</option>
                        <option value="web">Web</option>
                        <option value="app">App</option>
                        <option value="both (app & web)">Both (App & Web)</option>
                      </select>

                      <input type="text" value={domainRemark} onChange={(e) => setDomainRemark(e.target.value)} placeholder="Remark (optional)" className="flex-1 border rounded-lg p-3" max={100} />

                      <button type="button" onClick={handleDomainAdd} className="bg-[#3C01AF] hover:bg-blue-700 text-white px-5 py-2 rounded-lg">Add</button>
                    </div>
                    {task.domainDetails.length > 0 && (
                      <div className="space-y-2">
                        {task.domainDetails.map((d, i) => (
                          <div
                            key={i}
                            className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-3 text-center"
                          >
                            <span className="text-sm font-medium text-gray-800 mb-2 sm:mb-0">
                              {d.domain}
                            </span>


                            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">
                              {d.typeOfPlatform || "-"}
                            </span>
                            {d.domainRemarks && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                {d.domainRemarks}
                              </span>
                            )}


                            <button
                              type="button"
                              onClick={() => handleDomainRemove(i)}
                              className="text-red-500 text-sm hover:text-red-700 mt-2 sm:mt-0"
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.domain && <p className="text-red-500 text-sm">{errors.domain}</p>}
                    {errors.domainPlatform && <p className="text-red-500 text-sm">{errors.domainPlatform}</p>}
                    {errors.domainRemark && (
                      <p className="text-red-500 text-sm">{errors.domainRemark}</p>
                    )}

                  </>
                )}

                {section.id === 3 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Type of Delivery<span className="text-red-500">*</span></label>
                      <select
                        name="typeOfDelivery"
                        value={task.typeOfDelivery}
                        onChange={handleChange}
                        className="w-full p-3 rounded-md 0 border border-gray-300 text-gray-900"
                      >
                        <option value="" hidden>Select Type</option>
                        {DeliveryTypes.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      {renderError("typeOfDelivery")}
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Mandatory Fields<span className="text-red-500">*</span></label>
                      <input type="text" name="mandatoryFields" value={task.mandatoryFields} onChange={handleChange} placeholder="Ex:-header 1 , header 2,..." className="w-full border rounded-lg p-3" />
                      {renderError("mandatoryFields")}
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Optional Fields </label>
                      <input type="text" placeholder="Ex:-header 1 , header 2,..." name="optionalFields" value={task.optionalFields} onChange={handleChange} className="w-full border rounded-lg p-3" />
                      {renderError("optionalFields")}
                    </div>
                    {/* <div>
                      <label className="block text-gray-700 font-medium mb-2">Frequency <span className="text-red-500">*</span></label>
                      <input type="text" name="frequency" placeholder="Ex:-Daily , Weekly,..." value={task.frequency} onChange={handleChange} className="w-full border rounded-lg p-3" />
                      {renderError("frequency")}
                    </div> */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Frequency <span className="text-red-500">*</span>
                      </label>

                      <select
                        name="frequency"
                        value={task.frequency}
                        onChange={(e) => {
                          handleChange(e); // keeps your existing handler logic for task state
                          // clear frequency error immediately
                          setErrors(prev => ({ ...prev, frequency: "" }));
                        }}
                        className="w-full border rounded-lg p-3 bg-white"
                      >
                        <option value="" hidden>Select Frequency</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Bi-Weekly">Bi-Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Bi-Monthly">Bi-Monthly</option>
                        <option value="Once-Off">Once-Off</option>
                        <option value="Hourly">Hourly</option>
                      </select>

                      {renderError("frequency")}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Output Format <span className="text-red-500">*</span></label>
                      {/* <select name="oputputFormat" value={task.oputputFormat} onChange={handleChange} className="w-full border rounded-lg p-3">
                        <option value="" hidden>Select Output Format</option>
                        <option value="CSV">CSV</option>
                        <option value="JSON">JSON</option>
                        <option value="Excel">Excel</option>
                        <option value="Parquet">Parquet</option>
                      </select> */}
                      <CreatableSelect
                        isMulti
                        options={options}
                        name="oputputFormat"
                        value={selectedFormats}
                        onChange={(value) => {
                          const formats = value as any[];
                          setSelectedFormats(formats);

                          setTask((prev) => ({
                            ...prev,
                            oputputFormat: formats.map((f) => f.value),
                          }));


                          // Clear error as soon as user selects at least one format
                          if (formats.length > 0) {
                            setErrors((prev) => ({ ...prev, oputputFormat: "" }));
                          }
                        }}
                        placeholder="Select or create file formats..."
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            backgroundColor: "#ffffff",
                            borderColor: state.isFocused ? "#3B82F6" : "#D1D5DB",
                            boxShadow: state.isFocused ? "0 0 0 1px #3B82F6" : "none",
                            "&:hover": { borderColor: "#3B82F6" },
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "#ffffff",
                            border: "1px solid #E5E7EB",
                            borderRadius: "0.375rem",
                            zIndex: 20,
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected
                              ? "#3B82F6"
                              : state.isFocused
                                ? "#EFF6FF"
                                : "#ffffff",
                            color: state.isSelected ? "#ffffff" : "#111827",
                            cursor: "pointer",
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: "#E0F2FE",
                            color: "#1E3A8A",
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: "#1E3A8A",
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: "#1E3A8A",
                            ":hover": {
                              backgroundColor: "#BFDBFE",
                              color: "#1E3A8A",
                            },
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: "#6B7280",
                          }),
                          input: (base) => ({
                            ...base,
                            color: "#111827",
                            height: "2.5rem",
                            borderRadius: "0.375rem",
                          }),
                        }}
                      />
                      {renderError("oputputFormat")}
                    </div>
                    <div className="md:col-span-2 mt-3">
                      <label className="flex items-center gap-2 text-gray-900">
                        <input type="checkbox" checked={task.sampleFileRequired} onChange={(e) => setTask({ ...task, sampleFileRequired: e.target.checked })} className="h-4 w-4" />
                        Sample File Required?
                      </label>
                      {task.sampleFileRequired && (
                        <div className="mt-3">
                          <label className="block text-gray-700 font-medium mb-2">Required Volume <span className="text-red-500">*</span></label>
                          <select name="requiredValumeOfSampleFile" value={task.requiredValumeOfSampleFile} onChange={handleChange} className="w-full border rounded-lg p-3">
                            <option value="">Select Volume</option>
                            {["20", "50", "100", "500", "1000"].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          {renderError("requiredValumeOfSampleFile")}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {section.id === 4 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Input Document URL/Input Keywords</label>
                      <input type="text" name="inputUrls" value={task.inputUrls[0] || ""} onChange={(e) => {
                        setTask({ ...task, inputUrls: [e.target.value.trim()] });

                      }} className="w-full border rounded-lg p-3" />

                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Client Sample Schema Document URL </label>
                      <input type="text" name="clientSampleSchemaUrls" value={task.clientSampleSchemaUrls[0] || ""} onChange={(e) => {
                        setTask({ ...task, clientSampleSchemaUrls: [e.target.value.trim()] });
                        clearError("clientSampleSchemaUrls"); // 🔥 remove error instantly
                      }} className="w-full border rounded-lg p-3" />
                      {renderError("clientSampleSchemaUrls")}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-end">
              <button type="submit" className="px-8 py-3 bg-[#3C01AF] text-white font-semibold rounded-lg hover:bg-blue-700" disabled={loading}>
                {loading ? "Creating Task..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateTaskUI;