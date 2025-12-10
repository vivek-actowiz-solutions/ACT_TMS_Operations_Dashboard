import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { FileText, Users, Calendar, Folder, ArrowLeft, CheckCircle2, XCircle, Info, Code, Server, Lock, Globe, Download, StickyNote, Link2, MessageSquare, Delete } from "lucide-react";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { useAuth } from "../../hooks/useAuth";

interface Submission {
  files?: string[];
  country?: string[];
  feasible?: boolean;
  approxVolume?: string;
  method?: string;
  apiName?: string;
  userLogin?: boolean;
  loginType?: string;
  credentials?: string;
  proxyUsed?: boolean;
  proxyName?: string;
  perRequestCredit?: number;
  totalRequest?: number;
  complexity?: string;
  githubLink?: string;
  outputFiles?: string[];
  outputUrls?: string[];
  remark?: string;
  submittedAt?: string;
}

interface Domain {
  name: string;
  status?: string;
  developers?: { name: string }[];
  reason?: string;
  upload?: { filename?: string; path?: string; originalname?: string };
  completeDate?: string;
  submission?: Submission;
}

interface Task {
  sampleFileRequired: boolean;
  id: string;
  projectCode: string;
  title: string;
  description?: string;
  status?: string;
  typeOfDelivery?: string;
  typeOfPlatform?: string;
  taskAssignedDate?: string;
  targetDate?: string;
  completeDate?: string;
  assignedBy?: string;
  assignedTo?: string;
  developers?: Record<string, string[]>;
  sowFiles?: string[];
  sowUrls?: string[];
  inputFiles?: string[];
  inputUrls?: string[];
  clientSampleSchemaFiles?: string[];
  clientSampleSchemaUrls?: string[];
  domains?: Domain[];
  submissions?: Record<string, Submission>;
  reason?: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const domainParam = searchParams.get("domain");
  const [task, setTask] = useState<Task | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL as string;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);


  const { user } = useAuth();   // <-- this gives user object (name, role, email etc.)
  const role = user?.role || "";
  const userName = user?.name || "";

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/tasks/${id}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const data: Task = await res.json();
        setTask(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id, apiUrl]);

  const buildFileUrl = (fileData?: string | { path?: string }): string => {
    if (!fileData) return "";
    const filePath = typeof fileData === "string" ? fileData : fileData.path || "";
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    const base = apiUrl.replace(/\/api$/, "");
    return `${base}/${filePath.replace(/\\/g, "/")}`;
  };


  const formatDateTime = (dateStr?: string | number | Date) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
      </div>
    );

  if (!task)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
      </div>
    );

  let domainObj: Domain | null = null;
  let showDomainDetails = false;
  let displayedDomain: string | null = domainParam;
  let submission: Submission | null = null;

  if (task.domains && task.domains.length > 0) {
    if (domainParam) {
      domainObj = task.domains.find((d) => d.name === domainParam) || null;
    }
    if (!domainObj && task.domains.length === 1) {
      domainObj = task.domains[0];
      displayedDomain = domainObj.name;
    }
    if (domainObj && domainObj.submission) submission = domainObj.submission;
    showDomainDetails =
      domainObj && domainObj.status && domainObj.status.toLowerCase() === "in-r&d";
  }

  const showSubmissionSection =
    domainObj && domainObj.status?.toLowerCase() === "submitted";

  


  const canSubmit =
    domainObj &&
    domainObj.status?.toLowerCase() !== "submitted" &&
    domainObj.status?.toLowerCase() !== "terminated" 
    

    const capitalize = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.toUpperCase();
};



  return (
    <>
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/TMS-R&D/" },
          { title: "Tasks", path: "/TMS-R&D/tasks" },
          { title: task.projectCode },
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br  py-10 px-4">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between mb-6">


              {/* Responsive grid — stacked on mobile, 2 columns on large screens */}
              <div className="grid grid-cols-1 lg:grid-cols-[65%_33%] w-full gap-6">

                {/* 🟦 LEFT SECTION (Project Details) */}

                <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-5">

                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-mono font-medium rounded">
                      {task.projectCode}
                    </span>
                    {displayedDomain && (
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${task.domains?.find((d) => d.name === displayedDomain)?.status?.toLowerCase() === "submitted"
                          ? "bg-emerald-100 text-emerald-700"
                          : task.domains?.find((d) => d.name === displayedDomain)?.status?.toLowerCase() === "in-progress"
                            ? "bg-amber-100 text-amber-700"
                            : task.domains?.find((d) => d.name === displayedDomain)?.status?.toLowerCase() === "in-r&d"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {task.domains?.find((d) => d.name === displayedDomain)?.status || "Not Available"}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{task.title}</h1>

                  {displayedDomain && (
                    <div className="grid grid-cols-2  gap-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Server size={16} />
                        <span className="text-sm font-medium ">Platform:</span>
                        <span className="text-sm font-semibold text-gray-900 mr-4">{displayedDomain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} />
                        <span className="text-sm font-medium ">Remarks:</span>
                        <span className="text-sm font-semibold text-gray-900">{domainObj?.domainRemarks}</span>
                      </div>
                    </div>

                  )}

                  
                  {task.description && (
                    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={20} />
                        <h3 className="text-xs font-semibold text-gray-800  tracking-wide">
                          Description
                        </h3>
                      </div>

                      {/* Description Preview */}
                      <p
                        className={`text-gray-700 leading-relaxed text-sm whitespace-pre-line ${isDescExpanded ? "" : "line-clamp-2"
                          }`}
                      >
                        {task.description}
                      </p>

                      {/* Read More / Read Less */}
                      {task.description.split("\n").length > 2 ||
                        task.description.length > 160 ? (
                        <button
                          onClick={() => setShowDescModal(true)}
                          className="text-blue-600 text-sm font-semibold mt-2 underline hover:text-blue-800"
                        >
                          Read More
                        </button>
                      ) : null}
                    </div>
                  )}

                  {domainObj?.status === "Terminated" && domainObj?.terminatedReason && (
                    <div className="mt-6 bg-red-50 border border-red-300 rounded-lg p-4 ">
                      <div className="flex items-center gap-2 mb-3">
                        <Delete size={20} />
                        <h3 className="font-semibold text-red-700 mb-1">
                          Why This Domain is Terminated?
                        </h3>
                      </div>
                      <p className="text-gray-900 text-sm">{domainObj.terminatedReason}</p>
                    </div>
                  )}

                  {showDomainDetails && (
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info size={20} className="text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          {domainObj.reason && (
                            <p className="text-gray-900 text-sm mb-3">
                              <span className="font-semibold">Reason:</span> {domainObj.reason}
                            </p>
                          )}
                          <div className="mt-4 space-y-3 w-1/2">
                            {/* Uploaded File */}
                            {typeof domainObj.upload === "string" && domainObj.upload.trim() !== "" && domainObj.upload !== "uploads/" ? (
                              <div className="flex items-center gap-3 p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition">
                                <FileText size={18} className="text-sky-600" />
                                <a
                                  href={buildFileUrl(domainObj.upload)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 text-sm font-medium text-slate-700 hover:text-slate-900 truncate"
                                >
                                  View File
                                </a>
                                <Download size={16} className="text-slate-400 hover:text-slate-600" />
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic"></p>
                            )}

                            {/* Uploaded URL */}
                            {domainObj.uploadUrl ? (
                              <div className="flex items-center gap-3 p-2  rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 transition">
                                <Globe size={18} className="text-blue-600" />
                                <a
                                  href={domainObj.uploadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 text-sm font-medium text-blue-700 hover:text-blue-900 truncate"
                                >
                                  View URL
                                </a>
                                <Link2 size={16} className="text-blue-400 hover:text-blue-600 rotate-180" />
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic"></p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🟨 RIGHT SECTION (Delivery & Platform) */}
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-5">
                  <InfoCard
                    label="Sample File Format"
                    value={capitalize(task.oputputFormat) || "Not specified"}
                    icon={<Info size={18} className="text-slate-600" />}
                  />
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <StickyNote size={18} className="text-slate-600" />
                      Delivery & Platform
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Labels Row */}
                      <div className="text-sm text-gray-600 font-medium">Type of Delivery:</div>
                      <div className="text-sm text-gray-600 font-medium">Type of Platform:</div>

                      {/* Values Row */}
                      <div>
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                          {capitalize(task.typeOfDelivery) || "Not specified"}

                        </span>
                      </div>
                      <div>
                        {task.domains && task.domains.length > 0 ? (
                          <div className="flex flex-col gap-2">

                            {(domainParam
                              ? task.domains.filter((d) => d.name === domainParam)  // 👈 show only selected
                              : task.domains                                         // 👈 show all if none selected
                            ).map((d, i) => {
                              const platform =
                                d.typeOfPlatform || task.typeOfPlatform || "Not specified";

                              return (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="inline-block bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full">
                                    {capitalize(platform)}

                                  </span>
                                </div>
                              );
                            })}

                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            {capitalize(task.typeOfPlatform) || "No domains available"}
                          </span>
                        )}

                      </div>

                    </div>
                  </div>

                  <div className="mt-6 grid sm:grid-cols-2 gap-4">
                    <InfoCard
                      label="Sample File Required"
                      value={task.sampleFileRequired ? "Yes" : "No"}
                      icon={
                        task.sampleFileRequired ? (
                          <CheckCircle2 size={18} className="text-emerald-600" />
                        ) : (
                          <XCircle size={18} className="text-gray-400" />
                        )
                      }
                      highlight={task.sampleFileRequired}
                    />

                    {task.sampleFileRequired && (
                      <InfoCard
                        label="Required Volume"
                        value={task.requiredValumeOfSampleFile || "Not specified"}
                        icon={<Info size={18} className="text-slate-600" />}
                      />
                    )}


                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Submission Section */}
          {submission && showSubmissionSection && (
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <FileText size={24} className="text-slate-700" />
                  <h2 className="text-2xl font-bold text-gray-900">Submission Details</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Overview Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  <StatusCard
                    label="Feasibility"
                    value={submission.feasible == "true" ? "Feasible" : "Not Feasible"}
                    icon={submission.feasible == "true" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    status={submission.feasible == "true" ? "success" : "error"}
                  />
                  <StatusCard
                    label="Complexity"
                    value={submission.complexity || "Not specified"}
                    icon={<Code size={20} />}
                    status="info"
                  />
                  <StatusCard
                    label="Method"
                    value={submission.method || "Not specified"}
                    icon={<Server size={20} />}
                    status="neutral"
                  />
                </div>
                <div className="grid md:grid-cols-1 gap-6">
                  <SubmissionCard title="Output Sample Documents" icon={<Download size={20} className="text-emerald-600" />}>
                    <div className="space-y-3">

                      {/* Combine both arrays safely */}
                      {(() => {
                        const files = submission.outputFiles || [];
                        const urls = submission.outputUrls || [];

                        const combined = [
                          ...files.map((file) => ({ type: "file", value: file })),
                          ...urls.map((url) => ({ type: "url", value: url })),
                        ];

                        if (combined.length === 0) {
                          return (
                            <p className="text-sm text-gray-500 italic py-4 text-center">
                              No Output Provided
                            </p>
                          );
                        }

                        return combined.map((item, idx) => {
                          const isFile = item.type === "file";

                          const link = isFile
                            ? buildFileUrl(item.value)
                            : item.value.startsWith("http")
                              ? item.value
                              : `https://${item.value}`;

                          return (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-3 p-3 rounded-lg border transition group
              ${isFile ? "bg-slate-50 hover:bg-slate-100 border-slate-200"
                                  : "bg-blue-50 hover:bg-blue-100 border-blue-200"}`}
                            >
                              {isFile ? (
                                <FileText size={18} className="text-slate-600" />
                              ) : (
                                <Globe size={18} className="text-blue-600" />
                              )}

                              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                Version {idx + 1}
                              </span>

                              {isFile ? (
                                <Download size={14} className="ml-auto text-slate-400 group-hover:text-slate-600" />
                              ) : (
                                <ArrowLeft size={14} className="ml-auto text-blue-400 group-hover:text-blue-600 rotate-180" />
                              )}
                            </a>
                          );
                        });
                      })()}
                    </div>
                  </SubmissionCard>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <SubmissionCard title="Basic Information" icon={<Info size={20} className="text-sky-600" />}>
                    <div className="space-y-4">
                      <DetailRow label="Platform" value={displayedDomain || "-"} />
                      <DetailRow
                        label="Country"
                        value={
                          Array.isArray(submission.country)
                            ? submission.country.join(", ")
                            : submission.country || "-"
                        }
                      />
                      <DetailRow label="Approx Volume" value={submission.approxVolume || "-"} />
                      {submission.method === "third-party-api" && (
                        <DetailRow label="API Name" value={submission.apiName || "-"} />
                      )}
                    </div>
                  </SubmissionCard>

                  {/* Authentication & Security */}
                  <SubmissionCard
                    title="Authentication & Security"
                    icon={<Lock size={20} className="text-amber-600" />}
                  >
                    <div className="space-y-4">
                      {/* User Login */}
                      <DetailRow
                        label="User Login Required"
                        value={
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${submission.userLogin === "true" || submission.userLogin === true
                              ? "bg-sky-100 text-sky-700"
                              : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {submission.userLogin === "true" || submission.userLogin === true
                              ? "Yes"
                              : "No"}
                          </span>
                        }
                      />

                      {/* Only show login details if userLogin is true */}
                      {(submission.userLogin === "true" || submission.userLogin === true) && (
                        <>
                          <DetailRow label="Login Type" value={submission.loginType || "-"} />
                          <DetailRow label="Credentials" value={submission.credentials || "-"} />
                        </>
                      )}

                      {/* Proxy Section */}
                      <DetailRow
                        label="Proxy Required"
                        value={
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${submission.proxyUsed === "true" || submission.proxyUsed === true
                              ? "bg-sky-100 text-sky-700"
                              : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {submission.proxyUsed === "true" || submission.proxyUsed === true
                              ? "Yes"
                              : "No"}
                          </span>
                        }
                      />

                      {/* Only show proxy details if proxyUsed is true */}
                      {(submission.proxyUsed === "true" || submission.proxyUsed === true) && (
                        <>
                          <DetailRow label="Proxy Name" value={submission.proxyName || "-"} />
                          <DetailRow
                            label="Per Request Credit"
                            value={submission.perRequestCredit?.toString() || "-"}
                          />
                          <DetailRow
                            label="Total Requests"
                            value={submission.totalRequest?.toString() || "-"}
                          />
                        </>
                      )}
                    </div>
                  </SubmissionCard>



                </div>

                {/* Technical Details */}
                {submission.githubLink && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Code size={18} className="text-slate-600" />
                      GitHub Repository
                    </h3>
                    <a
                      href={submission.githubLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800 underline"
                    >


                      view Repository
                    </a>
                  </div>
                )}

                {/* Remarks */}
                {submission.remark && (
                  <div className="bg-amber-50 rounded-lg border border-amber-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Info size={18} className="text-amber-600" />
                      Remarks
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {submission.remark}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}


          <div className="grid grid-cols-1 gap-6">
            {/* Attachments */}
            <Section
              title="Attachments"
              icon={<Folder size={22} className="text-amber-600" />}
            >
              <div className="grid gap-6 grid-cols-3">
                <AttachmentGroup
                  label="SOW Documents"
                  files={task.sowFiles}
                  urls={task.sowUrls}
                  buildFileUrl={buildFileUrl}
                />
                <AttachmentGroup
                  label="Input Documents/Keywords"
                  files={task.inputFiles}
                  urls={task.inputUrls}
                  buildFileUrl={buildFileUrl}
                />
                <AttachmentGroup
                  label="Client Sample Schema"
                  files={task.clientSampleSchemaFiles}
                  urls={task.clientSampleSchemaUrls}
                  buildFileUrl={buildFileUrl}
                />
              </div>
            </Section>

            {/* Timeline */}
            <Section
              title="Task Timeline"
              icon={<Calendar size={22} className="text-emerald-600" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <TimelineItem
                  label="Assigned"
                  value={formatDateTime(task.taskAssignedDate)}
                />
                <TimelineItem
                  label="Target"
                  value={formatDateTime(task.targetDate)}
                />
                <TimelineItem
                  label="Completed"
                  value={formatDateTime(
                    domainObj?.completeDate ?? submission?.submittedAt
                  )}
                />
              </div>
            </Section>

          </div>

          {/* People */}
          <Section title="People" icon={<Users size={22} className="text-blue-600" />}>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500  tracking-wide mb-2">Assigned By</p>
                <p className="text-gray-900 font-medium">{task.assignedBy || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500  tracking-wide mb-2">Assigned To</p>
                <p className="text-gray-900 font-medium">{task.assignedTo || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500  tracking-wide mb-2">Developers</p>
                {displayedDomain ? (
                  <div className="flex flex-wrap gap-2">
                    {task.domains?.find((d) => d.name === displayedDomain)?.developers?.length ? (
                      task.domains
                        ?.find((d) => d.name === displayedDomain)
                        ?.developers.map((dev, idx) => (
                          <span key={idx} className="text-gray-900 font-medium">
                            {dev.name}
                          </span>
                        ))
                    ) : (
                      <span className="text-gray-500 text-sm">No developer assigned</span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No domain selected</p>
                )}
              </div>
            </div>
          </Section>
          {/* Back Button */}
          <div className="flex justify-end mt-4">


            <div className="flex justify-end gap-3 mt-4">

              {/* Back Button */}
              <button
                onClick={() => navigate("/TMS-operations/tasks")}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition font-medium"
              >
                <ArrowLeft size={18} /> Back
              </button>

              {/* Submit Button */}
              {canSubmit && (
                <button
                  onClick={() =>
                    navigate(
                      `/TMS-operations/submit/${task._id}?domain=${encodeURIComponent(displayedDomain || "")}`
                    )
                  }
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition font-medium"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showDescModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Description</h3>

            <div className="max-h-80 overflow-y-auto whitespace-pre-line text-gray-700 text-sm">
              {task.description}
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowDescModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );

};

/* Components */
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
      {icon}
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const InfoCard: React.FC<{ label: string; value: string; icon: React.ReactNode; highlight?: boolean }> = ({
  label,
  value,
  icon,
  highlight = false,
}) => (
  <div className={`p-4 rounded-lg border ${highlight ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
    }`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <p className="text-xs text-gray-600  tracking-wide font-semibold">{label}</p>
    </div>
    <p className="text-gray-900 font-semibold">{value}</p>
  </div>
);

const StatusCard: React.FC<{ label: string; value: string; icon: React.ReactNode; status: "success" | "error" | "info" | "neutral" }> = ({
  label,
  value,
  icon,
  status,
}) => {
  const statusStyles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-sky-50 border-sky-200 text-sky-700",
    neutral: "bg-slate-50 border-slate-200 text-slate-700",
  };

  return (
    <div className={`p-4 rounded-lg border ${statusStyles[status]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs  tracking-wide font-semibold">{label}</p>
      </div>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
};

const SubmissionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-4 py-3 bg-slate-50 border-b border-gray-200">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h3>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600 font-medium">{label}</span>
    <span className="text-sm text-gray-900 font-semibold text-right ml-4">{value || "-"}</span>
  </div>
);

const TimelineItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
    <div className="flex-1">
      <p className="text-xs text-gray-600  tracking-wide font-semibold">{label}</p>
      <p className="text-sm text-gray-900 font-medium mt-1">{value}</p>
    </div>
  </div>
);



const AttachmentGroup: React.FC<{
  label: string;
  files?: string[];
  urls?: string[];
  buildFileUrl: (file: string | undefined) => string;
}> = ({ label, files = [], urls = [], buildFileUrl }) => {

  const combined = [...files, ...urls];

  const renderItem = (item: string, idx: number) => {
    const isUrl = item.startsWith("http");
    const isKeywordList = item.includes(",") && !isUrl;

    if (isKeywordList) {
      const keywords = item.split(",").map(k => k.trim());

      return (
        <div
          key={idx}
          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >

          <ul className="list-disc list-inside text-sm text-gray-700">
            {keywords.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <a
        key={idx}
        href={isUrl ? item : buildFileUrl(item)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 
                  rounded border border-slate-200 text-sm text-slate-700 
                  hover:text-slate-900 transition group"
      >
        {isUrl ? <Globe size={16} /> : <FileText size={16} />}
        <span className="flex-1">Version {idx + 1}</span>
        {isUrl ? (
          <span className="text-xs text-slate-500">URL</span>
        ) : (
          <Download size={14} className="text-slate-400 group-hover:text-slate-600" />
        )}
      </a>
    );
  };

  return (

    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>

      {combined.length > 0 ? (
        <div className="space-y-2">
          {combined.map((item, idx) => renderItem(item, idx))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic py-2">No URLs available</p>
      )}
    </div>

  );
};




export default TaskDetail;
