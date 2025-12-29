// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router";
// import PageBreadcrumb from "../common/PageBreadCrumb";
// import { toast, ToastContainer } from "react-toastify";
// import CreatableSelect from "react-select/creatable";
// import "react-toastify/dist/ReactToastify.css";

// interface DomainDetail {
//   domain: string;
//   typeOfPlatform: string;
//   domainRemarks?: string;
// }

// interface TaskType {
//   title: string;
//   assignedTo: string;
//   description: string;
//   sampleFileRequired: boolean;
//   requiredValumeOfSampleFile?: number | string | undefined;
//   taskAssignedDate?: string;
//   targetDate?: string;
//   completeDate?: string;
//   domainDetails: DomainDetail[];
//   typeOfDelivery: string;
//   mandatoryFields: string;
//   optionalFields: string;
//   frequency: string;
//   oputputFormat: string[]; // array of format values
//   status?: string;
//   sowFile: File[] | null;
//   sowUrls: string[];
//   inputFile: File[] | null;
//   inputUrls: string[];
//   clientSampleSchemaFiles: File[] | null;
//   clientSampleSchemaUrls: string[];
// }

// interface UserOption {
//   _id: string;
//   name: string;
//   role?: string;
// }

// const ReopenTask: React.FC = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const apiUrl = import.meta.env.VITE_API_URL || "";

//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState<{ [k: string]: string }>({});
//   const [assignedToOptions, setAssignedToOptions] = useState<UserOption[]>([]);

//   // Local domain fields
//   const [domainInput, setDomainInput] = useState("");
//   const [domainPlatform, setDomainPlatform] = useState("");
//   const [domainRemark, setDomainRemark] = useState("");

//   const [task, setTask] = useState<TaskType>({
//     title: "",
//     assignedTo: "",
//     description: "",
//     sampleFileRequired: false,
//     requiredValumeOfSampleFile: undefined,
//     taskAssignedDate: "",
//     targetDate: "",
//     completeDate: "",
//     domainDetails: [],
//     typeOfDelivery: "",
//     mandatoryFields: "",
//     optionalFields: "",
//     frequency: "",
//     oputputFormat: [],
//     status: "pending",
//     sowFile: [],
//     sowUrls: [],
//     inputFile: [],
//     inputUrls: [],
//     clientSampleSchemaFiles: [],
//     clientSampleSchemaUrls: [],
//   });

//   const [selectedFormats, setSelectedFormats] = useState<any[]>([]);
//   const [originalTask, setOriginalTask] = useState<any>(null);


//   const [editingIndex, setEditingIndex] = useState<number | null>(null);
//   const [isChanged, setIsChanged] = useState(false);



//   const DeliveryTypes = [
//     { label: "API", value: "api" },
//     { label: "Data as a Service", value: "data as a service" },
//     { label: "Both (API & Data As A Service)", value: "both(api & data as a service)" },
//   ];

//   const formatOptions = [
//     { label: "CSV", value: "csv" },
//     { label: "JSON", value: "json" },
//     { label: "Excel", value: "excel" },
//     { label: "Parquet", value: "parquet" },
//   ];

//   const normalize = (task: any) => {
//   return {
//     ...task,
//     // Normalize Output Format
//     oputputFormat: Array.isArray(task.oputputFormat)
//       ? task.oputputFormat
//       : (task.oputputFormat || "").split(",").map((s: string) => s.trim()),

//     // Normalize Domains (rename name → domain)
//     domains: (task.domains || []).map((d: any) => ({
//       domain: d.name || "",
//       typeOfPlatform: d.typeOfPlatform || "",
//       domainRemarks: d.domainRemarks || "",
//     })),

//     // Normalize inputUrls
//     inputUrls: Array.isArray(task.inputUrls)
//       ? task.inputUrls
//       : task.inputUrls
//         ? [task.inputUrls]
//         : [""] ,

//     // Normalize clientSampleSchemaUrls
//     clientSampleSchemaUrls: Array.isArray(task.clientSampleSchemaUrls)
//       ? task.clientSampleSchemaUrls
//       : task.clientSampleSchemaUrls
//         ? [task.clientSampleSchemaUrls]
//         : [""],
//   };
// };



//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const res = await fetch(`${apiUrl}/users/all`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         const data = await res.json();
//         // keep TL & Manager similar to CreateTask
//         setAssignedToOptions(data.filter((u: any) => u.role === "TL" || u.role === "Manager"));
//       } catch (err) {
//         console.error("Error fetching users:", err);
//       }
//     };
//     if (apiUrl) fetchUsers();
//   }, [apiUrl]);


//   useEffect(() => {
//     const load = async () => {
//       if (!id) return;

//       try {
//         const res = await fetch(`${apiUrl}/tasks/${id}/reopen-data`, {
//           method: "GET",
//           credentials: "include",
//         });

//         const data = await res.json();

//         // setOriginalTask({
//         //   ...data,
//         //   assignedTo: data.assignedTo?._id || ""   // normalize
//         // });
//         setOriginalTask(normalize(data));



//         setTask({
//           title: data.title || "",
//           assignedTo: data.assignedTo?._id || data.assignedTo || "",
//           description: data.description || "",
//           sampleFileRequired: !!data.sampleFileRequired,
//           requiredValumeOfSampleFile: data.requiredValumeOfSampleFile || "",
//           taskAssignedDate: data.taskAssignedDate ? data.taskAssignedDate.substring(0, 10) : "",
//           targetDate: data.targetDate ? data.targetDate.substring(0, 10) : "",
//           completeDate: data.completeDate || "",
//           domainDetails: data.domains?.map((d: any) => ({
//             domain: d.name,
//             typeOfPlatform: d.typeOfPlatform,
//             domainRemarks: d.domainRemarks,
//           })) || [],
//           typeOfDelivery: data.typeOfDelivery || "",
//           mandatoryFields: data.mandatoryFields || "",
//           optionalFields: data.optionalFields || "",
//           frequency: data.frequency || "",
//           oputputFormat: data.oputputFormat || [],
//           status: data.status || "pending",
//           sowFile: [],
//           sowUrls: data.sowUrls || [],
//           inputFile: [],
//           inputUrls: data.inputUrls || [],
//           clientSampleSchemaFiles: [],
//           clientSampleSchemaUrls: data.clientSampleSchemaUrls || [],
//         });

//         setSelectedFormats(
//           (typeof data.oputputFormat === "string"
//             ? data.oputputFormat.split(",")
//             : data.oputputFormat || []
//           ).map((f: string) => ({
//             label: f.toUpperCase(),
//             value: f
//           }))
//         );

//       } catch (err) {
//         console.error("Failed to load task:", err);
//       }
//     };

//     if (apiUrl) load();
//   }, [apiUrl, id]);





