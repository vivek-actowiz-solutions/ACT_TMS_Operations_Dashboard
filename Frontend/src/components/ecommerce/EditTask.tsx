// src/pages/EditTaskFullUI.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router"
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { ToastContainer, toast } from "react-toastify";
// Removed unnecessary icons: FileText, Download, Globe, Link2
import { Edit, Save } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import CreatableSelect from "react-select/creatable";
// Removed useRef
import { useAuth } from "../../hooks/useAuth";
import EditSubmit from "./EditSubmit";



interface Domain {
  name: string;
  status: string;
  typeOfPlatform?: string;
  domainRemarks?: string;

  developers?: string[];
  submission?: {
    outputFiles?: File[] | null;
    outputUrl?: string[] | null;
  };
}

const EditTaskUI: React.FC<{ taskData?: Task }> = ({ taskData }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const { role } = useAuth()
  const domainFromUrl = new URLSearchParams(location.search).get("domain");


  const [task, setTask] = useState<Task>({

    domains: [],

  });

  const [domainInput, setDomainInput] = useState("");
  const [developerInput, setDeveloperInput] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  // Removed originalTask state
  const [domainPlatform, setDomainPlatform] = useState("");
  const [domainRemark, setDomainRemark] = useState<string>("");
  // Removed domainInputPlatform and domainInputRemark
  const [previousDomains, setPreviousDomains] = useState<any[]>([]);
  // State for Domain Editing
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editDomainInput, setEditDomainInput] = useState<Domain | null>(null);

  const [users, setUsers] = useState<{ _id: string; name: string; role: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"task" | "submit">("task");


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiUrl}/users/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include"
        });
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  // Filtered user options
  const developerOptions = users.filter((u) =>  u.role === "TL");


  const normalizeUserId = (user: any) => {
    if (!user) return "";
    if (typeof user === "string" && /^[0-9a-fA-F]{24}$/.test(user)) return user;
    if (user._id) return user._id;
    // Try to map from users list by name
    const mapped = users.find((u) => u.name === user);
    return mapped ? mapped._id : "";
  };




  // Simplified validateForm - only checking domain array length
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Only validate the fields relevant to the domain section we are keeping
    if (!task.domains || task.domains.length === 0) newErrors.domains = "At least one Platform is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const normalizeTaskData = (data: any): Task => {
    const toArray = (val: any): string[] =>
      Array.isArray(val) ? val : val ? [val] : [];

    // 🔹 Convert developers per domain into an object
    const developers: Record<string, string[]> = {};
    (data.domains || []).forEach((d: any) => {
      if (d.developers && Array.isArray(d.developers)) {
        developers[d.name] = d.developers.map(
          (dev: any) => (dev._id ? dev._id : dev)
        );
      }
    });

    return {
      ...data,
      assignedBy: normalizeUserId(data.assignedBy),
      assignedTo: normalizeUserId(data.assignedTo),
      previousDomain: data.previousDomain || [],
      developers,
      domains: (data.domains || []).map((d: any) => ({
        name: d.name,
        status: d.status,
        typeOfPlatform: d.typeOfPlatform || "",
        domainRemarks: d.domainRemarks || "",   // ✅ FIXED
        developers: d.developers || [],
        submission: d.submission || {},
      })),

      // Removed normalizeOption usage for Delivery/Platform
      typeOfDelivery: data.typeOfDelivery || "",
      typeOfPlatform: data.typeOfPlatform || "",

      // FIX HERE — Always arrays
      sowFile: toArray(data.sowFiles),
      inputFile: toArray(data.inputFiles),
      clientSampleSchemaFile: toArray(data.clientSampleSchemaFile),

      // Keep URLs safe
      sowUrls: toArray(data.sowUrls),
      inputUrls: toArray(data.inputUrls),
      clientSampleSchemaUrls: toArray(data.clientSampleSchemaUrls),

      // Added back mandatory top-level Task fields for structure
      title: data.title || "",
      description: data.description || "",
      taskAssignedDate: data.taskAssignedDate || "",
      targetDate: data.targetDate || "",
      completeDate: data.completeDate || "",
      status: data.status || "in-progress",
      sempleFile: data.sempleFile || false,
    };
  };

  useEffect(() => {
    if (!id) return;

    if (!taskData) {
      fetch(`${apiUrl}/tasks/${id}`, {
        method: "GET",
        credentials: "include",   // required for cookies
      })
        .then(res => res.json())
        .then(data => {
          const normalized = normalizeTaskData(data);
          setTask(normalized);
          setPreviousDomains(normalized.previousDomain || []);
          setInitialLoading(false);
        })
        .catch(err => {
          console.error(err);
          setInitialLoading(false);
        });
    } else {
      setTask(normalizeTaskData(taskData));
      // setdemoin (taskData.domains.filter((d: any) => d.domine === "pending"));
      setInitialLoading(false);
    }
  }, [taskData, id, users]);


  const handleDomainAdd = () => {
    const trimmed = domainInput.trim();
    if (!trimmed) return;

    const isValid = /^https?:\/\//i.test(trimmed);
    if (!isValid) {
      setErrors((prev) => ({ ...prev, domains: "Platform must start with http:// or https://" }));
      return;
    }

    if (task.domains.some(d => d.name === trimmed)) {
      setErrors((prev) => ({ ...prev, domains: "This platform is already added." }));
      return;
    }

    setTask(prev => ({
      ...prev,
      domains: [
        ...prev.domains,
        {
          name: trimmed,
          status: "pending",
          typeOfPlatform: domainPlatform || "",
          domainRemarks: domainRemark || ""
        }
      ]
    }));

    // Clear input fields
    setDomainInput("");
    setDomainPlatform("");
    setDomainRemark("");
  };

  const handleDomainRemove = (domains: string) => {
    const updatedDomains = task.domains.filter(d => d.name !== domains);
    const updatedDevelopers = { ...task.developers };
    delete updatedDevelopers[domains];
    setTask(prev => ({ ...prev, domains: updatedDomains, developers: updatedDevelopers }));
  };

  const handleDomainEditStart = (domain: Domain) => {
    setEditingDomain(domain.name);
    setEditDomainInput({ ...domain });
  };

  const handleDomainEditSave = () => {
    if (!editDomainInput || !editingDomain) return;

    const trimmed = editDomainInput.name.trim();
    if (!trimmed) {
      toast.error("Domain URL cannot be empty.");
      return;
    }

    const isValid = /^https?:\/\//i.test(trimmed);
    if (!isValid) {
      toast.error("Platform must start with http:// or https://");
      return;
    }

    if (trimmed !== editingDomain && task.domains.some(d => d.name === trimmed)) {
      toast.error("A platform with this URL already exists.");
      return;
    }

    setTask(prev => {
      const updatedDomains = prev.domains.map(d => {
        if (d.name === editingDomain) {
          // Update developers key if the domain name has changed
          if (trimmed !== editingDomain) {
            const updatedDevelopers = { ...prev.developers };
            const devs = updatedDevelopers[editingDomain] || [];
            delete updatedDevelopers[editingDomain];
            updatedDevelopers[trimmed] = devs;
            setTask(p => ({ ...p, developers: updatedDevelopers }));
          }

          return {
            ...editDomainInput,
            name: trimmed,
            typeOfPlatform: editDomainInput.typeOfPlatform || "",
            remark: editDomainInput.domainRemarks

          };
        }
        return d;
      });

      // Clear edit state
      setEditingDomain(null);
      setEditDomainInput(null);
      return { ...prev, domains: updatedDomains };
    });
  };

  const handleDomainEditCancel = () => {
    setEditingDomain(null);
    setEditDomainInput(null);
  };


  const handleDeveloperAdd = (domainName: string) => {
    const devId = developerInput[domainName];
    if (!devId) return;

    // const alreadyAssigned = Object.values(task.developers).some(arr => arr.includes(devId));
    // if (alreadyAssigned) {
    //   toast.error("This developer is already assigned!");
    //   return;
    // }

    setTask(prev => ({
      ...prev,
      developers: {
        ...prev.developers,
        [domainName]: [...(prev.developers[domainName] || []), devId],
      },
    }));
    setDeveloperInput(prev => ({ ...prev, [domainName]: "" }));
  };

  const handleDeveloperRemove = (domainName: string, devId: string) => {
    setTask(prev => ({
      ...prev,
      developers: {
        ...prev.developers,
        [domainName]: prev.developers[domainName].filter(d => d !== devId),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const formData = new FormData();

      // 🔹 Convert developer names → IDs before sending
      const developersForBackend = Object.fromEntries(
        Object.entries(task.developers).map(([domain, devs]) => [
          domain,
          devs.map((d) => {
            const found = users.find((u) => u.name === d || u._id === d);
            return found ? found._id : d;
          }),
        ])
      );

      // 1️⃣ Keep minimal top-level fields for backend update
      // Only include fields that MUST be sent to the backend for a task update
      const minimalTaskFields = [
        "title", "assignedTo", "description", "typeOfDelivery", "typeOfPlatform", "status",
        "sampleFileRequired", "requiredValumeOfSampleFile",
        "taskAssignedDate", "targetDate", "completeDate",
      ];

      Object.entries(task).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;

        if (minimalTaskFields.includes(key)) {
          formData.append(key, value as any);
        } else if (key === "developers") {
          formData.append("developers", JSON.stringify(developersForBackend));
        } else if (["sowUrls", "inputUrls", "clientSampleSchemaUrls"].includes(key)) {
          const arr = Array.isArray(value)
            ? value.filter(Boolean)
            : typeof value === "string" && value
              ? [value]
              : [];
          formData.append(key, JSON.stringify(arr));
        }
        // NOTE: File handling logic removed as it's complex and outside domain scope
      });

      // 2️⃣ Domain-based logic (required)
      const keptOutputMap: Record<string, string[]> = {};
      const outputUrlsMap: Record<string, string[]> = {};

      (task.domains || []).forEach((domain) => {
        let keptFiles = domain.submission?.outputFiles?.filter(
          (f) => typeof f === "string"
        ) || [];

        // Simplified file/url handling for demonstration (assuming backend needs this structure)
        if (keptFiles.length) {
          keptOutputMap[domain.name] = Array.from(new Set(keptFiles));
        }

        if (domain.submission?.outputUrls?.length) {
          outputUrlsMap[domain.name] = domain.submission.outputUrls.filter(Boolean);
        } else {
          outputUrlsMap[domain.name] = [];
        }
      });

      if (Object.keys(keptOutputMap).length)
        formData.append("keptOutputFiles", JSON.stringify(keptOutputMap));

      if (Object.keys(outputUrlsMap).length)
        formData.append("domainOutputUrls", JSON.stringify(outputUrlsMap));


      // 🎯 CRITICAL: Append the domains array correctly
      formData.append(
        "domains",
        JSON.stringify(
          task.domains.map((d) => ({
            name: d.name,   // ✔ FIXED
            status: d.status || "pending",
            typeOfPlatform: d.typeOfPlatform || "",
            domainRemarks: d.domainRemarks || "",


          }))
        )
      );




      // 3️⃣ Format dates
      if (task.taskAssignedDate)
        formData.set("taskAssignedDate", format(new Date(task.taskAssignedDate), "yyyy-MM-dd"));
      if (task.targetDate)
        formData.set("targetDate", format(new Date(task.targetDate), "yyyy-MM-dd"));
      if (task.completeDate)
        formData.set("completeDate", format(new Date(task.completeDate), "yyyy-MM-dd"));

      // 4️⃣ Submit
      const res = await fetch(`${apiUrl}/tasks/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("❌ Error updating task: " + JSON.stringify(data.errors || data));
        return;
      }

      toast.success("✅ Task updated successfully!");
      setTimeout(() => navigate("/TMS-operations/tasks"), 1500);
    } catch (err) {
      console.error("❌ Error updating task:", err);
      toast.error("❌ Error updating task!");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
      </div>
    );
  }

  // --------------------------- RENDER -----------------------------
  return (
    <>
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

      <PageBreadcrumb
        items={[
          { title: "Home", path: "/TMS-operations/" },
          { title: "Tasks", path: "/TMS-operations/tasks" },
          { title: "Edit Task" },
        ]}
      />
      {/* --------------------- TABS HEADER --------------------- */}
      <div className="flex gap-4 border-b mb-6">
        <button
          type="button"
          className={`px-4 py-2 border-b-2 ${activeTab === "task"
              ? "border-[#3C01AF] text-[#3C01AF] font-bold"
              : "border-transparent text-gray-600"
            }`}
          onClick={() => setActiveTab("task")}
        >
          {role === "Manager" || role === "TL"
            ? "Add Developer"
            : role === "Sales"
              ? "Edit Domain"
              : "Edit Task"}   {/* Default for Admin or others */}
        </button>


        {/* Show Submit Tab only if the selected domain = submitted */}
        {(role === "Admin" ||  role === "Manager"  || role === "SuperAdmin") &&
          task.domains.some(
            (d) =>
              decodeURIComponent(domainFromUrl || "") === d.name &&
              d.status === "submitted"
          ) && (
            <button
              type="button"
              className={`px-4 py-2 border-b-2 ${activeTab === "submit"
                ? "border-[#3C01AF] text-[#3C01AF] font-bold"
                : "border-transparent text-gray-600"
                }`}
              onClick={() => setActiveTab("submit")}
            >
              Edit Submit
            </button>
          )}

      </div>

      {activeTab === "task" && (
        <>
          <div className="min-h-screen w-full flex justify-center py-10 px-4 ">
            <div className="w-full max-w-6xl bg-white    border-gray-200  p-8 ">
              <h1 className="text-3xl font-bold text-[#3C01AF] mb-2">
                {task.projectCode ? `[${task.projectCode}] ${task.title}` : "Edit Task"}
              </h1>
              <p className="text-gray-600 mb-6">Update the fields below to edit the task</p>
              {errors.form && <p className="text-red-500 text-center mb-4">{errors.form}</p>}

              <form onSubmit={handleSubmit} className="space-y-10">


                
                <div className="bg-white border border-blue-200 rounded-2xl shadow-md p-6">
                  <div className="w-full bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-100 rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-3 ">
                      <div>
                        <h2 className="text-base font-semibold text-[#3C01AF] leading-tight">
                          Platform Configuration
                        </h2>
                      </div>
                    </div>
                  </div>
                  {previousDomains.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 mb-8">
                      <h3 className="text-xl font-bold text-yellow-700 mb-4">Previous Domain History</h3>

                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border p-2">Domain</th>

                            <th className="border p-2">Developers</th>

                          </tr>
                        </thead>

                        <tbody>
                          {previousDomains.map((p, i) =>
                            p.oldValue.map((d: any, idx: number) => {
                              const developerNames = d.developers
                                ?.map((id: string) => users.find((u) => u._id === id)?.name || id)
                                .join(", ") || "-";

                              return (
                                <tr key={`${i}-${idx}`} className="text-center">
                                  <td className="border p-2">{d.name}</td>

                                  <td className="border p-2">{developerNames}</td>

                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}


                  
                  {task.domains.map((d) => (
                    <div
                      key={d.name}
                      className={`bg-blue-50 border rounded-lg p-4 mb-3 ${editingDomain === d.name ? 'border-purple-500' : 'border-blue-200'}`}
                    >
                      {editingDomain === d.name && editDomainInput ? (
                       
                        <div className="space-y-3">
                         
                          <input
                            type="text"
                            value={editDomainInput.name}
                            onChange={(e) => setEditDomainInput(p => (p ? { ...p, name: e.target.value } : null))}
                            placeholder="https://www.xyz.com/"
                            className="w-full rounded-lg border border-gray-300 p-3 text-gray-800"
                          />

                          <div className="flex gap-3">
                            
                            <select
                              value={editDomainInput.typeOfPlatform || ""}
                              onChange={(e) => setEditDomainInput(p => (p ? { ...p, typeOfPlatform: e.target.value } : null))}
                              className="flex-1 border rounded-lg p-3 text-gray-800"
                            >
                              <option value="" hidden>Select Platform Type</option>
                              <option value="web">Web</option>
                              <option value="app">App</option>
                              <option value="both (app & web)">Both (App & Web)</option>
                            </select>

                           
                            <input
                              type="text"
                              value={editDomainInput.domainRemarks || ""}
                              onChange={(e) => setEditDomainInput(p => (p ? { ...p, domainRemarks: e.target.value } : null))}
                              placeholder="Remark (optional)"
                              className="flex-1 rounded-lg border border-gray-300 p-3 text-gray-800"
                            />
                          </div>

                          
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleDomainEditSave}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                            >
                              <Save size={16} /> Save
                            </button>
                            <button
                              type="button"
                              onClick={handleDomainEditCancel}
                              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        
                        <>
                          <div className="grid grid-cols-4 gap-4 items-center w-full pb-4  px-3   bg-blue-50">

                            
                            <div className="text-gray-800 font-medium break-words">
                              {d.name}
                            </div>

                            
                            <div className="text-center">
                              {d.typeOfPlatform ? (
                                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                  {d.typeOfPlatform}
                                </span>
                              ) : (
                                <span>-</span>
                              )}
                            </div>

                            
                            <div className="text-center text-gray-600 italic break-words">
                              {d.domainRemarks || "-"}
                            </div>

                            
                            <div className="flex justify-end gap-3">

                             
                              {(role === "Sales" || role === "Admin" || role === "SuperAdmin") && (
                                <button
                                  type="button"
                                  onClick={() => handleDomainEditStart(d)}
                                  className="text-blue-500 hover:text-blue-600 p-1 rounded hover:bg-blue-100"
                                  title="Edit Platform"
                                >
                                  <Edit size={16} />
                                </button>
                              )}

                              
                              {(role === "Sales" || role === "Admin" || role === "SuperAdmin") && (
                                <button
                                  type="button"
                                  onClick={() => handleDomainRemove(d.name)}
                                  className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-100"
                                  title="Remove Platform"
                                >
                                  ❌
                                </button>
                              )}
                            </div>

                          </div>


                          

                          {(role === "TL" || role === "Manager" || role === "Admin" || role === "SuperAdmin") && (
                            <div className="flex flex-col gap-2">
                              <CreatableSelect
                                isClearable
                                isMulti
                                onChange={(selectedOptions) => {
                                  const values = selectedOptions ? selectedOptions.map((o) => o.value) : [];
                                  setTask((prev) => ({
                                    ...prev,
                                    developers: { ...prev.developers, [d.name]: values },
                                  }));
                                  if (values.length) setErrors((prev) => ({ ...prev, domains: "" }));
                                }}
                                onCreateOption={(inputValue) => {
                                  // Add new option to developers automatically
                                  const newOption = { value: inputValue, label: inputValue };
                                  developerOptions.push({ _id: inputValue, name: inputValue }); // optional
                                  const current = task.developers[d.name] || [];
                                  setTask((prev) => ({
                                    ...prev,
                                    developers: { ...prev.developers, [d.name]: [...current, inputValue] },
                                  }));
                                }}
                                value={(task.developers[d.name] || []).map((devId) => ({
                                  value: devId,
                                  label: users.find((u) => u._id === devId)?.name || devId,
                                }))}
                                options={developerOptions.map((u) => ({ value: u._id, label: u.name }))}
                                placeholder="Select or create developers"
                                className="rounded-lg  dark:border-gray-600 dark:text-white/90"
                              />

                              
                            </div>
                          )}


                        </>
                      )}
                    </div>
                  ))}

                  {(role === "Sales" || role === "Admin" || role === "SuperAdmin") && (
                    <div className="flex flex-wrap gap-3 mb-4 items-end">
                      
                      <input  
                        type="text"
                        value={domainInput}
                        onChange={(e) => {
                          setDomainInput(e.target.value);
                          if (e.target.value) setErrors((prev) => ({ ...prev, domains: "" }));
                        }}
                        placeholder="https://www.xyz.com/"
                        className="flex-1 rounded-lg border border-gray-300 p-3 dark:text-white/90"
                      />

                      
                      <select
                        value={domainPlatform}
                        onChange={(e) => setDomainPlatform(e.target.value)}
                        className="border rounded-lg p-3"
                      >
                        <option value="" hidden>Select Platform Type</option>
                        <option value="web">Web</option>
                        <option value="app">App</option>
                        <option value="both (app & web)">Both (App & Web)</option>
                      </select>

                      
                      <input
                        type="text"
                        value={domainRemark}
                        onChange={(e) => setDomainRemark(e.target.value)}
                        placeholder="Remark (optional)"
                        className="flex-1 rounded-lg border border-gray-300 p-3 dark:text-white/90"
                      />

                      
                      <button
                        type="button"
                        onClick={handleDomainAdd}
                        className="bg-[#3C01AF] hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  
                  {errors.domains && <p className="text-red-500 mb-2">{errors.domains}</p>}
                </div>

                <div className="flex justify-end gap-2">

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-[#3C01AF] text-white font-semibold rounded-lg hover:bg-blue-700"
                  >
                    {loading ? "Updating..." : "Update Task"}
                  </button>
                  <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold">
                    ⬅️ Back
                  </button>
                </div>
              </form>
            </div>

          </div>
        </>
      )}
     
        <div className="mt-6">
          {task.domains.map((d) => (
            <div key={d.name} className="...">

              {/* Your domain UI */}

              {/* FINAL CONDITIONAL RENDERING */}
              {decodeURIComponent(domainFromUrl || "") === d.name &&
                d.status === "submitted" && (
                  <div className="mt-4">
                    {(role === "TL" || role === "Manager" || role === "Admin") && (
                      <EditSubmit />
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      



    </>
  );

};

export default EditTaskUI;