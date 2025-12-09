// src/pages/EditSubmit.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CreatableSelect from "react-select/creatable";
import { format } from "date-fns";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getNames } from "country-list";
import { Trash2, Link } from "lucide-react";


interface Submission {
  [key: string]: any;
  platform?: string;
  domain?: string;
  country: string[];
  feasibleFor?: string;
  approxVolume?: string;
  method?: string;
  userLogin?: boolean | null;
  feasible?: boolean | null;
  loginType?: string;
  credentials?: string;
  proxyUsed?: boolean | null;
  proxyName?: string;
  perRequestCredit?: string;
  totalRequest?: string;
  lastCheckedDate?: string;
  complexity?: string;
  githubLink?: string;
  // new files uploaded in edit
  newOutputFiles?: File[];
  // existing files stored on server
  existingOutputFiles?: string[];
  outputUrls?: string[];
  remark?: string;
  apiName?: string;
  sowUrl?: string;
  outputUrl?: string;
}

const EditSubmit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const domainFromUrl = new URLSearchParams(location.search).get("domain") || "";

  const apiUrl = import.meta.env.VITE_API_URL;
  const today = new Date();
  const allCountries = getNames().map((name) => ({ value: name, label: name }));

  const allowedExtensions = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "json",
  ];

  const isValidDocumentUrl = (url: string) => {
    const fileExtensionPattern = new RegExp(
      `^https?:\\/\\/.*\\.(${allowedExtensions.join("|")})(\\?.*)?$`,
      "i"
    );
    const googleDocsPattern = new RegExp(
      "^https?:\\/\\/docs\\.google\\.com\\/(document|spreadsheets|presentation)\\/d\\/.*$",
      "i"
    );
    const googleDrivePattern = new RegExp(
      "^https?:\\/\\/drive\\.google\\.com\\/(file|open)\\/d\\/.*$",
      "i"
    );

    return (
      fileExtensionPattern.test(url) ||
      googleDocsPattern.test(url) ||
      googleDrivePattern.test(url)
    );
  };

  const [submission, setSubmission] = useState<Submission>({
    platform: "",
    userLogin: null,
    feasible: null,
    loginType: "",
    credentials: "",
    domain: domainFromUrl || "",
    country: [],
    feasibleFor: "",
    approxVolume: "",
    method: "",
    apiName: "",
    proxyType: "",
    proxyUsed: null,
    proxyName: "",
    perRequestCredit: "",
    totalRequest: "",
    lastCheckedDate: format(today, "yyyy-MM-dd"),
    complexity: "Medium",
    githubLink: "",
    newOutputFiles: [],
    existingOutputFiles: [],
    outputUrls: [],
    remark: "",
    sowUrl: "",
  });

  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [taskLoading, setTaskLoading] = useState<boolean>(true);
  const [method, setMethod] = useState<string>("");

  // Prefill data: fetch task and domain submission
  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;
      try {
        setTaskLoading(true);
        const res = await fetch(`${apiUrl}/tasks/${id}`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch task");
        }
        const data = await res.json();
        console.log(data);

        const task = Array.isArray(data) ? data[0] : data;
        setTaskDetails(task);
        const domainObj = task?.domains?.find(
          (d: any) => d.name?.toLowerCase() === domainFromUrl?.toLowerCase()
        );
        let domainSubmission = null;

        if (domainObj) {
          domainSubmission =
            domainObj.submission ||
            (task.submissions && task.submissions[domainObj.name]) ||
            null;
        }

        if (domainSubmission) {
          const s = domainSubmission;
          setSubmission((prev) => ({
            ...prev,
            ...s,
            domain: domainFromUrl || prev.domain,
            lastCheckedDate: s.lastCheckedDate ? s.lastCheckedDate.slice(0, 10) : prev.lastCheckedDate,
            existingOutputFiles: Array.isArray(s.outputFiles) ? s.outputFiles : s.outputFiles ? [s.outputFiles] : [],
            outputUrls: Array.isArray(s.outputUrls) ? s.outputUrls : s.outputUrls ? [s.outputUrls] : [],
            country: Array.isArray(s.country) ? s.country : s.country ? [s.country] : [],

            // 🎯 CRITICAL FIX: Convert string values to boolean/null
            feasible: s.feasible === "true" ? true : s.feasible === "false" ? false : null,
            userLogin: s.userLogin === "true" ? true : s.userLogin === "false" ? false : null,
            proxyUsed: s.proxyUsed === "true" ? true : s.proxyUsed === "false" ? false : null,
          }));
          setMethod(s.method || "");
        } else {
          setSubmission((prev) => ({ ...prev, domain: domainFromUrl || prev.domain }));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load task/submission");
      } finally {
        setTaskLoading(false);
      }
    };

    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, domainFromUrl]);

  // generic change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const name = e.target.name;
    const val: any = (e.target as HTMLInputElement).type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : e.target.value;

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmission((prev) => ({ ...prev, [name]: val }));
  };

  // new files selected by user
  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSubmission((prev) => ({
        ...prev,
        newOutputFiles: [...(prev.newOutputFiles || []), ...files],
      }));
    }
  };

  // toggle keep/remove existing file
  const toggleKeepExistingFile = (filePath: string) => {
    setSubmission((prev) => {
      const keep = prev.existingOutputFiles || [];
      if (keep.includes(filePath)) {
        return { ...prev, existingOutputFiles: keep.filter((f) => f !== filePath) };
      } else {
        return { ...prev, existingOutputFiles: [...keep, filePath] };
      }
    });
  };

  const buildFileUrl = (fileData?: string | { path?: string }): string => {
    if (!fileData) return "";
    const filePath = typeof fileData === "string" ? fileData : fileData.path || "";
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    const base = apiUrl.replace(/\/api$/, "");
    return `${base}/${filePath.replace(/\\/g, "/")}`;
  };

  const removeNewFileAt = (index: number) => {
    setSubmission((prev) => {
      const arr = [...(prev.newOutputFiles || [])];
      arr.splice(index, 1);
      return { ...prev, newOutputFiles: arr };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!submission.domain) newErrors.domain = "Domain is required.";
    if (!submission.country || submission.country.length === 0) newErrors.country = "Country is required.";
    if (!submission.approxVolume) newErrors.approxVolume = "Approx Volume is required.";
    if (!submission.method) newErrors.method = "Method is required.";
    if (!submission.lastCheckedDate) newErrors.lastCheckedDate = "Last Checked Date is required.";
    if (!submission.complexity) newErrors.complexity = "Complexity is required.";

    if (submission.userLogin && !submission.loginType) newErrors.loginType = "Please select a login type.";
    if (submission.userLogin === null) newErrors.userLogin = "Please select login Yes or No.";

    if (submission.feasible === null) newErrors.feasible = "Please select feasible Yes or No.";

    if (submission.proxyUsed === null || submission.proxyUsed === undefined) newErrors.proxyUsed = "Please specify if proxy is used.";

    if (submission.proxyUsed) {
      if (!submission.proxyName) newErrors.proxyName = "Proxy Name is required.";
      if (!submission.perRequestCredit) newErrors.perRequestCredit = "Per Request Credit is required.";
      if (!submission.totalRequest) newErrors.totalRequest = "Total Request is required.";
    }

    const hasAnyFileOrUrl =
      (submission.existingOutputFiles && submission.existingOutputFiles.length > 0) ||
      (submission.newOutputFiles && submission.newOutputFiles.length > 0) ||
      (submission.outputUrls && submission.outputUrls[0]);
    if (!hasAnyFileOrUrl) {
      newErrors.outputUrls = "Upload a file (keep or add) or provide an output document URL.";
    }

    if (submission.outputUrls?.[0] && !isValidDocumentUrl(submission.outputUrls[0])) {
      newErrors.outputUrls = "Invalid document URL format.";
    }

    if (submission.githubLink) {
      const githubPattern = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
      if (!githubPattern.test(submission.githubLink.trim())) newErrors.githubLink = "Enter a valid GitHub repository URL.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handle update (POST /tasks/:id/edit-submission with files)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const formData = new FormData();

      // domainName
      formData.append("domainName", submission.domain || domainFromUrl || "");

      // domainOutputUrls: JSON by domain
      formData.append(
        "domainOutputUrls",
        JSON.stringify({ [submission.domain || domainFromUrl || ""]: submission.outputUrls || [] })
      );

      // existingOutputFiles: JSON by domain (kept list)
      formData.append(
        "existingOutputFiles",
        JSON.stringify({ [submission.domain || domainFromUrl || ""]: submission.existingOutputFiles || [] })
      );

      // other fields
      formData.append("country", JSON.stringify(submission.country || []));
      formData.append("approxVolume", submission.approxVolume || "");
      formData.append("method", submission.method || "");
      formData.append("apiName", submission.apiName || "");
      formData.append("feasible", submission.feasible === true ? "true" : "false");
      formData.append("userLogin", submission.userLogin ? "true" : "false");
      formData.append("loginType", submission.loginType || "");
      formData.append("credentials", submission.credentials || "");
      formData.append("proxyUsed", submission.proxyUsed ? "true" : "false");
      formData.append("proxyName", submission.proxyName || "");
      formData.append("perRequestCredit", submission.perRequestCredit || "");
      formData.append("totalRequest", submission.totalRequest || "");
      formData.append("lastCheckedDate", submission.lastCheckedDate || "");
      formData.append("complexity", submission.complexity || "");
      formData.append("githubLink", submission.githubLink || "");
      formData.append("remark", submission.remark || "");
      formData.append("feasibleFor", submission.feasibleFor || "");
      formData.append("platform", submission.platform || "");

      // append new files under 'newOutputFiles' (controller expects this)
      (submission.newOutputFiles || []).forEach((file: File) => {
        formData.append("newOutputFiles", file);
      });

      // post to edit-submission
      const res = await fetch(`${apiUrl}/tasks/${id}/edit-submission`, {
        method: "POST", // your router uses POST
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Failed to update submission";
        try {
          const json = await res.json();
          message = json.message || json.error || JSON.stringify(json);
        } catch {
          const t = await res.text();
          message = t || message;
        }
        toast.error("❌ " + message);
        setLoading(false);
        return;
      }

      toast.success("✅ Submission updated successfully!");
      setTimeout(() => navigate("/TMS-operations/tasks"), 1500);
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error("❌ Update failed: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const renderError = (key: string) => errors[key] && <p className="text-red-500 text-sm mt-1">{errors[key]}</p>;

  if (taskLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const sections = [
    { id: 1, title: "Basic Information" },
    { id: 2, title: "Platform Configuration" },
    { id: 3, title: "Documents" },
  ];

  return (
    <>

      <div className="min-h-screen w-full flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl bg-white   p-8">

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

          <div className=" mb-6">
            <h1 className="text-3xl font-bold text-[#3C01AF] mb-2">Edit Submission</h1>
            <p className="text-gray-600">Update the submission details for the domain</p>
          </div>

          

          <form onSubmit={handleUpdate} className="space-y-8">
            {sections.map((section) => (
              <div key={section.id} className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6">
                <div className="w-full bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-sm">{section.id}</div>
                    <div>
                      <h2 className="text-base font-semibold text-[#3C01AF] leading-tight">{section.title}</h2>
                    </div>
                  </div>
                </div>

                {section.id === 1 && (
                  <div className="grid md:grid-cols-2 gap-4 ">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Platform</label>
                      <input
                        type="text"
                        value={submission.domain || (taskDetails?.domains ? taskDetails.domains.map((d: any) => d.name).join(", ") : "")}
                        readOnly
                        placeholder="Domain"
                        className="w-full rounded-lg border border-gray-200 bg-gray-100 p-3 text-gray-800 cursor-not-allowed"
                      />
                      {renderError("domain")}
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-gray-700 font-medium mb-2">Is Feasible? <span className="text-red-500">*</span></label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={submission.feasible === true}
                            onChange={() => {
                              setErrors((prev) => ({ ...prev, feasible: "" }));
                              setSubmission((prev) => ({ ...prev, feasible: prev.feasible === true ? null : true }));
                            }}
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={submission.feasible === false}
                            onChange={() => {
                              setErrors((prev) => ({ ...prev, feasible: "" }));
                              setSubmission((prev) => ({ ...prev, feasible: prev.feasible === false ? null : false }));
                            }}
                          />
                          No
                        </label>
                      </div>
                      {renderError("feasible")}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Country <span className="text-red-500">*</span></label>
                      <CreatableSelect
                        isMulti
                        options={allCountries}
                        name="country"
                        value={(submission.country || []).map((c: string) => ({ value: c, label: c }))}
                        onChange={(selected) => {
                          setErrors((prev) => ({ ...prev, country: "" }));
                          setSubmission((prev) => ({ ...prev, country: selected ? (selected as any[]).map((c) => c.value) : [] }));
                        }}
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
                        placeholder="Search or select countries..."
                      />
                      {renderError("country")}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Approx Volume <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="approxVolume"
                        value={submission.approxVolume || ""}
                        onChange={handleChange}
                        placeholder="e.g. 45000 or 4M or N/A"
                        className="w-full rounded-lg border border-gray-200 p-3 text-gray-800"
                      />
                      <p className="text-xs text-gray-400 mt-1">Start with digits or enter 'N/A'</p>
                      {renderError("approxVolume")}
                    </div>
                  </div>
                )}

                {section.id === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Method <span className="text-red-500">*</span></label>
                      <select
                        name="method"
                        value={submission.method || ""}
                        onChange={(e) => {
                          handleChange(e);
                          setMethod(e.target.value);
                        }}
                        className="w-full border border-gray-300 rounded-lg p-3"
                      >
                        <option value="" hidden>Select Method</option>
                        <option value="Browser Automation">Browser Automation</option>
                        <option value="Request">Request</option>
                        <option value="Semi Automation">Semi Automation</option>
                        <option value="third-party-api">Third-Party API</option>
                      </select>
                      {renderError("method")}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Complexity</label>
                      <select name="complexity" value={submission.complexity || "Medium"} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3">
                        <option value="Low">🟢 Low</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="High">🟠 High</option>
                        <option value="Very High">🔴 Very High</option>
                      </select>
                      {renderError("complexity")}
                    </div>

                    {submission.method === "third-party-api" && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">API Name</label>
                        <input type="text" name="apiName" value={submission.apiName || ""} onChange={handleChange} placeholder="Enter API Name" className="w-full border border-gray-300 rounded-lg p-3" />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Login Required? <span className="text-red-500">*</span>
                      </label>

                      <div className="flex items-center gap-6 mt-2">
                        {/* YES */}
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={submission.userLogin === true}
                            onChange={() => {
                              setSubmission((prev) => ({
                                ...prev,
                                userLogin: prev.userLogin === true ? null : true,
                                loginType: "",
                              }));
                              setErrors((e) => ({ ...e, userLogin: "" })); // 🔥 Remove validation
                            }}
                          />
                          Yes
                        </label>

                        {/* NO */}
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={submission.userLogin === false}
                            onChange={() => {
                              setSubmission((prev) => ({
                                ...prev,
                                userLogin: prev.userLogin === false ? null : false,
                                loginType: "",
                              }));
                              setErrors((e) => ({ ...e, userLogin: "" })); // 🔥 Remove validation
                            }}
                          />
                          No
                        </label>
                      </div>

                      {renderError("userLogin")}
                    </div>



                    {/* ------------------------------------------------------------ */}



                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Proxy Used? <span className="text-red-500">*</span>
                      </label>

                      <div className="flex items-center gap-6 mt-2">
                        {/* YES */}
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={submission.proxyUsed === true}
                            onChange={() => {
                              setSubmission((prev) => ({
                                ...prev,
                                proxyUsed: prev.proxyUsed === true ? null : true,
                              }));
                              setErrors((e) => ({ ...e, proxyUsed: "" })); 
                            }}
                          />
                          Yes
                        </label>

                        {/* NO */}
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={submission.proxyUsed === false}
                            onChange={() => {
                              setSubmission((prev) => ({
                                ...prev,
                                proxyUsed: prev.proxyUsed === false ? null : false,
                              }));
                              setErrors((e) => ({ ...e, proxyUsed: "" })); // 🔥 Remove validation
                            }}
                          />
                          No
                        </label>
                      </div>

                      {renderError("proxyUsed")}
                    </div>


                    {submission.userLogin === true && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Login Type</label>
                        <select name="loginType" value={submission.loginType || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3">
                          <option value="" hidden>Select Login Type</option>
                          <option value="Free">Free Login</option>
                          <option value="Paid login">Paid Login</option>
                        </select>
                        {renderError("loginType")}
                      </div>
                    )}

                    {submission.userLogin === true && submission.loginType === "Paid login" && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Credentials</label>
                        <textarea name="credentials" value={submission.credentials || ""} onChange={(e) => setSubmission((prev) => ({ ...prev, credentials: e.target.value }))} placeholder="Enter Credentials..." className="w-full border border-gray-300 rounded-lg p-3 h-28" />
                      </div> 
                    )}
                    {submission.proxyUsed === true && (
                      <div className="md:col-span-2 grid grid-cols-3 gap-6 mt-4">

                        {/* Proxy Name */}
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Proxy Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            name="proxyName"
                            value={submission.proxyName}
                            onChange={handleChange}
                            placeholder="Enter Proxy Name"
                            className="w-full border border-gray-300 rounded-lg p-3"
                             maxLength={50}
                          />
                          {renderError("proxyName")}
                        </div>

                        {/* Per Request Credit */}
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Per Request Credit <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="perRequestCredit"
                            min={0}
                            value={submission.perRequestCredit}
                            onChange={handleChange}
                            placeholder="Ex:- 1,2,5,10"
                            className="w-full border border-gray-300 rounded-lg p-3 
             [appearance:textfield] 
             [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {renderError("perRequestCredit")}
                        </div>

                        {/* Total Requests */}
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Total Requests <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="totalRequest"
                            min={0}
                            value={submission.totalRequest}
                            onChange={handleChange}
                             placeholder="Ex- 1,2,3,4,5"
                            className="w-full border border-gray-300 rounded-lg p-3 
             [appearance:textfield] 
             [&::-webkit-outer-spin-button]:appearance-none 
             [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {renderError("totalRequest")}
                        </div>

                      </div>
                    )}


                    <div>
                      <label className="text-sm font-medium text-gray-700 pr-3">Last Checked Date</label>
                      <DatePicker selected={submission.lastCheckedDate ? new Date(submission.lastCheckedDate) : new Date()} onChange={(d) => setSubmission((prev) => ({ ...prev, lastCheckedDate: d ? format(d, "yyyy-MM-dd") : prev.lastCheckedDate }))} dateFormat="yyyy-MM-dd" maxDate={new Date()} className="w-full border border-gray-300 rounded-lg p-3" />
                      {renderError("lastCheckedDate")}
                    </div>
                  </div>
                )}

                {section.id === 3 && (
                  <div className="grid md:grid-cols-1 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">GitHub Repo Link</label>
                      <input type="text" name="githubLink" value={submission.githubLink || ""} placeholder="Enter GitHub link" onChange={handleChange} className="w-full rounded-lg border border-gray-200 p-3" />
                      {renderError("githubLink")}
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-gray-700">Existing Output Files (keep/remove)</label>

                      {submission.existingOutputFiles && submission.existingOutputFiles.length > 0 ? (
                        <ul className="mb-3 space-y-2 p-2 border rounded-md bg-gray-50">
                          {(submission.existingOutputFiles || []).map((f: string, idx: number) => (
                            <li key={f + idx} className="flex items-center justify-between text-sm py-1 px-2 border-b last:border-b-0">
                              <div className="truncate pr-2 max-w-[80%]">{f}</div>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => toggleKeepExistingFile(f)} className="px-2 py-1 rounded-md bg-gray-200 text-sm"> <Trash2 className="w-5 h-5 text-red-500" /></button>
                                <a
                                  href={buildFileUrl(f)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 text-sm underline"
                                >
                                  <Link className="w-5 h-5 text-blue-600" />
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 mb-2">No existing uploaded files kept — you can add new files below.</p>
                      )}

                      {/* File upload + OR + URL side-by-side */}
                      {/* File upload + OR + URL side-by-side */}
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">

                        {/* Upload File */}
                        <div className="flex-1 w-full">
                          <label className="block mb-2 font-medium text-gray-700">Upload New Output File</label>
                          <input
                            type="file"
                            name="newOutputFiles"
                            multiple
                            onChange={handleNewFileChange}
                            className="w-full p-3 rounded-md border border-gray-200"
                          />

                          {(submission.newOutputFiles || []).length > 0 && (
                            <ul className="mt-2 mb-2 space-y-2 p-2 border rounded-md bg-white">
                              {(submission.newOutputFiles || []).map((file: File, idx: number) => (
                                <li
                                  key={file.name + idx}
                                  className="flex items-center justify-between text-sm py-1 px-2 border-b last:border-b-0"
                                >
                                  <span className="truncate pr-2">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeNewFileAt(idx)}
                                    className="text-red-500 hover:text-red-700 font-bold p-1"
                                  >
                                    ❌
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* OR (auto width, center aligned) */}
                        <div className="font-semibold text-gray-500 mx-1 md:mx-1 whitespace-nowrap">
                          OR
                        </div>

                        {/* Output URL */}
                        <div className="flex-1 w-full">
                          <label className="mb-2 font-medium text-gray-700">Output Document URL</label>
                          <input
                            type="text"
                            name="outputUrls"
                            value={submission.outputUrls?.[0] || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setErrors((prev) => ({ ...prev, outputUrls: "" }));
                              setSubmission((prev) => ({ ...prev, outputUrls: [v].filter(Boolean) }));
                            }}
                            placeholder="Enter Output Document URL"
                            className="w-full p-3 rounded-md border border-gray-200"
                          />
                          {renderError("outputUrls")}
                        </div>

                      </div>


                    </div>



                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Remark</label>
                      <textarea name="remark" value={submission.remark || ""} placeholder="Enter Remark here..." onChange={(e) => setSubmission((prev) => ({ ...prev, remark: e.target.value }))} className="w-full rounded-lg border border-gray-200 p-3 h-28" />
                    </div>


                  </div>
                )}

              </div>
            ))}
            <div className="flex justify-end gap-4 mt-4">
              <button type="submit" disabled={loading} className="px-8 py-3 bg-[#3C01AF] text-white font-semibold rounded-lg hover:bg-blue-700">
                {loading ? "Updating..." : "Update Submission"}
              </button>

              <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold">
                ⬅️ Back
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
};

export default EditSubmit;