//   const renderError = (f: string) => errors[f] && <p className="text-red-500 text-sm mt-1">{errors[f]}</p>;

//   // common input handler
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target as any;
//     setTask((prev) => ({
//       ...prev,
//       [name]: type === "number" ? Number(value) : value,
//     }));
//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   useEffect(() => {
//     if (!originalTask) return;

//     const updatedTask = normalize({
//       ...task,
//       oputputFormat: Array.isArray(task.oputputFormat)
//         ? task.oputputFormat
//         : (task.oputputFormat || "").split(","),
//       domains: task.domainDetails
//     });

//     const changed = getChangedFields(originalTask, updatedTask);

//     setIsChanged(Object.keys(changed).length > 0);
//   }, [task, originalTask]);



  
//   // const handleDomainAdd = () => {
//   //   const trimmed = domainInput.trim();
//   //   const newErrors: any = {};
//   //   if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
//   //     newErrors.domain = "Platform must start with http:// or https://";
//   //   }
//   //   if (!domainPlatform) newErrors.domainPlatform = "Domain Platform is required";

   

//   //   const INVALID_REMARK_REGEX = /[^a-zA-Z0-9\s.,-]/;
//   //   if (domainRemark && INVALID_REMARK_REGEX.test(domainRemark)) {
//   //     errors.domainRemark = "Special characters are not allowed in remark";
      
//   //   }

//   //   if (Object.keys(newErrors).length > 0) {
//   //     setErrors((prev) => ({ ...prev, ...newErrors }));
//   //     return;
//   //   }

    


//   //   const newDomain: DomainDetail = {
//   //     domain: trimmed,
//   //     typeOfPlatform: domainPlatform,
//   //     domainRemarks: domainRemark || "",
//   //   };

//   //   setTask((prev) => {
//   //     const domainsCopy = [...prev.domainDetails];
//   //     if (editingIndex !== null) {
//   //       domainsCopy[editingIndex] = newDomain;
//   //     } else {
//   //       domainsCopy.push(newDomain);
//   //     }
//   //     return { ...prev, domainDetails: domainsCopy };
//   //   });

//   //   // Clear input & reset editingIndex
//   //   setDomainInput("");
//   //   setDomainPlatform("");
//   //   setDomainRemark("");
//   //   setEditingIndex(null);
//   // };

//   const handleDomainAdd = () => {
//   const trimmed = domainInput.trim();
//   const newErrors: any = {};

//   if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
//     newErrors.domain = "Platform must start with http:// or https://";
//   }
//   if (!domainPlatform) newErrors.domainPlatform = "Domain Platform is required";

//   const INVALID_REMARK_REGEX = /[^a-zA-Z0-9\s.,-]/;
//   if (domainRemark && INVALID_REMARK_REGEX.test(domainRemark)) {
//     newErrors.domainRemark = "Special characters are not allowed in remark";
//   }

//   // ❗ STOP here if any validation fail
//   if (Object.keys(newErrors).length > 0) {
//     setErrors((prev) => ({ ...prev, ...newErrors }));
//     return;
//   }

//   const newDomain: DomainDetail = {
//     domain: trimmed,
//     typeOfPlatform: domainPlatform,
//     domainRemarks: domainRemark || "",
//   };

//   setTask((prev) => {
//     const domainsCopy = [...prev.domainDetails];
//     if (editingIndex !== null) {
//       domainsCopy[editingIndex] = newDomain;
//     } else {
//       domainsCopy.push(newDomain);
//     }
//     return { ...prev, domainDetails: domainsCopy };
//   });

//   // reset
//   setDomainInput("");
//   setDomainPlatform("");
//   setDomainRemark("");
//   setEditingIndex(null);
// };


//   const handleDomainEdit = (index: number) => {
//     const domain = task.domainDetails[index];
//     setDomainInput(domain.domain);
//     setDomainPlatform(domain.typeOfPlatform);
//     setDomainRemark(domain.domainRemarks || "");
//     setEditingIndex(index);
//   };


//   const handleDomainRemove = (index: number) => {
//     setTask((prev) => {
//       const copy = [...prev.domainDetails];
//       copy.splice(index, 1);
//       return { ...prev, domainDetails: copy };
//     });
//   };

//   const validateForm = () => {
//     const newErrors: { [k: string]: string } = {};
//     if (!task.title.trim()) newErrors.title = "Title is required";
//     if (!task.assignedTo) newErrors.assignedTo = "Assigned To is required";
//     if (!task.description.trim()) newErrors.description = "Description is required";
//     if (!task.typeOfDelivery) newErrors.typeOfDelivery = "Type of Delivery is required";
//     if (!task.mandatoryFields) newErrors.mandatoryFields = "Mandatory fields are required";
//     if (!task.frequency) newErrors.frequency = "Frequency is required";
//     if (!selectedFormats || selectedFormats.length === 0) newErrors.oputputFormat = "Please select at least one file format.";
//     if (!task.domainDetails || task.domainDetails.length === 0) newErrors.domain = "At least one platform entry is required";
//     if (task.sampleFileRequired && !task.requiredValumeOfSampleFile) newErrors.requiredValumeOfSampleFile = "Required volume is mandatory when sample file is required";
//     if (task.domainDetails && task.domainDetails.length > 0) {

//       const extractedDomains = task.domainDetails.map((d) => {
//         try {
//           const host = new URL(d.domain.trim()).hostname.toLowerCase();
//           return host.startsWith("www.") ? host.slice(4) : host;
//         } catch (e) {
//           return ""; // ignore invalid URLs, already validated earlier
//         }
//       });

//       const duplicates = extractedDomains.filter(
//         (name, index) => name && extractedDomains.indexOf(name) !== index
//       );

//       //remarks

//       if(domainRemark){
//         const INVALID_REMARK_REGEX = /[^a-zA-Z0-9\s.,-]/;
//         if (domainRemark && INVALID_REMARK_REGEX.test(domainRemark)) {
//           newErrors.domainRemark = "Special characters are not allowed in remark";
//         }
//       }

//       if (duplicates.length > 0) {
//         newErrors.domain = "Duplicate domain names are not allowed.";
//       }
//     }




//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const getChangedFields = (original: any, updated: any) => {
//     const changed: any = {};

//     const compare = (o: any, u: any, key: string) => {
//       if (Array.isArray(o) || Array.isArray(u)) {
//         if (JSON.stringify(o) !== JSON.stringify(u)) {
//           changed[key] = u;
//         }
//       } else if (typeof o === "object" && typeof u === "object") {
//         if (JSON.stringify(o) !== JSON.stringify(u)) {
//           changed[key] = u;
//         }
//       } else if (o !== u) {
//         changed[key] = u;
//       }
//     };

//     compare(original.title, updated.title, "title");
//     compare(
//       original.assignedTo?._id || original.assignedTo,
//       updated.assignedTo,
//       "assignedTo"
//     );

