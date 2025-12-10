
// src/pages/SubmitTaskUI.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CreatableSelect from "react-select/creatable";
import { format } from "date-fns";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getNames } from "country-list";

interface SubmitTaskProps {
  taskData?: any;
}

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
  outputFiles?: File[];
  outputUrls?: string[];
  remark?: string;
  apiName?: string;
  sowUrl?: string;
  outputUrl?: string;
}

const SubmitTaskUI: React.FC<SubmitTaskProps> = ({ taskData }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const domainFromUrl = searchParams.get("domain");
  const apiUrl = import.meta.env.VITE_API_URL;
  const today = new Date();

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

  const allCountries = getNames().map((name) => ({ value: name, label: name }));

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
    outputFiles: [],
    outputUrls: [],
    remark: "",
    sowUrl: "",
  });

  const [domains, setDomains] = useState<string[]>([]);
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [taskLoading, setTaskLoading] = useState(true);

  useEffect(() => {
    setTaskLoading(true);
    if (taskData) {
      setSubmission((prev) => ({
        ...prev,
        ...taskData,
        domain: domainFromUrl || taskData.domain || prev.domain,
        lastCheckedDate: taskData.lastCheckedDate
          ? taskData.lastCheckedDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        outputFiles: [],
        country: Array.isArray(taskData.country)
          ? taskData.country
          : taskData.country
            ? [taskData.country]
            : [],
      }));
      if (taskData.developers) setDomains(Object.keys(taskData.developers));
      setTaskDetails(taskData);
      setTaskLoading(false);
    } else if (id) {
      fetch(`${apiUrl}/tasks/${id}`, { method: "GET", credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setSubmission((prev) => ({
            ...prev,
            ...data,
            domain: domainFromUrl || data.domain || prev.domain,
            lastCheckedDate: data.lastCheckedDate
              ? data.lastCheckedDate.slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            outputFiles: [],
            country: Array.isArray(data.country)
              ? data.country
              : data.country
                ? [data.country]
                : [],
          }));

          setTaskDetails(data);
          if (data.developers) setDomains(Object.keys(data.developers));
          setTaskLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setTaskLoading(false);
        });
    }
  }, [taskData, id, domainFromUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const filesArray: File[] = [];

    Array.from(e.target.files).forEach((file) => {
      if (file.type === "application/json") {
        // OVH FIX → change MIME to text/plain
        const newFile = new File([file], file.name, { type: "text/plain" });
        filesArray.push(newFile);
      } else {
        filesArray.push(file);
      }
    });

    setSubmission((prev) => ({
      ...prev,
      outputFiles: filesArray,
    }));
  };


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const name = target.name as string;
    const value = (target as any).value;

    // Clear an error for this field when user changes it
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    const type = (target as HTMLInputElement).type;
    const checked = (target as HTMLInputElement).checked;
    const multiple = (target as HTMLSelectElement).multiple;
    const files = (target as HTMLInputElement).files;

    if (type === "checkbox") {
      setSubmission((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setSubmission((prev) => ({ ...prev, outputFiles: files ? Array.from(files) : [] }));
    } else if (multiple) {
      const selected = Array.from((target as HTMLSelectElement).options)
        .filter((o) => o.selected)
        .map((o) => o.value);
      setSubmission((prev) => ({ ...prev, [name]: selected }));
    } else {
      // special handling for approxVolume
      if (name === "approxVolume") {
        const trimmed = value.trim();
        if (/^n\/?a?$/i.test(trimmed)) {
          setSubmission((prev) => ({ ...prev, approxVolume: value.toUpperCase() }));
          return;
        }
        if (/^n\/?a$/i.test(trimmed)) {
          setSubmission((prev) => ({ ...prev, approxVolume: "N/A" }));
          return;
        }
        const volumeRegex = /^\d+(\.\d+)?([KM])?(,\s*\d+(\.\d+)?([KM])?)*$/i;
        if (trimmed && !volumeRegex.test(trimmed)) {
          toast.error("❌ Enter numbers like 45000 / 4M or 'N/A'");
          return;
        }
      }

      setSubmission((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!submission.domain) newErrors.domain = "Domain is required.";
    if (!submission.country || submission.country.length === 0)
      newErrors.country = "Country is required.";
    if (!submission.approxVolume) newErrors.approxVolume = "Approx Volume is required.";
    if (!submission.method) newErrors.method = "Method is required.";
    if (!submission.lastCheckedDate) newErrors.lastCheckedDate = "Last Checked Date is required.";
    if (!submission.complexity) newErrors.complexity = "Complexity is required.";

    if (submission.userLogin && !submission.loginType) newErrors.loginType = "Please select a login type.";
    if (submission.userLogin === null) newErrors.userLogin = "Please select login Yes or No.";

    if (submission.feasible === null) newErrors.feasible = "Please select feasible Yes or No.";

    if (submission.proxyUsed === null || submission.proxyUsed === undefined)
      newErrors.proxyUsed = "Please specify if proxy is used.";

    if (submission.proxyUsed) {
      if (!submission.proxyName) newErrors.proxyName = "Proxy Name is required.";

      if (!submission.perRequestCredit) newErrors.perRequestCredit = "Per Request Credit is required.";

      if (!submission.totalRequest) newErrors.totalRequest = "Total Request is required.";
    }

    if ((!submission.outputFiles || submission.outputFiles.length === 0) && !submission.outputUrls?.[0]) {
      newErrors.outputUrls = "Upload a file or provide a output document URL.";
    }

    if (submission.outputUrls?.[0] && !isValidDocumentUrl(submission.outputUrls[0])) {
      newErrors.outputUrls = "Invalid document URL format.";
    }

    if (submission.githubLink) {
      const githubPattern = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
      if (!githubPattern.test(submission.githubLink.trim())) newErrors.githubLink = "Enter a valid GitHub repository URL.";
    }

    // ❌ If user uploads a JSON file in outputFiles → show error
    if (submission.outputFiles && submission.outputFiles.length > 0) {
      const hasJson = submission.outputFiles.some((file: File) =>
        file.name.toLowerCase().endsWith(".json")
      );

      if (hasJson) {
        newErrors.outputFiles = "JSON file is not uploadable. Please upload a JSON file link instead.";
      }
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("domain", submission.domain || "");
      (submission.country || []).forEach((c) => formData.append("country[]", c));
      formData.append("approxVolume", submission.approxVolume || "");
      formData.append("method", submission.method || "");
      if (submission.method === "third-party-api" || submission.method === "third-party-api") {
        formData.append("apiName", submission.apiName || "");
      }
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

      // Append outputFiles
      (submission.outputFiles || []).forEach((f) => {
        formData.append("outputFiles", f);
      });

      // Append outputUrls as JSON string
      if (submission.outputUrls) {
        formData.append("outputUrls", JSON.stringify(submission.outputUrls));
      }

      //Debug entries (can remove in production)
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const titleParam = encodeURIComponent(taskDetails?.title || "project");
      const res = await fetch(`${apiUrl}/tasks/${id}/submit?title=${titleParam}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text();
        toast.error("❌ Error submitting task: " + errText);
        setLoading(false);
        return;
      }


      toast.success("✅ Task submitted successfully!");
      setTimeout(() => navigate("/TMS-operations/tasks"), 1500);

    } catch (err: any) {
      console.error(err);
      toast.error("❌ Error submitting task! " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };


  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!validateForm()) return;
  //   setLoading(true);

  //   try {
  //     const formData = new FormData();



  //     formData.append("domain", submission.domain || "");
  //     submission.country.forEach((c) => formData.append("country[]", c)); // convert array to JSON string

  //     formData.append("approxVolume", submission.approxVolume || "");
  //     formData.append("method", submission.method);
  //     if (method === "third-party-api") {
  //       formData.append("apiName", submission.apiName);
  //     }
  //     formData.append("feasible", submission.feasible); // boolean as string
  //     formData.append("userLogin", submission.userLogin ? "true" : "false"); // boolean as string
  //     formData.append("loginType", submission.loginType || "");
  //     formData.append("credentials", submission.credentials || "");
  //     formData.append("proxyUsed", submission.proxyUsed ? "true" : "false"); // boolean as string
  //     formData.append("proxyName", submission.proxyName || "");
  //     formData.append("perRequestCredit", submission.perRequestCredit || "");
  //     formData.append("totalRequest", submission.totalRequest || "");
  //     formData.append("lastCheckedDate", submission.lastCheckedDate || "");
  //     formData.append("complexity", submission.complexity || "");
  //     formData.append("githubLink", submission.githubLink || "");
  //     // formData.append("outputUrl", submission.outputUrl || "");
  //     formData.append("remark", submission.remark || "");

  //     // Append files
  //     // Inside handleSubmit in Submit.tsx

  //     Object.entries(submission).forEach(([key, value]) => {
  //       if (value === null || value === undefined || value === "") return;



  //       if (key === "outputUrls") {
  //         formData.append(key, JSON.stringify(value));
  //       }
  //       // Handle file arrays
  //       else if (key === "outputFiles") {
  //         (value as File[]).forEach((file) => {
  //           formData.append("outputFiles", file);

  //         });
  //       }
  //       else {
  //         formData.append(key, value as any);
  //       }
  //     });


  //     // Debug: see exactly what is being sent
  //     for (let pair of formData.entries()) {
  //       console.log(pair[0], pair[1]);
  //     }
  //     const titleParam = encodeURIComponent(taskDetails?.title || "project");
  //     const res = await fetch(`${apiUrl}/tasks/${id}/submit?title=${titleParam}`, {
  //       method: "POST",
  //       body: formData,
  //       credentials: "include",
  //     });

  //     console.log("res:",res);


  //     if (!res.ok) {
  //       const errText = await res.text();
  //       toast.error("❌ Error submitting task111: " + errText);
  //       return;
  //     }

  //     const data = await res.json();

  //     console.log("Returned task:", data);
  //     toast.success("✅ Task submitted successfully!");
  //     setTimeout(() => navigate("/tasks"), 1500);
  //   } catch (err) {
  //     console.error(err);
  //     console.log("errr", err)
  //     toast.error("❌ Error submitting task!11111" + err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const renderError = (key: string) => errors[key] && <p className="text-red-500 text-sm mt-1">{errors[key]}</p>;

  if (taskLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Sections mapping to match CreateTaskUI style but preserving order
  const sections = [
    { id: 1, title: "Basic Information" },
    { id: 2, title: "Platform Configuration" },

    { id: 3, title: "Documents" },
  ];

  return (
    <>
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/TMS-operations/" },
          { title: "Tasks", path: "/TMS-operations/tasks" },
          { title: "Submit" },
        ]}
      />

      <div className="min-h-screen w-full bg-white flex justify-center py-10 px-4">
        <div className="w-full max-w-7xl p-8 rounded-2xl">
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

          <div className="ml-5 mb-6">
            <h1 className="text-3xl font-bold text-[#3C01AF]">
              Submit Task
            </h1>
            <p className="text-gray-600">Fill the details and submit the task</p>
          </div>

          {/* Top task overview - redesigned as a card */}
          {taskDetails && (
            <div className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md">
                  Info
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#3C01AF]">
                    Task Platform Info
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-gray-700 font-medium">Platform</th>
                      <th className="px-4 py-3 text-gray-700 font-medium">TL</th>
                      <th className="px-4 py-3 text-gray-700 font-medium">Submission Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskDetails.domains?.map((domainObj: any, idx: number) => {
                      const devNames = domainObj.developers?.map((dev: any) => dev.name) || [];
                      const submissionStatus = domainObj.status || "pending";
                      const isSubmitted = submissionStatus.toLowerCase() === "submitted";
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 border-b border-gray-200">{domainObj.name}</td>
                          <td className="px-4 py-3 border-b border-gray-200">{devNames.join(", ") || "-"}</td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isSubmitted ? "bg-green-500/20 text-green-600" : "bg-yellow-500/20 text-yellow-600"}`}>
                              {submissionStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {sections.map((section) => (
              <div key={section.id} className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6">
                <div className="w-full bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-100 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
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

                {/* SECTION 1 - Basic Information */}
                {section.id === 1 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Platform</label>
                      <input
                        type="text"
                        value={
                          submission.domain ||
                          (taskDetails?.domains ? taskDetails.domains.map((d: any) => d.name).join(", ") : "")
                        }
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
                        value={submission.country.map((c) => ({ value: c, label: c }))}
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
                        value={submission.approxVolume}
                        onChange={handleChange}
                        placeholder="e.g. 45000 or 4M or N/A"
                        className="w-full rounded-lg border border-gray-200 p-3 text-gray-800"
                      />
                      <p className="text-xs text-gray-400 mt-1">Start with digits or enter 'N/A'</p>
                      {renderError("approxVolume")}
                    </div>
                  </div>
                )}

                {/* SECTION 2 - Platform Configuration */}
                {section.id === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Method */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Method <span className="text-red-500">*</span></label>
                      <select
                        name="method"
                        value={submission.method}
                        onChange={(e) => {
                          handleChange(e as any);
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

                    {/* Complexity */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Complexity</label>
                      <select
                        name="complexity"
                        value={submission.complexity}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-3"
                      >
                        <option value="Low">🟢 Low</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="High">🟠 High</option>
                        <option value="Very High">🔴 Very High</option>
                      </select>
                      {renderError("complexity")}
                    </div>

                    {/* API Name - aligns properly in grid */}
                    {submission.method === "third-party-api" && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">API Name</label>
                        <input
                          type="text"
                          name="apiName"
                          value={submission.apiName || ""}
                          onChange={handleChange}
                          placeholder="Enter API Name"
                          className="w-full border border-gray-300 rounded-lg p-3"
                        />
                      </div>
                    )}

                    {/* Login Required */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Login Required? <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-6 mt-2">
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
                              setErrors((prev) => ({ ...prev, userLogin: "" })); // 🔥 CLEAR ERROR
                            }}
                          />

                          Yes
                        </label>

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
                              setErrors((prev) => ({ ...prev, userLogin: "" })); // 🔥 CLEAR ERROR
                            }}
                          />

                          No
                        </label>
                      </div>
                      {renderError("userLogin")}
                    </div>

                    {/* Proxy Used */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Proxy Used? <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-6 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={submission.proxyUsed === true}
                            onChange={() => {
                              setSubmission((prev) => ({
                                ...prev,
                                proxyUsed: prev.proxyUsed === true ? null : true,
                              }));
                              setErrors((prev) => ({ ...prev, proxyUsed: "" })); // 🔥 CLEAR ERROR
                            }}
                          />

                          Yes
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={submission.proxyUsed === false}
                            onChange={() => {
                              setSubmission((prev) => ({
                                ...prev,
                                proxyUsed: prev.proxyUsed === false ? null : false,
                              }));
                              setErrors((prev) => ({ ...prev, proxyUsed: "" })); // 🔥 CLEAR ERROR
                            }}
                          />

                          No
                        </label>
                      </div>
                      {renderError("proxyUsed")}
                    </div>

                    {/* Login Type */}
                    {submission.userLogin === true && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Login Type</label>
                        <select
                          name="loginType"
                          value={submission.loginType}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg p-3"
                        >
                          <option value="" hidden>Select Login Type</option>
                          <option value="Free">Free Login</option>
                          <option value="Paid login">Paid Login</option>
                        </select>
                        {renderError("loginType")}
                      </div>
                    )}

                    {/* Credentials */}
                    {submission.userLogin === true && submission.loginType === "Paid login" && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Credentials</label>
                        <textarea
                          name="credentials"
                          value={submission.credentials}
                          onChange={(e) =>
                            setSubmission((prev) => ({ ...prev, credentials: e.target.value }))
                          }
                          placeholder="Enter Credentials..."
                          className="w-full border border-gray-300 rounded-lg p-3 h-28"
                        />
                      </div>
                    )}

                    {submission.proxyUsed === true && (
                      <div className="md:col-span-2 w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
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


                    {/* Last Checked Date - FULL WIDTH */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 pr-3">Last Checked Date</label>
                      <DatePicker
                        selected={submission.lastCheckedDate ? new Date(submission.lastCheckedDate) : new Date()}
                        onChange={(d) =>
                          setSubmission((prev) => ({
                            ...prev,
                            lastCheckedDate: d ? format(d, "yyyy-MM-dd") : prev.lastCheckedDate,
                          }))
                        }
                        dateFormat="yyyy-MM-dd"
                        maxDate={new Date()}
                        className="w-full border border-gray-300 rounded-lg p-3 "
                      />
                      {renderError("lastCheckedDate")}
                    </div>

                  </div>
                )}
                {/* SECTION 3 - Documents */}
                {section.id === 3 && (
                  <div className="grid md:grid-cols-1 gap-4">

                    <div>
                      <div className="md:col-span-3">
                        <label className="block mb-2 text-sm font-medium text-gray-700">GitHub Repo Link</label>
                        <input
                          type="text"
                          name="githubLink"
                          value={submission.githubLink || ""}
                          placeholder="Enter GitHub link"
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-200 p-3"
                        />
                        {renderError("githubLink")}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="text-red-500">Note:</span> JSON file is not uploadable. Please upload a <span className="text-red-500">JSON file link instead.</span>
                    </p>

                    {/* Sample Output File OR Output Document URL */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      {/* Sample Output File */}
                      <div className="flex-1">
                        <label className="block mb-2 font-medium text-gray-700">
                          Sample Output File <span className="text-red-500">*</span>
                        </label>
                        {submission.outputFiles && submission.outputFiles.length > 0 ? (
                          <ul className="space-y-2 mb-2 p-2 border rounded-md bg-gray-50">
                            {submission.outputFiles.map((file: File, index: number) => (
                              <li
                                key={file.name + index}
                                className="flex items-center justify-between text-sm py-1 px-2 border-b last:border-b-0"
                              >
                                <span className="truncate pr-2">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setErrors((prev) => ({ ...prev, outputFiles: "" }));
                                    setSubmission((prev) => ({
                                      ...prev,
                                      outputFiles: prev.outputFiles.filter((_: File, i: number) => i !== index),
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700 font-bold p-1"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  ❌
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <input
                            type="file"
                            name="outputFiles"
                            onChange={(e) => {
                              setErrors((prev) => ({ ...prev, outputUrls: "" }));
                              handleFileChange(e);
                            }}
                            multiple
                            className="w-full p-3 rounded-md border border-gray-200"
                          />
                        )}
                        {renderError("outputFiles")}
                      </div>

                      {/* OR */}
                      <div className="hidden md:block text-gray-500 font-semibold mt-5">OR</div>

                      {/* Output Document URL */}
                      <div className="flex-1">
                        <label className="block mb-2 font-medium text-gray-700">Output Document URL</label>
                        <input
                          type="text"
                          name="outputUrls"
                          value={submission.outputUrls?.[0] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setErrors((prev) => ({ ...prev, outputUrls: "" }));
                            setSubmission((prev) => ({ ...prev, outputUrls: [value].filter(Boolean) }));
                          }}
                          placeholder="Enter Output Document URL"
                          className="w-full p-3 rounded-md border border-gray-200"
                        />
                        {renderError("outputUrls")}
                      </div>
                    </div>


                    {/* Remark */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Remark</label>
                      <textarea
                        name="remark"
                        value={submission.remark || ""}
                        placeholder="Enter Remark here..."
                        onChange={(e) => setSubmission((prev) => ({ ...prev, remark: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-3 h-28"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-4 mt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-[#3C01AF] text-white font-semibold rounded-lg hover:bg-blue-700"
                      >
                        {loading ? "Submitting..." : "Submit Task"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                      >
                        ⬅️ Back
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ))}

          </form>
        </div>
      </div>
    </>
  );
};

export default SubmitTaskUI;
