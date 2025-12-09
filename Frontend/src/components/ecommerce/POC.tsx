import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { Autocomplete, TextField } from "@mui/material";
import { getNames } from "country-list";


const CreatePOC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});


  const countries = getNames().map((name) => ({ value: name, label: name }));


  const [form, setForm] = useState({
    taskId: taskId,
    projectName: "",
    asignedBy: "",
    ProjectCode: "",
    TaskIdForPOC: "",
    TargetWebsite: taskId,
    OutputFormat: "",
    Frequency: "",
    date: new Date().toISOString().split("T")[0],
    PurposeOftheProject: "",
    RecordCount: "",
    BitrixURL: "",
    Industry: "",
    ClientGeography: "",
    LocationCoverage: "",
    InputParameter: "",
    ScopeOfData: "",

    OutputDeliveryMode: "",
    Timeline: "",
    AdditionalNotes: "",
    MandatoryFields: [{ fieldName: "", description: "" }]
  });

  const fetchTask = async () => {
    try {
      if (!taskId) {
        console.error("❌ taskId missing in URL");
        setLoading(false);
        return;
      }

      const res = await fetch(`${apiUrl}/tasks/single/${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        credentials: "include",
      });

      const data = await res.json();
      console.log("Fetched Task:", data);

      if (!data?.task) {
        console.error("❌ No task found in API response");
        setLoading(false);
        return;
      }

      setTask(data.task);

      // Convert mandatory fields string → array of objects
      const rawMandatory = data.task?.mandatoryFields || "";
      const mandatoryArray = rawMandatory
        .split(/[,\.]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => ({
          fieldName: item,
          description: ""
        }));

      setForm((prev) => ({
        ...prev,
        projectName: data.task?.title || "",
        asignedBy: data.task?.assignedBy?.name || "",
        TargetWebsite: data.task?.domains?.map(d => d.name) || [],
        OutputFormat: (data.task?.oputputFormat || "").toUpperCase() || "",
        Frequency: data.task?.frequency || "",
        MandatoryFields: mandatoryArray.length ? mandatoryArray : prev.MandatoryFields
      }));

      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, []);

  useEffect(() => {
    if (task) {
      setForm((prev) => ({
        ...prev,
        ClientGeography: task.ClientGeography
          ? task.ClientGeography.split(",").map((s) => s.trim())
          : [],
        LocationCoverage: task.LocationCoverage
          ? task.LocationCoverage.split(",").map((s) => s.trim())
          : [],
      }));
    }
  }, [task]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Update form state
    setForm({ ...form, [name]: value });

    // Remove error message for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };


  const addMandatory = () => {
    setForm({
      ...form,
      MandatoryFields: [...form.MandatoryFields, { fieldName: "", description: "" }]
    });

  };

  const validateForm = () => {
    const requiredFields = [
      "projectName",
      "asignedBy",
      "ProjectCode",
      "TaskIdForPOC",
      "RecordCount",
      "TargetWebsite",
      "BitrixURL",
      "Industry",
      "ClientGeography",
      "LocationCoverage",
      "AdditionalNotes",
      "InputParameter",
      "ScopeOfData",
      "OutputFormat",
      "OutputDeliveryMode",
      "Frequency",
      "Timeline",
      "PurposeOftheProject",
    ];

    const errors: { [key: string]: string } = {};

    for (let key of requiredFields) {
      const value = form[key];

      if (typeof value === "string" && !value.trim()) {
        errors[key] = "This field is required";
      } else if (Array.isArray(value) && value.length === 0) {
        errors[key] = "Please add at least one value";
      } else if (!value) {
        errors[key] = "This field is required";
      }
    }

    // Extra validation for MandatoryFields
    if (Array.isArray(form.MandatoryFields)) {
      form.MandatoryFields.forEach((m, i) => {
        if (!m.fieldName?.trim()) {
          errors[`MandatoryFields_${i}_fieldName`] = "Field Name is required";
        }
        if (!m.description?.trim()) {
          errors[`MandatoryFields_${i}_description`] = "Description is required";
        }
      });
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0; // true if no errors
  };




  const submitForm = async () => {
    if (!validateForm()) return;
    try {
      const payload = {
        ...form,
        ClientGeography: Array.isArray(form.ClientGeography)
          ? form.ClientGeography.map(x => x.label || x.value || x)
          : [],

        LocationCoverage: Array.isArray(form.LocationCoverage)
          ? form.LocationCoverage.map(x => x.label || x.value || x)
          : [],

        Timeline: form.Timeline
          ? form.Timeline.toISOString().split("T")[0]
          : "",
      };

      const res = await fetch(`${apiUrl}/poc/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("POC Creation Response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to create POC");
      }

      toast.success("POC Created Successfully");
      // 📥 AUTO DOWNLOAD FILE (without any button)
      if (data.fileUrl) {
        const fileLink = document.createElement("a");
        fileLink.href = `${apiUrl}${data.fileUrl}`;
        fileLink.download = `POC_${data.data?._id || "file"}.docx`; // optional : rename
        document.body.appendChild(fileLink);
        fileLink.click();
        document.body.removeChild(fileLink);
      }

      setTimeout(() => {
        navigate("/TMS-operations/tasks");
      }, 1500);
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
      </div>;

 

  return (
    <>
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/TMS-operations/" },
          { title: "Tasks", path: "/TMS-operations/tasks" },
          { title: "POC" },
        ]}
      />
      <div className="bg-white min-h-screen py-10 px-4 flex justify-center">
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
          <h1 className="text-3xl font-bold text-[#3C01AF] mb-6">
            Create POC – {task?.title}
          </h1>


          {/* CARD 1 - BASIC INFO */}
          <div className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md">1</div>
              <h2 className="text-base font-semibold text-[#3C01AF]">Basic Information</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 ">
              <div>
                <label className="font-semibold text-gray-700">Project Name<span className="text-red-500">*</span></label>
                <input
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.projectName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.projectName}</p>
                )}
              </div>


              <div>
                <label className="font-semibold text-gray-700">Assigned By<span className="text-red-500">*</span></label>
                <input
                  name="asignedBy"
                  value={form.asignedBy}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.asignedBy && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.asignedBy}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700">Project Code<span className="text-red-500">*</span></label>
                <input
                  name="ProjectCode"
                  value={form.ProjectCode}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.ProjectCode && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.ProjectCode}</p>
                )}
              </div>


            </div>
            <div>
              <label className="font-semibold text-gray-700 flex mt-4">Purpose Of Project<span className="text-red-500">*</span></label>
              <textarea
                name="PurposeOftheProject"
                rows={4}
                value={form.PurposeOftheProject}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
              {formErrors.PurposeOftheProject && (
                <p className="text-red-500 text-sm mt-1">{formErrors.PurposeOftheProject}</p>
              )}
            </div>
          </div>


          {/* CARD 2- TARGET WEBSITE */}
          <div className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md">2</div>
              <h2 className="text-base font-semibold text-[#3C01AF]">Target Websites</h2>
            </div>

            <label className="font-semibold text-gray-700 mb-2 block">Added Websites</label>
            <div className="flex gap-2 flex-wrap">
              {form.TargetWebsite.map((site, index) => (
                <div
                  key={index}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                >
                  <span>{site}</span>
                  <button
                    onClick={() => {
                      const updated = form.TargetWebsite.filter((_, i) => i !== index);
                      setForm({ ...form, TargetWebsite: updated });
                    }}
                    className="ml-2 text-red-600 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <label className="font-semibold text-gray-700 mt-4 block">Add New Domain<span className="text-red-500">*</span></label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="Add new domain..."
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="border p-3 rounded-lg w-full"
              />
              {formErrors.TargetWebsite && (
                <p className="text-red-500 text-sm mt-1">{formErrors.TargetWebsite}</p>
              )}
              <button
                onClick={() => {
                  if (!newDomain.trim()) return;
                  setForm({
                    ...form,
                    TargetWebsite: [...form.TargetWebsite, newDomain.trim()],
                  });
                  setNewDomain("");
                }}
                className="bg-green-500 text-white px-5 py-3 rounded-lg"
              >
                Add
              </button>
            </div>
          </div>




          {/* CARD 3 - PROJECT DETAILS */}
          <div className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md">3</div>
              <h2 className="text-base font-semibold text-[#3C01AF]">Project Configuration</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">

              <div>
                <label className="font-semibold text-gray-700">Record Count<span className="text-red-500">*</span></label>
                <input
                  name="RecordCount"
                  value={form.RecordCount}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.RecordCount && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.RecordCount}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700">Bitrix Task ID<span className="text-red-500">*</span></label>
                <input
                  name="TaskIdForPOC"
                  value={form.TaskIdForPOC}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.TaskIdForPOC && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.TaskIdForPOC}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700">Bitrix URL<span className="text-red-500">*</span></label>
                <input
                  name="BitrixURL"
                  value={form.BitrixURL}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.BitrixURL && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.BitrixURL}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700">Industry<span className="text-red-500">*</span></label>
                <select
                  name="Industry"
                  value={form.Industry}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full bg-white"
                >
                  <option value="" hidden>Select Industry</option>
                  <option value="E-com">E-com</option>
                  <option value="Food">Food</option>
                  <option value="Q-com">Q-com</option>
                  <option value="Sports">Sports</option>
                  <option value="Travel">Travel</option>
                  <option value="OTT">OTT</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Gov">Gov</option>
                  <option value="Event">Event</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Music">Music</option>
                </select>
                {formErrors.Industry && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.Industry}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700">Client Geography<span className="text-red-500">*</span></label>
                <Autocomplete
                  multiple
                  options={countries}
                  value={form.ClientGeography || []}
                  onChange={(_, value) => {
                    setForm({ ...form, ClientGeography: value });

                    // Clear error when user changes selection
                    if (formErrors.ClientGeography) {
                      setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.ClientGeography;
                        return newErrors;
                      });
                    }
                  }}
                  disablePortal
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select countries" />
                  )}
                  className="w-full"
                />
                {formErrors.ClientGeography && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.ClientGeography}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700">Location Coverage<span className="text-red-500">*</span></label>
                <Autocomplete
                  multiple
                  options={countries}
                  value={form.LocationCoverage || []}
                  onChange={(_, value) => {
                    setForm({ ...form, LocationCoverage: value });

                    // Clear error when user changes selection
                    if (formErrors.LocationCoverage) {
                      setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.LocationCoverage;
                        return newErrors;
                      });
                    }
                  }}
                  disablePortal
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select countries" />
                  )}
                  className="w-full"
                />
                {formErrors.LocationCoverage && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.LocationCoverage}</p>
                )}

              </div>

              <div>
                <label className="font-semibold text-gray-700">Input Parameter<span className="text-red-500">*</span></label>
                <input
                  name="InputParameter"
                  value={form.InputParameter}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.InputParameter && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.InputParameter}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700">Scope Of Data<span className="text-red-500">*</span></label>
                <input
                  name="ScopeOfData"
                  value={form.ScopeOfData}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.ScopeOfData && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.ScopeOfData}</p>
                )}
              </div>

              {/* <div>
                <label className="font-semibold text-gray-700">Output Attributes</label>
                <input
                  name="OutputAttributes"
                  value={form.OutputAttributes}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
              </div> */}

              {/* <div>
                <label className="font-semibold text-gray-700">Output Format</label>
                <input
                  name="OutputFormat"
                  value={form.OutputFormat}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
              </div> */}

              <div>
                <label className="font-semibold text-gray-700">Output Format<span className="text-red-500">*</span></label>

                <select
                  name="OutputFormat"
                  value={form.OutputFormat}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full bg-white"
                >
                  <option value="" hidden>Select Output Format</option>
                  <option value="JSON">JSON</option>
                  <option value="CSV">CSV</option>
                  <option value="Parquet">Parquet</option>
                  <option value="Excel">Excel (XLSX)</option>
                  <option value="SQL">SQL Insert Format</option>
                  <option value="API">API</option>
                </select>
                {formErrors.OutputFormat && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.OutputFormat}</p>
                )}
              </div>


              {/* <div>
                <label className="font-semibold text-gray-700">Output Delivery Mode</label>
                <input
                  name="OutputDeliveryMode"
                  value={form.OutputDeliveryMode}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
              </div> */}
              <div>
                <label className="font-semibold text-gray-700">Output Delivery Mode<span className="text-red-500">*</span></label>

                <select
                  name="OutputDeliveryMode"
                  value={form.OutputDeliveryMode}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full bg-white"
                >
                  <option value="" hidden>Select Output Delivery Mode</option>
                  <option value="Email">Email</option>
                  <option value="Secure Download Link">Secure Download Link</option>
                  <option value="API Response">API Response</option>
                  <option value="Google Sheet">Google Sheet</option>
                  <option value="Database Insert (direct push to client DB)">
                    Database Insert (direct push to client DB)
                  </option>
                </select>
                {formErrors.OutputDeliveryMode && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.OutputDeliveryMode}</p>
                )}
              </div>
              <div>
                <label className="font-semibold text-gray-700">Frequency<span className="text-red-500">*</span></label>
                <input
                  name="Frequency"
                  value={form.Frequency}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.Frequency && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.Frequency}</p>
                )}
              </div>

              <div>


                <div className="grid grid-cols-1">
                  <label className="font-semibold text-gray-700">Timeline<span className="text-red-500">*</span></label>
                  <DatePicker
                    selected={form.Timeline || null}
                    onChange={(date) => {
                      if (date instanceof Date && !isNaN(date)) {
                        setForm({ ...form, Timeline: date }); // store raw Date

                        if (formErrors.Timeline) {
                          setFormErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.Timeline;
                            return newErrors;
                          });
                        }
                      }
                    }}

                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select Timeline"
                    className="border p-3 rounded-lg w-full"
                    showPopperArrow={false}
                    // ❌ Disable manual typing
                    onKeyDown={(e) => e.preventDefault()}
                    maxDate={new Date()}
                  />
                  {formErrors.Timeline && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.Timeline}</p>
                  )}
                </div>



              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-gray-700">Additional Notes<span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  name="AdditionalNotes"
                  value={form.AdditionalNotes}
                  onChange={handleChange}
                  className="border p-3 rounded-lg w-full"
                />
                {formErrors.AdditionalNotes && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.AdditionalNotes}</p>
                )}
              </div>

            </div>
          </div>



          {/* CARD 4 - MANDATORY FIELDS */}
          <div className="bg-white border border-blue-200 rounded-2xl shadow-md shadow-blue-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#3C01AF] text-white text-sm font-bold px-3 py-1.5 rounded-md">4</div>
              <h2 className="text-base font-semibold text-[#3C01AF]">Mandatory Fields</h2>
            </div>

            {/* {form.MandatoryFields.map((m, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 mb-3">

                <div>
                  <label className="font-semibold text-gray-700">Field Name<span className="text-red-500">*</span></label>
                  <input
                    value={m.fieldName}
                    onChange={(e) => {
                      const newFields = [...form.MandatoryFields];
                      newFields[i].fieldName = e.target.value;
                      setForm({ ...form, MandatoryFields: newFields });

                      // Clear error for this field as user types
                      const errorKey = `MandatoryFields_${i}_fieldName`;
                      if (formErrors[errorKey]) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    }}
                    className="border p-3 rounded-lg w-full"
                  />
                  {formErrors[`MandatoryFields_${i}_fieldName`] && (
                    <p className="text-red-500 text-sm mt-1">{formErrors[`MandatoryFields_${i}_fieldName`]}</p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Description<span className="text-red-500">*</span></label>
                  <input
                    value={m.description}
                    onChange={(e) => {
                      const newFields = [...form.MandatoryFields];
                      newFields[i].description = e.target.value;
                      setForm({ ...form, MandatoryFields: newFields });

                      // Clear error for this field as user types
                      const errorKey = `MandatoryFields_${i}_description`;
                      if (formErrors[errorKey]) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    }}
                    className="border p-3 rounded-lg w-full"
                  />
                  {formErrors[`MandatoryFields_${i}_description`] && (
                    <p className="text-red-500 text-sm mt-1">{formErrors[`MandatoryFields_${i}_description`]}</p>
                  )}
                </div>
              </div>
            ))} */}
            {form.MandatoryFields.map((m, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 mb-3 relative">

                <div>
                  <label className="font-semibold text-gray-700">
                    Field Name {i === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    value={m.fieldName}
                    onChange={(e) => {
                      const newFields = [...form.MandatoryFields];
                      newFields[i].fieldName = e.target.value;
                      setForm({ ...form, MandatoryFields: newFields });

                      const errorKey = `MandatoryFields_${i}_fieldName`;
                      if (formErrors[errorKey]) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    }}
                    className="border p-3 rounded-lg w-full"
                  />
                  {formErrors[`MandatoryFields_${i}_fieldName`] && (
                    <p className="text-red-500 text-sm mt-1">{formErrors[`MandatoryFields_${i}_fieldName`]}</p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-gray-700">
                    Description {i === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    value={m.description}
                    onChange={(e) => {
                      const newFields = [...form.MandatoryFields];
                      newFields[i].description = e.target.value;
                      setForm({ ...form, MandatoryFields: newFields });

                      const errorKey = `MandatoryFields_${i}_description`;
                      if (formErrors[errorKey]) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    }}
                    className="border p-3 rounded-lg w-full"
                  />
                  {formErrors[`MandatoryFields_${i}_description`] && (
                    <p className="text-red-500 text-sm mt-1">{formErrors[`MandatoryFields_${i}_description`]}</p>
                  )}
                  {/* Only allow removal of optional rows (i > 0) */}
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.MandatoryFields.filter((_, idx) => idx !== i);
                        setForm({ ...form, MandatoryFields: updated });

                        // Remove errors for this row
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[`MandatoryFields_${i}_fieldName`];
                          delete newErrors[`MandatoryFields_${i}_description`];
                          return newErrors;
                        });
                      }}
                      className="absolute top-0 right-0 text-red-600 font-bold px-2 py-1 hover:bg-red-100 rounded"
                    >
                      ❌
                    </button>
                  )}
                </div>


              </div>
            ))}


            <button
              onClick={addMandatory}
              className="bg-green-500 text-white px-4 py-2 rounded-lg mt-3"
            >
              + Add Mandatory Field
            </button>
          </div>


          {/* BUTTONS */}
          <div className="flex justify-end gap-4 mt-8">
            <button onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg">
              Cancel
            </button>
            <button onClick={submitForm}
              className="px-8 py-3 bg-[#3C01AF] text-white rounded-lg">
              Genrate POC
            </button>
          </div>
        </div>
      </div>
    </>
  );

};


export default CreatePOC;