//     compare(original.description, updated.description, "description");
//     compare(original.typeOfDelivery, updated.typeOfDelivery, "typeOfDelivery");
//     compare(original.mandatoryFields, updated.mandatoryFields, "mandatoryFields");
//     compare(original.optionalFields, updated.optionalFields, "optionalFields");
//     compare(original.frequency, updated.frequency, "frequency");
//     compare(original.oputputFormat, updated.oputputFormat, "oputputFormat");
//     compare(original.domains, updated.domainDetails, "domains");
//     compare(original.inputUrls, updated.inputUrls, "inputUrls");
//     compare(original.clientSampleSchemaUrls, updated.clientSampleSchemaUrls, "clientSampleSchemaUrls");

//     // ✅ ADD THESE TWO
//     compare(original.sampleFileRequired, updated.sampleFileRequired, "sampleFileRequired");
//     compare(original.requiredValumeOfSampleFile, updated.requiredValumeOfSampleFile, "requiredValumeOfSampleFile");

//     return changed;
//   };


  



//   // Submit as new version via PUT /tasks/:id/reopen
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validateForm()) return;
//     if (!originalTask) return toast.error("Original task not loaded.");

//     setLoading(true);

//     try {
//       // Format domains into backend structure
//       const finalDomains = task.domainDetails.map((d) => ({
//         name: d.domain,
//         typeOfPlatform: d.typeOfPlatform,
//         domainRemarks: d.domainRemarks || "",
//       }));

//       // 🔥 Normalize values BEFORE compare
//       const updatedTask = {
//         ...task,
//         assignedTo: task.assignedTo,
//         // DB stores: "csv,excel"
//         oputputFormat: Array.isArray(task.oputputFormat)
//           ? task.oputputFormat.join(",")
//           : task.oputputFormat,

//         // DB expects string ENUM
//         requiredValumeOfSampleFile: String(task.requiredValumeOfSampleFile || ""),

//         domains: finalDomains,
//       };

//       const changedFields = getChangedFields(originalTask, updatedTask);

//       if (Object.keys(changedFields).length === 0) {
//         toast.info("No changes detected.");
//         setLoading(false);
//         return;
//       }

//       const formData = new FormData();

//       for (const key in changedFields) {

//         // send domains correctly
//         if (key === "domains") {
//           formData.append("domains", JSON.stringify(finalDomains));
//           continue;
//         }

//         // send oputputFormat as string
//         if (key === "oputputFormat") {
//           formData.append("oputputFormat", updatedTask.oputputFormat);
//           continue;
//         }

//         // send requiredValumeOfSampleFile as string
//         if (key === "requiredValumeOfSampleFile") {
//           formData.append("requiredValumeOfSampleFile", updatedTask.requiredValumeOfSampleFile);
//           continue;
//         }

//         // normal fields
//         if (
//           Array.isArray(changedFields[key]) ||
//           typeof changedFields[key] === "object"
//         ) {
//           formData.append(key, JSON.stringify(changedFields[key]));
//         } else {
//           formData.append(key, changedFields[key]);
//         }
//       }

//       const res = await fetch(`${apiUrl}/tasks/${id}/reopen`, {
//         method: "PUT",
//         credentials: "include",
//         body: formData,
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         toast.error(data.message || "Failed to save version");
//         return;
//       }

//       toast.success("Task reopened successfully!");
//       setTimeout(() => navigate("/TMS-operations/tasks"), 900);

//     } catch (error) {
//       toast.error("Unexpected error");
//     } finally {
//       setLoading(false);
//     }
//   };


//   // Helper to update single-element arrays for inputUrls and clientSampleSchemaUrls (as Create UI uses single-line inputs)
//   const handleSingleInputUrlChange = (value: string) => {
//     setTask((prev) => ({ ...prev, inputUrls: [value.trim()] }));
//   };


//   const handleSingleClientSampleSchemaUrlChange = (value: string) => {
//     setTask((prev) => ({ ...prev, clientSampleSchemaUrls: [value.trim()] }));
//   };

//   return (
//     <>
//       <PageBreadcrumb items={[{ title: "Home", path: "/TMS-operations/" }, { title: "Tasks", path: "/TMS-operations/tasks" }, { title: "Reopen Task" }]} />
//       <div className="min-h-screen w-full bg-white flex justify-center py-10 px-4">
//         <div className="w-full max-w-6xl p-8 rounded-2xl">
//           <ToastContainer
//             position="top-center"
//             autoClose={3000}
//             hideProgressBar={false}
//             newestOnTop={true}
//             closeOnClick
//             pauseOnHover
//             draggable
//             theme="colored"
//             style={{
//               position: "fixed",
//               top: "10px",
//               left: "50%",
//               transform: "translateX(-50%)",
//               zIndex: 99999
//             }}
//           />

//           <div className="ml-5">
//             <h1 className="text-3xl font-bold text-[#3C01AF]">Reopen Task</h1>
//             <p className="text-gray-600 mb-8">Modify fields and save as a new version</p>
//             {errors.form && <p className="text-red-500 text-center mb-4">{errors.form}</p>}
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-10">
//             {[
//               { id: 1, title: "Basic Information" },
//               { id: 2, title: "Platform Configuration" },
//               { id: 3, title: "Configuration Details" },
//               { id: 4, title: "Documents" },
//             ].map((section) => (
//               <div key={section.id} className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6">
//                 <div className="w-full bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-100 rounded-lg shadow-sm p-4 mb-6">
//                   <div className="flex items-center gap-3 ">
//                     <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-sm">
//                       {section.id}
//                     </div>
//                     <div>
//                       <h2 className="text-base font-semibold text-[#3C01AF] leading-tight">{section.title}</h2>
//                     </div>
//                   </div>
//                 </div>

//                 {section.id === 1 && (
//                   <div className="grid md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">Task Name <span className="text-red-500">*</span></label>
//                       <input type="text" name="title" value={task.title} onChange={handleChange} className="w-full border rounded-lg p-3" readOnly />
//                       {renderError("title")}
//                     </div> 

//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">Assigned To <span className="text-red-500">*</span></label>
//                       <select name="assignedTo" value={task.assignedTo} onChange={handleChange} className="w-full border rounded-lg p-3" disabled>
//                         <option value="" hidden >Select Assignee</option>
//                         {assignedToOptions.map((user) => (
//                           <option key={user._id} value={user._id}>{user.name}</option>
//                         ))}
//                       </select>
//                       {renderError("assignedTo")}
//                     </div>

//                     <div className="md:col-span-2">
//                       <label className="block text-gray-700 font-medium mb-2">Description <span className="text-red-500">*</span></label>
//                       <textarea name="description" value={task.description} onChange={handleChange} className="w-full border rounded-lg p-3 h-28" maxLength={200}/>
//                       <div className="text-right text-sm text-gray-500 mt-1">
//                         {task.description.length}/200 characters
//                       </div>
//                       {renderError("description")}
//                     </div>
//                   </div>
//                 )}

//                 {section.id === 2 && (
//                   <>
//                     <div className="flex flex-wrap gap-3 mb-3">
//                       <input type="text" value={domainInput} onChange={(e) => { setDomainInput(e.target.value); if (e.target.value) setErrors(prev => ({ ...prev, domain: "" })); }} placeholder="https://www.xyz.com/" className="flex-1 border rounded-lg p-3" />
//                       <select value={domainPlatform} onChange={(e) => { setDomainPlatform(e.target.value); if (e.target.value) setErrors(prev => ({ ...prev, domainPlatform: "" })); }} className="border rounded-lg p-3">
//                         <option value="" hidden>Select Platform Type</option>
//                         <option value="web">Web</option>
//                         <option value="app">App</option>
//                         <option value="both (app & web)">Both (App & Web)</option>
//                       </select>
//                       <input type="text" value={domainRemark} onChange={(e) => {setDomainRemark(e.target.value)
//                         if (e.target.value) {
                          
                          
//                             setErrors(prev => ({ ...prev, domainRemark: "" }));
                          
//                         }
//                       }
                      
//                     } placeholder="Remark (optional)" className="flex-1 border rounded-lg p-3" maxLength={100}/>
//                       <button type="button" onClick={handleDomainAdd} className="bg-[#3C01AF] hover:bg-blue-700 text-white px-5 py-2 rounded-lg"> {editingIndex !== null ? "Update" : "Add"}</button>
//                     </div>

//                     {task.domainDetails.length > 0 && (
//                       <div className="space-y-2">
//                         {task.domainDetails.map((d, i) => (
//                           <div key={i} className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
//                             <span className="text-sm font-medium text-gray-800 mb-2 sm:mb-0">{d.domain}</span>
//                             <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">{d.typeOfPlatform || "-"}</span>
//                             {d.domainRemarks && <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{d.domainRemarks}</span>}
//                             <div className="flex gap-2 mt-2 sm:mt-0">
//                               <button type="button" onClick={() => handleDomainEdit(i)} className="text-yellow-500 text-sm hover:text-yellow-700">✏️</button>
//                               <button type="button" onClick={() => handleDomainRemove(i)} className="text-red-500 text-sm hover:text-red-700">❌</button>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}


//                     {errors.domain && <p className="text-red-500 text-sm">{errors.domain}</p>}
//                     {errors.domainPlatform && <p className="text-red-500 text-sm">{errors.domainPlatform}</p>}
//                     {errors.domainRemark && (
//                       <p className="text-red-500 text-sm">{errors.domainRemark}</p>
//                     )}
//                   </>
//                 )}

//                 {section.id === 3 && (
//                   <div className="grid md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">Type of Delivery<span className="text-red-500">*</span></label>
//                       <select name="typeOfDelivery" value={task.typeOfDelivery} onChange={handleChange} className="w-full p-3 rounded-md border border-gray-300 text-gray-900">
//                         <option value="" hidden>Select Type</option>
//                         {DeliveryTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
//                       </select>
//                       {renderError("typeOfDelivery")}
//                     </div>

//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">Mandatory Fields<span className="text-red-500">*</span></label>
//                       <input type="text" name="mandatoryFields" value={task.mandatoryFields} onChange={handleChange} placeholder="Ex:-header 1 , header 2,..." className="w-full border rounded-lg p-3" />
//                       {renderError("mandatoryFields")}
//                     </div>

//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">Optional Fields </label>
//                       <input type="text" placeholder="Ex:-header 1 , header 2,..." name="optionalFields" value={task.optionalFields} onChange={handleChange} className="w-full border rounded-lg p-3" />
//                       {renderError("optionalFields")}
//                     </div>

//                     {/* <div>
//                       <label className="block text-gray-700 font-medium mb-2">Frequency <span className="text-red-500">*</span></label>
//                       <input type="text" name="frequency" placeholder="Ex:-Daily , Weekly,..." value={task.frequency} onChange={handleChange} className="w-full border rounded-lg p-3" />
//                       {renderError("frequency")}
//                     </div> */}

//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">
//                         Frequency <span className="text-red-500">*</span>
//                       </label>

//                       <select
//                         name="frequency"
//                         value={task.frequency}
//                         onChange={(e) => {
//                           handleChange(e); // keeps your existing handler logic for task state
//                           // clear frequency error immediately
//                           setErrors(prev => ({ ...prev, frequency: "" }));
//                         }}
//                         className="w-full border rounded-lg p-3 bg-white" 
//                       >
//                         <option value="" hidden>Select Frequency</option>
//                         <option value="Daily">Daily</option>
//                         <option value="Weekly">Weekly</option>
//                         <option value="Bi-Weekly">Bi-Weekly</option>
//                         <option value="Monthly">Monthly</option>
//                         <option value="Bi-Monthly">Bi-Monthly</option>
//                         <option value="Once-Off">Once-Off</option>
//                         <option value="Hourly">Hourly</option>
//                       </select>

//                       {renderError("frequency")}
//                     </div>

//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">Output Format <span className="text-red-500">*</span></label>
//                       <CreatableSelect
//                         isMulti
//                         options={formatOptions}
//                         name="oputputFormat"
//                         value={selectedFormats}
//                         onChange={(value) => {
//                           const formats = value as any[];
//                           setSelectedFormats(formats);
//                           setTask((prev) => ({ ...prev, oputputFormat: formats.map((f) => f.value) }));
//                           if (formats.length > 0) setErrors((prev) => ({ ...prev, oputputFormat: "" }));
//                         }}
//                         placeholder="Select or create file formats..."
//                         styles={{
//                           control: (base: any, state: any) => ({
//                             ...base,
//                             backgroundColor: "#ffffff",
//                             borderColor: state.isFocused ? "#3B82F6" : "#D1D5DB",
//                             boxShadow: state.isFocused ? "0 0 0 1px #3B82F6" : "none",
//                             "&:hover": { borderColor: "#3B82F6" },
//                           })
//                         }}
//                       />
//                       {renderError("oputputFormat")}
//                     </div>

//                     <div className="md:col-span-2 mt-3">
//                       <label className="flex items-center gap-2 text-gray-900">
//                         <input type="checkbox" checked={task.sampleFileRequired} onChange={(e) => setTask(prev => ({ ...prev, sampleFileRequired: e.target.checked }))} className="h-4 w-4" />
//                         Sample File Required?
//                       </label>
//                       {task.sampleFileRequired && (
//                         <div className="mt-3">
//                           <label className="block text-gray-700 font-medium mb-2">Required Volume <span className="text-red-500">*</span></label>
//                           <select name="requiredValumeOfSampleFile" value={String(task.requiredValumeOfSampleFile || "")} onChange={handleChange} className="w-full border rounded-lg p-3">
//                             <option value="">Select Volume</option>
//                             {["20", "50", "100", "500", "1000"].map((v) => <option key={v} value={v}>{v}</option>)}
//                           </select>
//                           {renderError("requiredValumeOfSampleFile")}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {section.id === 4 && (
//                   <div className="grid md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">Input Document URL/Input Keywords</label>
//                       <input type="text" name="inputUrls" value={task.inputUrls[0] || ""} onChange={(e) => handleSingleInputUrlChange(e.target.value)} className="w-full border rounded-lg p-3" />
//                       {renderError("inputUrls")}

//                     </div>

//                     <div>
//                       <label className="block text-gray-700 font-medium mb-2">Client Sample Schema Document URL </label>
//                       <input type="text" name="clientSampleSchemaUrls" value={task.clientSampleSchemaUrls[0] || ""} onChange={(e) => handleSingleClientSampleSchemaUrlChange(e.target.value)} className="w-full border rounded-lg p-3" />
//                       {renderError("clientSampleSchemaUrls")}

//                     </div>
//                   </div>
//                 )}

//               </div>
//             ))}

//             <div className="flex justify-end">
//              <button
//   type="submit"
//   disabled={!isChanged || loading}
//   className={`px-8 py-3 font-semibold rounded-lg text-white
//     ${!isChanged || loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#3C01AF] hover:bg-blue-700"}`}
// >
//   {loading ? "Saving..." : "Update"}
// </button>


//             </div>

//           </form>
//         </div>
//       </div>
//     </>
//   );
// };

// export default ReopenTask;

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { toast, ToastContainer } from "react-toastify";
import CreatableSelect from "react-select/creatable";
import "react-toastify/dist/ReactToastify.css";

interface DomainDetail {
  domain: string;
  typeOfPlatform: string;
  domainRemarks?: string;
}

interface TaskType {
  title: string;
  assignedTo: string;
  description: string;
  sampleFileRequired: boolean;
  requiredValumeOfSampleFile?: number | string | undefined;
  taskAssignedDate?: string;
  targetDate?: string;
  completeDate?: string;
  domainDetails: DomainDetail[];
  typeOfDelivery: string;
  mandatoryFields: string;
  optionalFields: string;
  frequency: string;
  RPM: number;
  oputputFormat: string[]; // array of format values
  status?: string;
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
  role?: string;
}

const ReopenTask: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const apiUrl = import.meta.env.VITE_API_URL || "";

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [assignedToOptions, setAssignedToOptions] = useState<UserOption[]>([]);

  // Local domain fields
  const [domainInput, setDomainInput] = useState("");
  const [domainPlatform, setDomainPlatform] = useState("");
  const [domainRemark, setDomainRemark] = useState("");

  const [task, setTask] = useState<TaskType>({
    title: "",
    assignedTo: "",
    description: "",
    sampleFileRequired: false,
    requiredValumeOfSampleFile: undefined,
    taskAssignedDate: "",
    targetDate: "",
    completeDate: "",
    domainDetails: [],
    typeOfDelivery: "",
    mandatoryFields: "",
    optionalFields: "",
    frequency: "",
    RPM:"",
    oputputFormat: [],
    status: "pending",
    sowFile: [],
    sowUrls: [],
    inputFile: [],
    inputUrls: [],
    clientSampleSchemaFiles: [],
    clientSampleSchemaUrls: [],
  });

  const [selectedFormats, setSelectedFormats] = useState<any[]>([]);
  const [originalTask, setOriginalTask] = useState<any>(null);


  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isChanged, setIsChanged] = useState(false);



  const DeliveryTypes = [
    { label: "API", value: "api" },
    { label: "Data as a Service", value: "data as a service" },
    { label: "Both (API & Data As A Service)", value: "both(api & data as a service)" },
  ];

  const formatOptions = [
    { label: "CSV", value: "csv" },
    { label: "JSON", value: "json" },
    { label: "Excel", value: "excel" },
    { label: "Parquet", value: "parquet" },
  ];

  const normalize = (task: any) => {
  return {
    ...task,
    // Normalize Output Format
    oputputFormat: Array.isArray(task.oputputFormat)
      ? task.oputputFormat
      : (task.oputputFormat || "").split(",").map((s: string) => s.trim()),

    // Normalize Domains (rename name → domain)
    domains: (task.domains || []).map((d: any) => ({
      domain: d.name || "",
      typeOfPlatform: d.typeOfPlatform || "",
      domainRemarks: d.domainRemarks || "",
    })),

    // Normalize inputUrls
    inputUrls: Array.isArray(task.inputUrls)
      ? task.inputUrls
      : task.inputUrls
        ? [task.inputUrls]
        : [""] ,

    // Normalize clientSampleSchemaUrls
    clientSampleSchemaUrls: Array.isArray(task.clientSampleSchemaUrls)
      ? task.clientSampleSchemaUrls
      : task.clientSampleSchemaUrls
        ? [task.clientSampleSchemaUrls]
        : [""],
  };
};



  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiUrl}/users/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        // keep TL & Manager similar to CreateTask
        setAssignedToOptions(data.filter((u: any) => u.role === "TL" || u.role === "Manager"));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    if (apiUrl) fetchUsers();
  }, [apiUrl]);


  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        const res = await fetch(`${apiUrl}/tasks/${id}/reopen-data`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        console.log("DATA",data);
        

        // setOriginalTask({
        //   ...data,
        //   assignedTo: data.assignedTo?._id || ""   // normalize
        // });
        setOriginalTask(normalize(data));



        setTask({
          title: data.title || "",
          assignedTo: data.assignedTo?._id || data.assignedTo || "",
          description: data.description || "",
          sampleFileRequired: !!data.sampleFileRequired,
          requiredValumeOfSampleFile: data.requiredValumeOfSampleFile || "",
          taskAssignedDate: data.taskAssignedDate ? data.taskAssignedDate.substring(0, 10) : "",
          targetDate: data.targetDate ? data.targetDate.substring(0, 10) : "",
          completeDate: data.completeDate || "",
          domainDetails: data.domains?.map((d: any) => ({
            domain: d.name,
            typeOfPlatform: d.typeOfPlatform,
            domainRemarks: d.domainRemarks,
          })) || [],
          typeOfDelivery: data.typeOfDelivery || "",
          mandatoryFields: data.mandatoryFields || "",
          optionalFields: data.optionalFields || "",
          frequency: data.frequency || "",
          RPM: data.RPM !== undefined && data.RPM !== null ? String(data.RPM) : "",


          oputputFormat: data.oputputFormat || [],
          status: data.status || "pending",
          sowFile: [],
          sowUrls: data.sowUrls || [],
          inputFile: [],
          inputUrls: data.inputUrls || [],
          clientSampleSchemaFiles: [],
          clientSampleSchemaUrls: data.clientSampleSchemaUrls || [],
        });

        setSelectedFormats(
          (typeof data.oputputFormat === "string"
            ? data.oputputFormat.split(",")
            : data.oputputFormat || []
          ).map((f: string) => ({
            label: f.toUpperCase(),
            value: f
          }))
        );

      } catch (err) {
        console.error("Failed to load task:", err);
      }
    };

    if (apiUrl) load();
  }, [apiUrl, id]);





  const renderError = (f: string) => errors[f] && <p className="text-red-500 text-sm mt-1">{errors[f]}</p>;

  // common input handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setTask((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  useEffect(() => {
    if (!originalTask) return;

    const updatedTask = normalize({
      ...task,
      oputputFormat: Array.isArray(task.oputputFormat)
        ? task.oputputFormat
        : (task.oputputFormat || "").split(","),
      domains: task.domainDetails
    });

    const changed = getChangedFields(originalTask, updatedTask);

    setIsChanged(Object.keys(changed).length > 0);
  }, [task, originalTask]);



  
  // const handleDomainAdd = () => {
  //   const trimmed = domainInput.trim();
  //   const newErrors: any = {};
  //   if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
  //     newErrors.domain = "Platform must start with http:// or https://";
  //   }
  //   if (!domainPlatform) newErrors.domainPlatform = "Domain Platform is required";

   

  //   const INVALID_REMARK_REGEX = /[^a-zA-Z0-9\s.,-]/;
  //   if (domainRemark && INVALID_REMARK_REGEX.test(domainRemark)) {
  //     errors.domainRemark = "Special characters are not allowed in remark";
      
  //   }

  //   if (Object.keys(newErrors).length > 0) {
  //     setErrors((prev) => ({ ...prev, ...newErrors }));
  //     return;
  //   }

    


  //   const newDomain: DomainDetail = {
  //     domain: trimmed,
  //     typeOfPlatform: domainPlatform,
  //     domainRemarks: domainRemark || "",
  //   };

  //   setTask((prev) => {
  //     const domainsCopy = [...prev.domainDetails];
  //     if (editingIndex !== null) {
  //       domainsCopy[editingIndex] = newDomain;
  //     } else {
  //       domainsCopy.push(newDomain);
  //     }
  //     return { ...prev, domainDetails: domainsCopy };
  //   });

  //   // Clear input & reset editingIndex
  //   setDomainInput("");
  //   setDomainPlatform("");
  //   setDomainRemark("");
  //   setEditingIndex(null);
  // };

  const handleDomainAdd = () => {
  const trimmed = domainInput.trim();
  const newErrors: any = {};

  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    newErrors.domain = "Platform must start with http:// or https://";
  }
  if (!domainPlatform) newErrors.domainPlatform = "Domain Platform is required";

  const INVALID_REMARK_REGEX = /[^a-zA-Z0-9\s.,-]/;
  if (domainRemark && INVALID_REMARK_REGEX.test(domainRemark)) {
    newErrors.domainRemark = "Special characters are not allowed in remark";
  }

  // ❗ STOP here if any validation fail
  if (Object.keys(newErrors).length > 0) {
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return;
  }

  const newDomain: DomainDetail = {
    domain: trimmed,
    typeOfPlatform: domainPlatform,
    domainRemarks: domainRemark || "",
  };

  setTask((prev) => {
    const domainsCopy = [...prev.domainDetails];
    if (editingIndex !== null) {
      domainsCopy[editingIndex] = newDomain;
    } else {
      domainsCopy.push(newDomain);
    }
    return { ...prev, domainDetails: domainsCopy };
  });

  // reset
  setDomainInput("");
  setDomainPlatform("");
  setDomainRemark("");
  setEditingIndex(null);
};


  const handleDomainEdit = (index: number) => {
    const domain = task.domainDetails[index];
    setDomainInput(domain.domain);
    setDomainPlatform(domain.typeOfPlatform);
    setDomainRemark(domain.domainRemarks || "");
    setEditingIndex(index);
  };


  const handleDomainRemove = (index: number) => {
    setTask((prev) => {
      const copy = [...prev.domainDetails];
      copy.splice(index, 1);
      return { ...prev, domainDetails: copy };
    });
  };

  const validateForm = () => {
    const newErrors: { [k: string]: string } = {};
    if (!task.title.trim()) newErrors.title = "Title is required";
    if (!task.assignedTo) newErrors.assignedTo = "Assigned To is required";
    if (!task.description.trim()) newErrors.description = "Description is required";
    if (!task.typeOfDelivery) newErrors.typeOfDelivery = "Type of Delivery is required";
    if (!task.mandatoryFields) newErrors.mandatoryFields = "Mandatory fields are required";
    if (!task.frequency) newErrors.frequency = "Frequency is required";
      

    if (task.frequency === "RPM") {
      if (!task.RPM || String(task.RPM).trim() === "") {
        newErrors.rpm = "RPM value is required when frequency is RPM";
      } else if (isNaN(Number(task.RPM)) || Number(task.RPM) <= 0) {
        newErrors.rpm = "RPM must be a positive number";
      }
    }

    if (!selectedFormats || selectedFormats.length === 0) newErrors.oputputFormat = "Please select at least one file format.";
    if (!task.domainDetails || task.domainDetails.length === 0) newErrors.domain = "At least one platform entry is required";
    if (task.sampleFileRequired && !task.requiredValumeOfSampleFile) newErrors.requiredValumeOfSampleFile = "Required volume is mandatory when sample file is required";
    if (task.domainDetails && task.domainDetails.length > 0) {

      const extractedDomains = task.domainDetails.map((d) => {
        try {
          const host = new URL(d.domain.trim()).hostname.toLowerCase();
          return host.startsWith("www.") ? host.slice(4) : host;
        } catch (e) {
          return ""; // ignore invalid URLs, already validated earlier
        }
      });

      const duplicates = extractedDomains.filter(
        (name, index) => name && extractedDomains.indexOf(name) !== index
      );

      //remarks

      if(domainRemark){
        const INVALID_REMARK_REGEX = /[^a-zA-Z0-9\s.,-]/;
        if (domainRemark && INVALID_REMARK_REGEX.test(domainRemark)) {
          newErrors.domainRemark = "Special characters are not allowed in remark";
        }
      }

      if (duplicates.length > 0) {
        newErrors.domain = "Duplicate domain names are not allowed.";
      }
    }




    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getChangedFields = (original: any, updated: any) => {
    const changed: any = {};

    const compare = (o: any, u: any, key: string) => {
      if (Array.isArray(o) || Array.isArray(u)) {
        if (JSON.stringify(o) !== JSON.stringify(u)) {
          changed[key] = u;
        }
      } else if (typeof o === "object" && typeof u === "object") {
        if (JSON.stringify(o) !== JSON.stringify(u)) {
          changed[key] = u;
        }
      } else if (o !== u) {
        changed[key] = u;
      }
    };

    compare(original.title, updated.title, "title");
    compare(
      original.assignedTo?._id || original.assignedTo,
      updated.assignedTo,
      "assignedTo"
    );

    compare(original.description, updated.description, "description");
    compare(original.typeOfDelivery, updated.typeOfDelivery, "typeOfDelivery");
    compare(original.mandatoryFields, updated.mandatoryFields, "mandatoryFields");
    compare(original.optionalFields, updated.optionalFields, "optionalFields");
    compare(original.frequency, updated.frequency, "frequency");
    compare(original.RPM, updated.RPM, "RPM");
    compare(original.oputputFormat, updated.oputputFormat, "oputputFormat");
    compare(original.domains, updated.domainDetails, "domains");
    compare(original.inputUrls, updated.inputUrls, "inputUrls");
    compare(original.clientSampleSchemaUrls, updated.clientSampleSchemaUrls, "clientSampleSchemaUrls");

    // ✅ ADD THESE TWO
    compare(original.sampleFileRequired, updated.sampleFileRequired, "sampleFileRequired");
    compare(original.requiredValumeOfSampleFile, updated.requiredValumeOfSampleFile, "requiredValumeOfSampleFile");

    return changed;
  };


  



  // Submit as new version via PUT /tasks/:id/reopen
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!originalTask) return toast.error("Original task not loaded.");

    setLoading(true);

    try {
      // Format domains into backend structure
      const finalDomains = task.domainDetails.map((d) => ({
        name: d.domain,
        typeOfPlatform: d.typeOfPlatform,
        domainRemarks: d.domainRemarks || "",
      }));

      // 🔥 Normalize values BEFORE compare
      const updatedTask = {
        ...task,
        assignedTo: task.assignedTo,
        // DB stores: "csv,excel"
        oputputFormat: Array.isArray(task.oputputFormat)
          ? task.oputputFormat.join(",")
          : task.oputputFormat,

        // DB expects string ENUM
        requiredValumeOfSampleFile: String(task.requiredValumeOfSampleFile || ""),

        domains: finalDomains,
      };

      const changedFields = getChangedFields(originalTask, updatedTask);

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected.");
        setLoading(false);
        return;
      }

      const formData = new FormData();

      for (const key in changedFields) {

        // send domains correctly
        if (key === "domains") {
          formData.append("domains", JSON.stringify(finalDomains));
          continue;
        }

        // send oputputFormat as string
        if (key === "oputputFormat") {
          formData.append("oputputFormat", updatedTask.oputputFormat);
          continue;
        }

        // send requiredValumeOfSampleFile as string
        if (key === "requiredValumeOfSampleFile") {
          formData.append("requiredValumeOfSampleFile", updatedTask.requiredValumeOfSampleFile);
          continue;
        }

        // normal fields
        if (
          Array.isArray(changedFields[key]) ||
          typeof changedFields[key] === "object"
        ) {
          formData.append(key, JSON.stringify(changedFields[key]));
        } else {
          formData.append(key, changedFields[key]);
        }
      }

      const res = await fetch(`${apiUrl}/tasks/${id}/reopen`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to save version");
        return;
      }

      toast.success("Task reopened successfully!");
      setTimeout(() => navigate("/TMS-operations/tasks"), 900);

    } catch (error) {
      toast.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };


  // Helper to update single-element arrays for inputUrls and clientSampleSchemaUrls (as Create UI uses single-line inputs)
  const handleSingleInputUrlChange = (value: string) => {
    setTask((prev) => ({ ...prev, inputUrls: [value.trim()] }));
  };


  const handleSingleClientSampleSchemaUrlChange = (value: string) => {
    setTask((prev) => ({ ...prev, clientSampleSchemaUrls: [value.trim()] }));
  };

  return (
    <>
      <PageBreadcrumb items={[{ title: "Home", path: "/TMS-R&D/" }, { title: "Tasks", path: "/TMS-R&D/tasks" }, { title: "Reopen Task" }]} />
      <div className="min-h-screen w-full bg-white flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl p-8 rounded-2xl">
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
            <h1 className="text-3xl font-bold text-[#3C01AF]">Reopen Task</h1>
            <p className="text-gray-600 mb-8">Modify fields and save as a new version</p>
            {errors.form && <p className="text-red-500 text-center mb-4">{errors.form}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {[
              { id: 1, title: "Basic Information" },
              { id: 2, title: "Platform Configuration" },
              { id: 3, title: "Configuration Details" },
              { id: 4, title: "Documents" },
            ].map((section) => (
              <div key={section.id} className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6">
                <div className="w-full bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-100 rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-center gap-3 ">
                    <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-sm">
                      {section.id}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#3C01AF] leading-tight">{section.title}</h2>
                    </div>
                  </div>
                </div>

                {section.id === 1 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Task Name <span className="text-red-500">*</span></label>
                      <input type="text" name="title" value={task.title} onChange={handleChange} className="w-full border rounded-lg p-3" readOnly />
                      {renderError("title")}
                    </div> 

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Assigned To <span className="text-red-500">*</span></label>
                      <select name="assignedTo" value={task.assignedTo} onChange={handleChange} className="w-full border rounded-lg p-3" disabled>
                        <option value="" hidden >Select Assignee</option>
                        {assignedToOptions.map((user) => (
                          <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                      </select>
                      {renderError("assignedTo")}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">Description <span className="text-red-500">*</span></label>
                      <textarea name="description" value={task.description} onChange={handleChange} className="w-full border rounded-lg p-3 h-28" />
                      
                      {renderError("description")}
                    </div>
                  </div>
                )}

                {section.id === 2 && (
                  <>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <input type="text" value={domainInput} onChange={(e) => { setDomainInput(e.target.value); if (e.target.value) setErrors(prev => ({ ...prev, domain: "" })); }} placeholder="https://www.xyz.com/" className="flex-1 border rounded-lg p-3" />
                      <select value={domainPlatform} onChange={(e) => { setDomainPlatform(e.target.value); if (e.target.value) setErrors(prev => ({ ...prev, domainPlatform: "" })); }} className="border rounded-lg p-3">
                        <option value="" hidden>Select Platform Type</option>
                        <option value="web">Web</option>
                        <option value="app">App</option>
                        <option value="both (app & web)">Both (App & Web)</option>
                      </select>
                      <input type="text" value={domainRemark} onChange={(e) => {setDomainRemark(e.target.value)
                        if (e.target.value) {
                          setErrors(prev => ({ ...prev, domainRemark: "" }));
                        }
                      }
                      
                    } placeholder="Remark (optional)" className="flex-1 border rounded-lg p-3" maxLength={100}/>
                      <button type="button" onClick={handleDomainAdd} className="bg-[#3C01AF] hover:bg-blue-700 text-white px-5 py-2 rounded-lg"> {editingIndex !== null ? "Update" : "Add"}</button>
                    </div>

                    {task.domainDetails.length > 0 && (
                      <div className="space-y-2">
                        {task.domainDetails.map((d, i) => (
                          <div key={i} className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                            <span
  className="text-sm font-medium text-gray-800 mb-2 sm:mb-0
             max-w-[160px] truncate inline-block"
  title={d.domain}  // full text on hover
>
  {d.domain}
</span>

                            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">{d.typeOfPlatform || "-"}</span>
                            {d.domainRemarks && <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{d.domainRemarks}</span>}
                            <div className="flex gap-2 mt-2 sm:mt-0">
                              <button type="button" onClick={() => handleDomainEdit(i)} className="text-yellow-500 text-sm hover:text-yellow-700">✏️</button>
                              <button type="button" onClick={() => handleDomainRemove(i)} className="text-red-500 text-sm hover:text-red-700">❌</button>
                            </div>
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
                      <select name="typeOfDelivery" value={task.typeOfDelivery} onChange={handleChange} className="w-full p-3 rounded-md border border-gray-300 text-gray-900">
                        <option value="" hidden>Select Type</option>
                        {DeliveryTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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

                    {/* <div>
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

                          if (e.target.value !== "RPM") {
      setTask(prev => ({ ...prev, RPM: "" }));
    }
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
                        <option value="RPM">Request-Per-Minute</option>
                      </select>

                      {renderError("frequency")}
                    </div> */}
                    <div>
  <label className="block text-gray-700 font-medium mb-2">
    Frequency <span className="text-red-500">*</span>
  </label>

  <CreatableSelect
  isMulti
  name="frequency"

  // Display: convert comma string → array just for UI
  value={
    task.frequency
      ? task.frequency.split(",").map((f) => ({ label: f, value: f }))
      : []
  }

  onChange={(selected) => {
    const values = selected.map(o => o.value);

    // Save as string (DB format)
    const finalString = values.join(",");

    setTask(prev => ({
      ...prev,
      frequency: finalString
    }));

    // RPM clearing logic
    if (!values.includes("RPM")) {
      setTask(prev => ({ ...prev, RPM: "" }));
    }

    // clear error
    setErrors(prev => ({ ...prev, frequency: "" }));
  }}

  options={[
    { value: "Daily", label: "Daily" },
    { value: "Weekly", label: "Weekly" },
    { value: "Bi-Weekly", label: "Bi-Weekly" },
    { value: "Monthly", label: "Monthly" },
    { value: "Bi-Monthly", label: "Bi-Monthly" },
    { value: "Once-Off", label: "Once-Off" },
    { value: "Hourly", label: "Hourly" },
    { value: "RPM", label: "Request-Per-Minute" },
  ]}

  placeholder="Select frequency..."
/>


  {renderError("frequency")}
</div>


                    {/* {task.frequency === "RPM" && (
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">RPM <span className="text-red-500">*</span></label>
                        <input type="number" name="RPM" value={task.RPM} onChange={handleChange} placeholder="Enter RPM" className="w-full border rounded-lg p-3 [appearance:textfield] 
             [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none" />
                        {renderError("RPM")}
                      </div>
                    )} */}
{task.frequency.includes("RPM") && (
  <div>
    <label className="block text-gray-700 font-medium mb-2">
      RPM <span className="text-red-500">*</span>
    </label>

    <input
      type="number"
      name="RPM"
      value={task.RPM}
      onChange={handleChange}
      className="w-full border rounded-lg p-3"
      placeholder="Enter RPM"
    />

    {renderError("RPM")}
  </div>
)}




                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Output Format <span className="text-red-500">*</span></label>
                      <CreatableSelect
                        isMulti
                        options={formatOptions}
                        name="oputputFormat"
                        value={selectedFormats}
                        onChange={(value) => {
                          const formats = value as any[];
                          setSelectedFormats(formats);
                          setTask((prev) => ({ ...prev, oputputFormat: formats.map((f) => f.value) }));
                          if (formats.length > 0) setErrors((prev) => ({ ...prev, oputputFormat: "" }));
                        }}
                        placeholder="Select or create file formats..."
                        styles={{
                          control: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: "#ffffff",
                            borderColor: state.isFocused ? "#3B82F6" : "#D1D5DB",
                            boxShadow: state.isFocused ? "0 0 0 1px #3B82F6" : "none",
                            "&:hover": { borderColor: "#3B82F6" },
                          })
                        }}
                      />
                      {renderError("oputputFormat")}
                    </div>

                    <div className="md:col-span-2 mt-3">
                      <label className="flex items-center gap-2 text-gray-900">
                        <input type="checkbox" checked={task.sampleFileRequired} onChange={(e) => setTask(prev => ({ ...prev, sampleFileRequired: e.target.checked }))} className="h-4 w-4" />
                        Sample File Required?
                      </label>
                      {task.sampleFileRequired && (
                        <div className="mt-3">
                          <label className="block text-gray-700 font-medium mb-2">Required Volume <span className="text-red-500">*</span></label>
                          <select name="requiredValumeOfSampleFile" value={String(task.requiredValumeOfSampleFile || "")} onChange={handleChange} className="w-full border rounded-lg p-3">
                            <option value="">Select Volume</option>
                            {["20", "50", "100", "500", "1000"].map((v) => <option key={v} value={v}>{v}</option>)}
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
                      <input type="text" name="inputUrls" value={task.inputUrls[0] || ""} onChange={(e) => handleSingleInputUrlChange(e.target.value)} className="w-full border rounded-lg p-3" />
                      {renderError("inputUrls")}

                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Client Sample Schema Document URL </label>
                      <input type="text" name="clientSampleSchemaUrls" value={task.clientSampleSchemaUrls[0] || ""} onChange={(e) => handleSingleClientSampleSchemaUrlChange(e.target.value)} className="w-full border rounded-lg p-3" />
                      {renderError("clientSampleSchemaUrls")}

                    </div>
                  </div>
                )}

              </div>
            ))}

            <div className="flex justify-end">
             <button
  type="submit"
  disabled={!isChanged || loading}
  className={`px-8 py-3 font-semibold rounded-lg text-white
    ${!isChanged || loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#3C01AF] hover:bg-blue-700"}`}
>
  {loading ? "Saving..." : "Reopen"}
</button>


            </div>

          </form>
        </div>
      </div>
    </>
  );
};

export default ReopenTask;

