import Task from "../models/Task.js";
import User from "../models/User.js";

import { TaskDB2 } from "../models/TaskDB2.js";
import { UserDB2 } from "../models/UserDB2.js";

import ActivityLog from "../models/ActivityLog.js";
import { sendSlackMessage } from "../utils/sendSlackMessage.js";
import mongoose from "mongoose";
import { jwtDecode } from "jwt-decode";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { generateSOWDocxFromTemplate } from "../utils/generateSOWDocx.js";
import POC from "../models/POC.js";
import { log } from "console";

dotenv.config();

/* ------------------ Helpers ------------------ */

const encodeKey = (key) => typeof key === "string" ? key.replace(/\./g, "‧") : key;
const decodeKey = (key) => typeof key === "string" ? key.replace(/‧/g, ".") : key;

const space = '\u2003';

const encodeDevelopers = (devs) => {
  if (!devs) return devs;
  if (typeof devs === "string") {
    try { devs = JSON.parse(devs); } catch { }
  }
  if (Array.isArray(devs)) return devs;
  const out = {};
  const entries = devs instanceof Map ? Array.from(devs.entries()) : Object.entries(devs);
  for (const [k, v] of entries) out[encodeKey(k)] = v;
  return out;
};

const decodeDevelopers = (devs) => {
  if (!devs) return devs;
  if (Array.isArray(devs)) return devs;
  const out = {};
  const entries = devs instanceof Map ? Array.from(devs.entries()) : Object.entries(devs);
  for (const [k, v] of entries) out[decodeKey(k)] = v;
  return out;
};

const decodeSubmissions = (subs) => {
  if (!subs) return subs;
  const out = {};
  if (subs instanceof Map) {
    for (const [k, v] of subs.entries()) out[decodeKey(k)] = v;
  } else if (typeof subs === "object" && !Array.isArray(subs)) {
    for (const k of Object.keys(subs)) out[decodeKey(k)] = subs[k];
  }
  return out;
};

const cleanBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const cleaned = {};
  for (const key of Object.keys(body)) {
    const value = body[key];
    if (value === undefined) continue;
    cleaned[key] = value === "" || value === "null" || value === "undefined" ? null : value;
  }
  return cleaned;
};

const normalizeEnum = (value, allowedValues, defaultValue) => {
  if (!value) return defaultValue;
  const formatted = String(value).trim().toLowerCase();
  const match = allowedValues.find(v => v.toLowerCase() === formatted);
  return match || defaultValue;
};

export const computeTaskOverallStatus = (task) => {
  if (!task.domains || !task.domains.length) return task.status;
  let hasRD = false, hasDelay = false;
  for (const d of task.domains) {
    if (d.status === "in-R&D") hasRD = true;
    else if (d.status === "delayed") hasDelay = true;
  }
  if (hasRD) return "in-R&D";
  if (hasDelay) return "delayed";
  return task.status;
};

const safeParseArray = (value) => {
  if (!value) return [];

  let parsedArray = [];

  // 1. If it's already an array, use it.
  if (Array.isArray(value)) {
    parsedArray = value;
  }
  // 2. If it's a string, try to JSON parse it.
  else if (typeof value === "string") {
    try {
      // Attempt to parse it as a JSON array (e.g., '["url1", "url2"]')
      const jsonParsed = JSON.parse(value);
      if (Array.isArray(jsonParsed)) {
        parsedArray = jsonParsed;
      } else {
        // If parsing didn't result in an array, treat the original string as a single item.
        parsedArray = [value];
      }
    } catch (e) {
      // If JSON parsing failed, treat the original string as a single item.
      parsedArray = [value];
    }
  }


  const cleaned = Array.from(new Set(
    parsedArray
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item !== "")
  ));

  return cleaned;
};



/* ------------------ Controllers ------------------ */

// CREATE TASK
export const createTask = async (req, res) => {

  // console.log("🔍 Received Domains in Backend:", req.body);
  // console.log("Received File:", req.file);


  try {
    const raw = req.body || {};
    const developers = encodeDevelopers(raw.developers);
    // console.log("🔍 Received Domains in Backend:", req.body.domains);


    /* ------------------ Auth Check ------------------ */
    let assignedByUserId =
      req.user?._id || req.userId || req.user?.id || null;

    if (!assignedByUserId) {
      return res.status(401).json({
        error: "Unauthorized: User session is invalid or missing.",
      });
    }

    /* ------------------ Safe parsing ------------------ */
    const sowUrls = safeParseArray(raw.sowUrls);
    const inputUrls = safeParseArray(raw.inputUrls);
    const clientSampleSchemaUrls = safeParseArray(raw.clientSampleSchemaUrls);
    const outputFormat = safeParseArray(raw.oputputFormat);

    /* ------------------ Domain Details Handling ------------------ */
    let domains = raw.domains;
    if (typeof domains === "string") {
      try {
        domains = JSON.parse(domains);
      } catch {
        domains = [];
      }
    }

    if (!Array.isArray(domains)) domains = [];

    // Ignore remark, only store name + typeOfPlatform
    const formattedDomains = domains.map((d) => ({
      name: d.domain || d.name || "",
      typeOfPlatform: d.typeOfPlatform || "",
      domainRemarks: d.domainRemarks || "",
    }));

    /* ------------------ Task Code Logic ------------------ */
    const lastTask = await Task.findOne().sort({ createdAt: -1 }).lean();
    let nextNum = 1;
    if (lastTask?.projectCode) {
      const parts = lastTask.projectCode.split("-");
      const lastNum = parseInt(parts[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const projectCode = `RD-${String(nextNum).padStart(3, "0")}`;

    /* ------------------ Date setup ------------------ */
    const assignedDate = new Date();
    const targetDate = new Date();
    targetDate.setDate(assignedDate.getDate() + 2);

    const sowFilePath = await generateSOWDocxFromTemplate({
      title: raw.title,
      date: new Date().toLocaleDateString(),
      typeOfDelivery: raw.typeOfDelivery,
      domains: formattedDomains,
      inputDescription: raw.inputUrls,
      mandatoryFields: raw.mandatoryFields,
      optionalFields: raw.optionalFields,
      outputFormat: outputFormat,
      clientSampleSchemaUrls: raw.clientSampleSchemaUrls,
      frequency: raw.frequency,
      description: raw.description,
      RPM: raw.RPM,

    },
      {},
      "create"
    );

    /* ------------------ Task creation ------------------ */
    const taskData = {
      ...raw,
      projectCode,
      developers,
      domains: formattedDomains, // ✅ use formattedDomains here
      taskAssignedDate: assignedDate,
      targetDate,
      sowFiles: [sowFilePath],
      inputFiles: req.files?.inputFile?.map((f) => `uploads/${f.filename}`) || [],
      clientSampleSchemaFiles:
        req.files?.clientSampleSchemaFiles?.map((f) => `uploads/${f.filename}`) || [],
      sowUrls,
      inputUrls,
      clientSampleSchemaUrls,
      assignedBy: assignedByUserId,
    };

    const task = new Task(taskData);
    await task.save();

    /* ------------------ Activity Log ------------------ */
    for (const d of formattedDomains) {
      await ActivityLog.create({
        taskId: task._id,
        domainName: d.name,     // 👈 EXACT domain
        action: "Task Created",
        changedBy: req.user?.name || "Unknown User",
        role: req.user?.role || "Unknown Role",
        timestamp: new Date(),
      });
    }


    /* ------------------ Slack Notification ------------------ */
    const assignedUser = await User.findById(assignedByUserId).lean();
     const slackTag = assignedUser?.slackId ? `<@${assignedUser.slackId}>` : "";
   // const assignedToUser = await User.findById(raw.assignedTo).lean();
    // const assignedToSlackTag =
    //   assignedToUser?.slackId
    //     ? `<@${assignedToUser.slackId}>`
    //     : assignedToUser?.email;

    const dashboardUrl = `${process.env.FRONTEND_URL}/tasks`;

    const admin=`<@${process.env.SLACK_ID_VISHAL}>`

    const slackMessage = `
        :bell: *New Task Assigned*
        :briefcase: *Task:* ${raw.title}
        :bust_in_silhouette: *Assigned By:* ${slackTag} (Sales)
        :date: *Assigned To:* ${admin} (Manager)
        :memo: *Details:* Please review feasibility and assign to a developer accordingly.
        :link: *View Task:* <${dashboardUrl}|Open Dashboard>
        CC: <@${process.env.SLACK_ID_DEEP}>, <@${process.env.SLACK_ID_VISHAL}>,<@${process.env.SLACK_ID_SUNIL}>
      `;

    await sendSlackMessage(process.env.SALES_OP_CHANNEL, slackMessage);



    const obj = task.toObject();
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});
    res.status(201).json(obj);
  } catch (err) {
    console.error("CreateTask Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }

};

//
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const body = cleanBody(req.body);

    //console.log("req.body", req.body);

    const urlFields = ["sowUrls", "inputUrls", "outputUrls", "clientSampleSchemaUrls"];

    // Parse stringified arrays (from FormData)
    urlFields.forEach((field) => {
      if (body[field] !== undefined) body[field] = safeParseArray(body[field]);
    });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const before = JSON.parse(JSON.stringify(task.toObject()));


    // ✅ Update other basic fields

    const fieldsToUpdate = [
      "title",
      "assignedBy",
      "assignedTo",
      "description",
      "sampleFileRequired",
      "requiredValumeOfSampleFile",
      "complexity",
      "status",
      "typeOfDelivery",
      "typeOfPlatform",
    ];

    fieldsToUpdate.forEach((f) => {
      if (body[f] !== undefined) {
        if (f === "sampleFileRequired") task[f] = body[f] === "true";
        else if (f === "requiredValumeOfSampleFile") task[f] = Number(body[f]);
        else task[f] = body[f];
      }
    });




    let incomingDomains = [];
    if (body.domains) {
      try {
        // Parse incoming domains (from a stringified array/JSON if sent via FormData)
        incomingDomains =
          typeof body.domains === "string" ? JSON.parse(body.domains) : body.domains;
      } catch (e) {
        console.error("Failed to parse incoming domains:", e);
      }
    }

    // Create a map of existing domains for quick lookup
    const existingDomainsMap = new Map(
      task.domains.map((d) => [d.name, d])
    );

    const finalDomains = [];

    incomingDomains.forEach((incomingDomain) => {
      const existingDomain = existingDomainsMap.get(incomingDomain.name);

      if (existingDomain) {

        existingDomain.typeOfPlatform = incomingDomain.typeOfPlatform || existingDomain.typeOfPlatform;
        existingDomain.domainRemarks =
          incomingDomain.domainRemarks || existingDomain.domainRemarks || "";

        finalDomains.push(existingDomain);
      } else {

        finalDomains.push({
          name: incomingDomain.name,
          status: "pending",
          typeOfPlatform: incomingDomain.typeOfPlatform || "",
          domainRemarks: incomingDomain.domainRemarks || "",
          developers: [],
          submission: {
            outputFiles: [],
            outputUrls: []
          },
        });
      }
    });
    task.domains = finalDomains;
    task.markModified("domains");

    if (body.developers) {
      const devObj =
        typeof body.developers === "string"
          ? JSON.parse(body.developers)
          : body.developers;

      const newAssignedDevs = new Set();

      for (const domain of task.domains) {
        const existingDevs = new Set((domain.developers || []).map(d => String(d)));

        const devsForDomain = devObj[domain.name] || [];
        const uniqueDevs = [];

        for (const dev of devsForDomain) {
          const devId = typeof dev === "object" ? dev._id : dev;

          if (mongoose.Types.ObjectId.isValid(devId)) {
            uniqueDevs.push(devId);

            if (!existingDevs.has(String(devId))) {
              newAssignedDevs.add(devId); // mark as newly added
            }
          }
        }

        domain.developers = uniqueDevs;
        domain.status =
          domain.status === "submitted"
            ? "submitted"
            : uniqueDevs.length > 0
              ? "in-progress"
              : "pending";
      }

      task.markModified("domains");

      if (newAssignedDevs.size > 0) {
        req.newAssignedDevs = Array.from(newAssignedDevs);
      }
    }

    const after = JSON.parse(JSON.stringify(task.toObject()));


    // ✅ Convert current state and a fresh copy from DB to plain objects for comparison
    const originalTask = await Task.findById(id).lean();



    // 🧠 Compare objects to check if *anything* changed
    const hasChanges = JSON.stringify(task.toObject()) !== JSON.stringify(originalTask);



    function domainChanged(before, after) {
      if (!before || !after) return true;

      if (before.typeOfPlatform !== after.typeOfPlatform) return true;
      if (before.domainRemarks !== after.domainRemarks) return true;
      if (before.status !== after.status) return true;

      if (JSON.stringify(before.developers) !== JSON.stringify(after.developers)) return true;
      if (JSON.stringify(before.submission) !== JSON.stringify(after.submission)) return true;

      return false;
    }

    let changedDomains = [];

    for (const d of incomingDomains) {
      const beforeDomain = before.domains.find(b => b.name === d.name);
      const afterDomain = after.domains.find(a => a.name === d.name);

      if (domainChanged(beforeDomain, afterDomain)) {
        changedDomains.push(d.name);
      }
    }

    const originalDomainNames = before.domains.map(d => d.name);
    const incomingDomainNames = incomingDomains.map(d => d.name);

    const deletedDomains = originalDomainNames.filter(
      name => !incomingDomainNames.includes(name)
    );

    changedDomains.push(...deletedDomains);



    if (changedDomains.length > 0) {
      await task.save();

      for (const domain of changedDomains) {
        await ActivityLog.create({
          taskId: task._id,
          domainName: domain,
          action: deletedDomains.includes(domain) ? "Domain Deleted" : "Task Updated",
          changedBy: req.user?.name || "Unknown User",
          role: req.user?.role || "Unknown Role",
          timestamp: new Date(),
        });
      }

      console.log("✔ Logs created for:", changedDomains);
    } else {
      console.log("ℹ No domain changes — no logs created");
    }

    try {
      const populatedTask = await Task.findById(id)
        .populate("domains.developers", "name email slackId")
        .lean();

      const assignedDevs = [];
      populatedTask.domains.forEach((d) => {
        if (Array.isArray(d.developers) && d.developers.length > 0) {
          assignedDevs.push(...d.developers);
        }
      });

      // ✅ Only notify if NEW devs assigned

      if (req.newAssignedDevs && req.newAssignedDevs.length > 0) {
        const assignedBy = await User.findById(populatedTask.assignedTo).lean();
        const slackTag_AssignedBy = assignedBy?.slackId ? `<@${assignedBy.slackId}>` : assignedBy?.email;

        // ✅ Get NEW developer users
        const newDevs = await User.find({ _id: { $in: req.newAssignedDevs } }).lean();
        const slackTag_Devs = newDevs
          .map(d => d.slackId ? `<@${d.slackId}>` : d.email)
          .join(", ");

        const taskUrl = `${process.env.FRONTEND_URL}/tasks`;



        const slackMessage = `
:bell: *New Task Assigned to ${slackTag_Devs}*
     ${space}:briefcase: *Task Name:* ${populatedTask.title || populatedTask.projectCode}
     ${space}:bust_in_silhouette: *Assigned By:* ${slackTag_AssignedBy} (Manager)
     ${space}:date: *Assigned To:* ${slackTag_Devs} (TL)
     ${space}:paperclip: *Details:* Please proceed with the assigned feasibility check and submit in the dashboard.
     ${space}:link: *View Task:* <${taskUrl}|Open Dashboard>
CC: <@${process.env.SLACK_ID_DEEP}>,<@${process.env.SLACK_ID_VISHAL}>

`;
        await sendSlackMessage(process.env.OP_CHANNEL, slackMessage);
      }


    } catch (err) {
      console.error("⚠️ Slack Notification Error:", err.message);
    }

    res.json({ message: "✅ Task updated successfully", task });
  } catch (err) {
    console.error("UpdateTask Error:", err);
    res
      .status(500)
      .json({ error: err.message || "Server error while updating task" });
  }
};

// SUBMIT TASK
export const submitTask = async (req, res) => {

  try {
    const { id } = req.params;

    const body = req.body;   // ← DO NOT CLEAN FILE FORM DATA!

    // console.log(req.body);
    // console.log("this nkodsmnvpifs", req.files)
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });



    // Safely parse domains from body, ensuring it's an array
    let domains = [];
    if (body.domain) {
      try {
        // Try parsing as JSON
        domains = typeof body.domain === "string" ? JSON.parse(body.domain) : body.domain;
        if (!Array.isArray(domains)) domains = [domains]; // wrap single value into array
      } catch {
        // If JSON.parse fails, treat it as a single string
        domains = [body.domain];
      }
    }

    if (!Array.isArray(domains)) domains = [domains];

    //const outputFiles = req.files?.outputFiles?.map(f => `uploads/${f.filename}`) || [];
    const newOutputFiles = Array.isArray(req.files?.outputFiles)
      ? req.files.outputFiles.map(f => `uploads/${f.filename}`)
      : [];
    if (typeof body.country === "string") {
      body.country = body.country.split(",").map(s => s.trim());
    }


    // 🔥 FIX: 2. Store the new file paths into the main task document
    if (newOutputFiles.length > 0) {
      task.outputFiles = [...(task.outputFiles || []), ...newOutputFiles];
    }

    if (body.outputUrls) {
      // Assuming outputUrls from the body is the final array of URLs
      task.outputUrls = typeof body.outputUrls === 'string' ? JSON.parse(body.outputUrls) : body.outputUrls;
    }

    // Use the *updated* array from the task object for submissionData
    const submissionOutputFiles = task.outputFiles || [];
    const submissionOutputUrls = task.outputUrls || [];

    const getScalar = (v) => (Array.isArray(v) ? v[0] : v);
    const getArray = (v) => {
      if (v === undefined || v === null) return [];

      // 1. If it's already an array, flatten it and process elements
      if (Array.isArray(v)) {
        let result = [];
        v.forEach(item => {
          // Recursively process array items to handle nested arrays/strings
          result = result.concat(getArray(item));
        });
        // Remove duplicates
        return [...new Set(result.filter(Boolean))];
      }

      // 2. If it's a string, first attempt JSON parsing (for array strings from FormData)
      if (typeof v === 'string') {
        try {
          const parsed = JSON.parse(v);
          // If parsing yields an array, recursively process it
          if (Array.isArray(parsed)) {
            return getArray(parsed);
          }
        } catch (e) {
          // JSON parsing failed, assume it's a simple string.
        }

        // 3. Check for comma-separated values (the root cause of "Afghanistan,Anguilla")
        // This splits the string only if it contains a comma.
        if (v.includes(',')) {
          // Split by comma, trim whitespace from each part, and filter out empty strings
          return v.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }

        // 4. Otherwise, return the single string value wrapped in an array
        return [v];
      }

      // 5. Default: return single non-array, non-string value in an array
      return [v];
    };

    const submissionData = {
      platform: body.platform,
      typeOfDelivery: normalizeEnum(body.typeOfDelivery, ["api", "data as a service", "both(api & data as a service)"]),
      typeOfPlatform: normalizeEnum(body.typeOfPlatform, ["web", "app", "both (app & web)"]),
      complexity: normalizeEnum(body.complexity, ["Low", "Medium", "High", "Very High"]),
      // userLogin: body.userLogin === true || body.userLogin === "true",
      // proxyUsed: body.proxyUsed === true || body.proxyUsed === "true",
      // feasible: body.feasible === true || body.feasible === "true",
      country: getArray(body.country),
      feasibleFor: getScalar(body.feasibleFor),
      approxVolume: getScalar(body.approxVolume),
      method: getScalar(body.method),
      userLogin: getScalar(body.userLogin),
      loginType: getScalar(body.loginType),
      complexity: getScalar(body.complexity),
      //typeOfDelivery: getScalar(body.typeOfDelivery),
      //typeOfPlatform: getScalar(body.typeOfPlatform),
      apiName: getScalar(body.apiName),
      proxyUsed: getScalar(body.proxyUsed),
      feasible: getScalar(body.feasible),
      proxyName: getScalar(body.proxyName),
      perRequestCredit: Number(getScalar(body.perRequestCredit)),
      totalRequest: Number(getScalar(body.totalRequest)),
      lastCheckedDate: getScalar(body.lastCheckedDate),
      githubLink: getScalar(body.githubLink),
      outputFiles: submissionOutputFiles,
      outputUrls: submissionOutputUrls,
      loginType: getScalar(body.loginType),
      credentials: getScalar(body.credentials),
      status: body.status ? String(body.status).toLowerCase() : "submitted",
      remark: getScalar(body.remark || "")
    };

    if (!task.submissions || typeof task.submissions !== "object") task.submissions = {};

    // Helper to set submission data on the task's submission map
    const setSubmission = (key, data) => {
      if (task.submissions instanceof Map) task.submissions.set(key, data);
      else task.submissions[key] = data;
    };

    let allDomainsSubmitted = false;

    // 1. Save submission data keyed by domain name (or directly to task if no domains)
    if (domains.length > 0) {
      domains.forEach(d => {
        const key = typeof d === "object" ? d.name : d;
        setSubmission(key, submissionData);
      });
    } else {
      // For tasks without explicit domains, apply submission data directly
      Object.assign(task, submissionData);
      setSubmission("default", submissionData); // Also save to map for completeness
    }

    // 2. FIX: Update domain statuses in the task.domains array and check overall status
    if (task.domains && Array.isArray(task.domains) && task.domains.length > 0) {
      // Update the status of the submitted domain(s)
      domains.forEach(d => {
        const domainName = typeof d === "object" ? d.name : d;
        const domainIndex = task.domains.findIndex(td => td.name === domainName);
        if (domainIndex !== -1) {
          task.domains[domainIndex].status = submissionData.status;
          task.domains[domainIndex].completeDate = new Date();
          task.domains[domainIndex].submission = submissionData; // Save submission details on the domain object
        }
      });

      // Check if ALL domains are now submitted
      allDomainsSubmitted = task.domains.every(d => d.status === "submitted");

    } else {
      // If no domains were defined, the single submission determines the overall status
      allDomainsSubmitted = submissionData.status === "submitted";
    }

    // 3. Update the overall task status based on domain status check
    if (allDomainsSubmitted) {
      task.status = "submitted";
      task.completeDate = new Date();
    } else {
      // If at least one submission was made, but not all domains are complete, 
      // ensure the overall status moves from 'pending' to 'in-progress'.
      if (submissionData.status === "submitted" && task.status === "pending") {
        task.status = "in-progress";
      }
      // If it was already "in-progress", it remains "in-progress"
    }

    await task.save();
    // ✅ Determine which domain(s) were submitted
    const submittedDomainNames = Array.isArray(domains)
      ? domains.map((d) => (typeof d === "string" ? d : d.name)).join(", ")
      : (typeof domains === "string" ? domains : domains?.name || null);

    // ✅ Create Activity Log
    await ActivityLog.create({
      taskId: task._id,
      domainName: submittedDomainNames || null,
      action: "Task Submitted",
      changedBy: req.user?.name || "Unknown User",
      role: req.user?.role || "Unknown Role",
      timestamp: new Date(),
    });

    const obj = task.toObject();

    const space = "   ";

    const domainInfoLines = `${task.domains
      .map((d) => {
        const sub = d.submission || {};
        const feasible = sub.feasible === true || sub.feasible === "true" ? "Yes" : "No";
        const proxy = sub.proxyUsed === true || sub.proxyUsed === "true";

        const proxyLine = proxy
          ? `Yes, Credit: ${sub.perRequestCredit || 0}, Name: ${sub.proxyName || "-"}, Request: ${sub.totalRequest || 0}`
          : "No";

        return (
          `• \`${d.name}\`\n` +
          `   \`Feasible: ${feasible}\`\n` +
          `   \`Proxy: ${proxyLine}\``
        );
      })
      .join("\n")}`;

    try {
      // fetch assigner & submitter user info
      const assigner = await User.findById(task.assignedBy).lean();

      // submitted dev id = first developer on that domain OR assignedTo fallback
      let submittedDevId;
      if (task.domains?.length) {
        for (const d of task.domains) {
          if (domains.includes(d.name) && d.developers?.length) {
            submittedDevId = d.developers[0];
            break;
          }
        }
      }
      if (!submittedDevId) submittedDevId = task.assignedTo;

      const dev = await User.findById(submittedDevId).lean();

      // ✅ Normalize submitted domain names
      const submittedDomainNames = [
        ...new Set(domains.map(d => typeof d === "object" ? d.name : d))
      ];

      // ✅ Find developers for submitted domain(s) & map to Slack IDs
      let submittedDevelopers = [];
      if (task.domains?.length) {
        submittedDomainNames.forEach(dName => {
          const domain = task.domains.find(td => td.name === dName);
          if (domain && Array.isArray(domain.developers)) {
            submittedDevelopers.push(...domain.developers);
          }
        });
      }

      // ✅ Remove duplicates
      submittedDevelopers = [...new Set(submittedDevelopers)];

      // ✅ Convert dev IDs → Slack IDs
      const developerUsers = await User.find({ _id: { $in: submittedDevelopers } }).lean();
      const submittedDevMentions = developerUsers
        .map(u => u.slackId ? `<@${u.slackId}>` : '')
        .filter(Boolean)
        .join(", ") || "N/A";

      const submittedDomainsText = submittedDomainNames.join(", ");

      const proxyUsed = submissionData.proxyUsed === true || submissionData.proxyUsed === "true";
      const feasible = submissionData.feasible === true || submissionData.feasible === "true";


      // const feasibleText = feasible ? "Yes" : "No";

      // const proxyText = proxyUsed
      //   ? `:satellite: Proxy: Yes , Proxy Credit: ${submissionData.perRequestCredit}, Proxy Name: ${submissionData.proxyName}`
      //   : `:satellite: Proxy: No`;


      const taskUrl = `${process.env.FRONTEND_URL}/TMS-operations/tasks`;

      const slackMsg =
        `<@${assigner?.slackId || ''}>
:white_check_mark: *Task Submitted Successfully*
${space}:briefcase: *Task:*  ${task.title || task.projectCode}
${space}:jigsaw: *Domain Details:*
${domainInfoLines}
${space}:bust_in_silhouette: *Assigned By:* <@${assigner?.slackId || ''}> (Sales)
${space}:female-technologist: *Submitted By:* <@${dev?.slackId || ''}> (TL)
${space}:paperclip: *Details:* Sample data and feasibility report have been uploaded. Please review and confirm.
${space}:bar_chart: *View Task:*  <${taskUrl}|Open Dashboard>
CC: <@${process.env.SLACK_ID_DEEP}>,<@${process.env.SLACK_ID_VISHAL}>,<@${process.env.SLACK_ID_SUNIL}>
`;


      const taskAssigner = await User.findById(task.assignedBy).lean();

      const slackMsg2 =
        `:white_check_mark: *Task Submitted Successfully*
     ${space}:briefcase: *Task:*  ${task.title || task.projectCode}
     ${space}:female-technologist: *Submitted By:* <@${dev?.slackId || ''}> (TL)
     ${space}:paperclip: *Details:* Sample data and feasibility report have been uploaded. Please review and confirm.
     ${space}:bar_chart: *View Task:*  <${taskUrl}|Open Dashboard>
CC: <@${process.env.SLACK_ID_DEEP}>,<@${process.env.SLACK_ID_VISHAL}>
`

      // ✅ Send to 2 channels
      try {
        if (allDomainsSubmitted) {
          await sendSlackMessage(process.env.SALES_OP_CHANNEL, slackMsg);
        }
      } catch (e) {
        console.error("Slack 1 failed:", e.message);
      }

      try {
        await sendSlackMessage(process.env.OP_CHANNEL, slackMsg2);
      } catch (e) {
        console.error("Slack 2 failed:", e.message);
      }


    } catch (err) {
      console.error("⚠️ Slack notify error:", err.message);
    }
    // Assuming these helper functions exist to decode the fields before sending
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});
    res.json(obj);

  } catch (err) {
    console.error("SubmitTask Error:", err);
    console.log("SubmitTask Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// controllers/taskController.js (add/replace function)
export const editDomainSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log("USER IN CONTROLLER:", req.user);

    const {
      domainName,
      domainOutputUrls,
      existingOutputFiles,
      remark,
      ...submissionData
    } = req.body;

    if (!domainName) {
      return res.status(400).json({ message: "domainName is required" });
    }

    // 1. Find the Task
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found." });

    // 2. Parse inputs
    const newUrls = JSON.parse(domainOutputUrls || "{}")[domainName] || [];
    const keptFiles = JSON.parse(existingOutputFiles || "{}")[domainName] || [];

    // 3. New files uploaded
    const newFiles =
      req.files && req.files["newOutputFiles"]
        ? req.files["newOutputFiles"].map((f) => `uploads/${f.filename}`)
        : [];

    // 4. Find the domain to update
    const domain = task.domains.find((d) => d.name === domainName);

    if (!domain) {
      return res.status(404).json({ message: "Domain not found in task" });
    }

    // 5. Build updated submission object
    domain.submission = {
      ...submissionData,
      remark,
      country: JSON.parse(submissionData.country || "[]"),
      outputUrls: newUrls,
      outputFiles: [...keptFiles, ...newFiles],

      // ❌ REMOVE in-review
      status: "submitted", // or "in-progress"
    };

    // 6. Update domain status (remove in-review)
    if (domain.status !== "completed") {
      domain.status = "submitted"; // or "in-progress"
    }

    // 7. Save
    await task.save();

    // 8. Activity Log
    await ActivityLog.create({
      taskId: task._id,
      domainName,
      action: "Domain submission edited",
      role: req.user?.role || "Unknown Role",
      changedBy: req.user?.name || "Unknown",

    });
    //console.log('ChangeBy',req.user?.name);





    // 9. slack message
    const userInfo = await User.findById(req.user.id).select("slackId name");
    const editedBySlack = userInfo?.slackId ? `<@${userInfo.slackId}>` : userInfo?.name;

    //console.log("editedBySlack", editedBySlack);

    const taskUrl = `${process.env.FRONTEND_URL}/TMS-operations/tasks`;

    const slackMessage = `
      :pencil: *Domain Submission Edited*
      ${space}:briefcase: *Task:* ${task.title}
      ${space}:page_facing_up: *Domain:* \`${domainName}\`
      ${space}:bust_in_silhouette: *Edited By:* ${editedBySlack}
      ${space}:paperclip: *Details:* Sample data and feasibility report have been edited. Please review and confirm.
      :link: *View Task:* <${taskUrl}|Open Dashboard>
      CC: <@${process.env.SLACK_ID_DEEP}>,<@${process.env.SLACK_ID_VISHAL},<@${process.env.SLACK_ID_SUNIL}>
    `;


    await sendSlackMessage(process.env.SALES_OP_CHANNEL, slackMessage);


    res.json({
      message: "Domain submission updated successfully",
      task,
    });

  } catch (error) {
    console.error("Error editing submission:", error);
    res.status(500).json({
      message: "Failed to update domain submission",
      error: error.message,
    });
  }
};

// Get All Tasks
export const getTask = async (req, res) => {
  try {

    //await updateDelayedDomainsDebug();
    const { search = "", status = "", page = 1, limit = 10, assignedBy = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const token = req.cookies?.TMSAuthToken;
    let userId, role;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded?.id;
        role = decoded?.role;
      } catch { }
    }
    const match = {};
    const now = new Date();

    await Task.updateMany(
      {
        targetDate: { $lt: now }, // target date passed
        "domains.status": { $in: ["pending", "in-progress"] }, // match both
      },
      {
        $set: {
          "domains.$[elem].status": "delayed",
        },
      },
      {
        arrayFilters: [
          { "elem.status": { $in: ["pending", "in-progress"] } } // filter both
        ],
      }
    );

    /* ---------------- Match before lookups ---------------- */

    if (role === "TL" && userId) {
      match["domains.developers"] = new mongoose.Types.ObjectId(userId);
    }

    if (role === "Manager" && userId) {
      match["assignedTo"] = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      const statusArray = status.split(",").map(s => s.trim());

      match["domains.status"] = { $in: statusArray };
    }



    const tasksAggregate = await Task.aggregate([
      { $match: match }, // initial match (by role, etc.)

      // Lookups for assignedBy, assignedTo
      { $lookup: { from: "users", localField: "assignedBy", foreignField: "_id", as: "assignedBy" } },
      { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },
      // Assigned By Filter
      ...(assignedBy
        ? [
          {
            $match: {
              "assignedBy.name": { $regex: new RegExp(`^${assignedBy}$`, "i") }
            }
          }
        ]
        : []),

      { $lookup: { from: "users", localField: "assignedTo", foreignField: "_id", as: "assignedTo" } },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

      // 🔹 Unwind domains so each domain is a separate row
      { $unwind: { path: "$domains", preserveNullAndEmptyArrays: true } },
      ...(status
        ? [
          {
            $match: {
              "domains.status": { $in: status.split(",").map(s => s.trim()) },
            },
          },
        ]
        : []),

      // 🔹 Lookup developers for this domain
      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "domainDevelopers",
        },
      },


      // 🔹 Search filter (title, domain name, etc.)
      ...(search.trim()
        ? [
          {
            $match: {
              $or: [
                { projectCode: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { "domains.name": { $regex: search, $options: "i" } },
                { "assignedBy.name": { $regex: search, $options: "i" } },
                { "assignedTo.name": { $regex: search, $options: "i" } },
                { "domainDevelopers.name": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
        : []),

      // 🔹 Final projection: show domain-level info clearly
      {
        $project: {
          _id: 1,
          projectCode: 1,
          title: 1,
          description: 1,
          taskAssignedDate: 1,

          assignedBy: {
            name: { $ifNull: ["$assignedBy.name", "-"] },
            role: { $ifNull: ["$assignedBy.role", "-"] }
          },

          assignedTo: {
            name: { $ifNull: ["$assignedTo.name", "-"] },
            role: { $ifNull: ["$assignedTo.role", "-"] }
          },

          domainName: "$domains.name",
          domainStatus: "$domains.status",
          domainDevelopers: {
            $map: {
              input: "$domainDevelopers",
              as: "dev",
              in: "$$dev.name",
            },
          },
          feasible: "$domains.submission.feasible",
          completeDate: { $ifNull: ["$domains.completeDate", "$completeDate"] },
          createdAt: 1,
          targetDate: 1,
          reopenCount: { $ifNull: ["$reopenCount", 0] },
        },
      }
      ,

      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ]);



    let tasksData = tasksAggregate[0]?.data || [];
    //tasksData = applyDelayedStatus(tasksData);

    const total = tasksAggregate[0]?.metadata[0]?.total || 0;

    res.json({
      tasks: tasksData,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("GetTask Aggregation Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

export const getTaskList = async (req, res) => {
  try {
    // Read token from cookie
    const token =
      req.cookies?.TMSAuthToken ||
      req.cookies?.accessToken ||
      req.cookies?.jwt;

    let userId = null;

    // Decode user
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId =
          decoded.id ||
          decoded._id ||
          decoded.userId ||
          decoded.user?._id ||
          decoded.user?.id;


      } catch (e) {
        console.log("JWT decode error", e);
      }
    }

    if (!userId) {
      console.log("No user id found from cookie");
      return res.json({ tasks: [] });
    }

    // Fetch tasks for the logged-in user
    const tasks = await Task.find({
      assignedBy: new mongoose.Types.ObjectId(userId),
    })
      .select("title projectCode assignedBy")
      .populate("assignedBy", "name role")
      .sort({ createdAt: -1 });




    // Attach POC information to each task
    const tasksWithPOC = await Promise.all(
      tasks.map(async (task) => {
        const poc = await POC.findOne({ taskId: task._id });

        return {
          ...task.toObject(),
          hasPOC: poc?.generatedPOCFile ? true : false,
          pocFileName: poc?.generatedPOCFile || null,
          pocId: poc?._id || null,
        };
      })
    );

    // FINAL RETURN (only this one)
    return res.status(200).json({ tasks: tasksWithPOC });

  } catch (err) {
    console.error("Task List Error", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getSingleTaskList = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(id)
      .populate("assignedBy", "name email")
      .populate("frequency")
      .populate("oputputFormat")
      .populate("domains")
      .populate("domains")
      .populate("oputputFormat")
      .lean();


    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task });
  } catch (err) {
    console.error("Error fetching single task:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET SINGLE TASK 
export const getSingleTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Join Assigned By User
      {
        $lookup: {
          from: "users",
          localField: "assignedBy",
          foreignField: "_id",
          as: "assignedBy",
        },
      },
      { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },

      // Join Assigned To User
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

      // Join Domain Developers
      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "domainDevelopers",
        },
      },

      {
        $addFields: {
          domains: {
            $map: {
              input: "$domains",
              as: "dom",
              in: {
                $mergeObjects: [
                  "$$dom",
                  {
                    developers: {
                      $filter: {
                        input: "$domainDevelopers",
                        as: "dev",
                        cond: { $in: ["$$dev._id", "$$dom.developers"] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },

      { $project: { domainDevelopers: 0 } },
    ]);

    if (!task.length) return res.status(404).json({ message: "Task not found" });

    const obj = task[0];
    obj.assignedBy = obj.assignedBy?.name || "-";
    obj.assignedTo = obj.assignedTo?.name || "-";

    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});

    res.json(obj);

  } catch (err) {
    console.error("GetSingleTask Error:", err);
    res.status(500).json({ message: "Failed to fetch task" });
  }
};

// GET /tasks/:id/domain/:domainName
export const getTaskDomain = async (req, res) => {
  try {
    const { id, domainName } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Join Assigned By User
      {
        $lookup: {
          from: "users",
          localField: "assignedBy",
          foreignField: "_id",
          as: "assignedBy",
        },
      },
      { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },

      // Join Assigned To User
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

      // Join Domain Developers
      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "domainDevelopers",
        },
      },

      {
        $addFields: {
          domains: {
            $map: {
              input: "$domains",
              as: "dom",
              in: {
                $mergeObjects: [
                  "$$dom",
                  {
                    developers: {
                      $filter: {
                        input: "$domainDevelopers",
                        as: "dev",
                        cond: { $in: ["$$dev._id", "$$dom.developers"] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $project: { domainDevelopers: 0 } },
    ]);

    if (!task.length) return res.status(404).json({ message: "Task not found" });

    const obj = task[0];
    obj.assignedBy = obj.assignedBy?.name || "-";
    obj.assignedTo = obj.assignedTo?.name || "-";
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});

    // Filter for the requested domain ONLY
    const cleanDomain = domainName.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const domainObj =
      obj.domains?.find(d => {
        const dClean = d.name.replace(/^https?:\/\//, "").replace(/\/$/, "");
        return dClean === cleanDomain || dClean.includes(cleanDomain);
      }) || null;

    if (!domainObj) {
      return res.status(404).json({ message: "Domain not found in this task" });
    }

    // Return task-level info + selected domain only
    res.json({
      _id: obj._id,
      title: obj.title,
      description: obj.description,
      assignedBy: obj.assignedBy,
      assignedTo: obj.assignedTo,
      domains: [domainObj],
      developers: obj.developers,
      submissions: obj.submissions,
    });

  } catch (err) {
    console.error("GetTaskDomain Error:", err);
    res.status(500).json({ message: "Failed to fetch task domain" });
  }
};

// GET DOMAIN STATS PER DOMAIN NAME
export const getDomainStats = async (req, res) => {
  try {
    // 🔐 Token validation
    let token = req.cookies?.TMSAuthToken;

    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    let userId, role;
    try {
      const decoded = jwtDecode(token);
      userId = decoded?.id;
      role = decoded?.role;
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // 🎯 Match condition (restrict Developer to their own domains)
    const matchStage = {};
    if (role === "TL") {
      matchStage["domains.developers"] = new mongoose.Types.ObjectId(userId);
    }

    if (role === "Manager") {
      matchStage["assignedTo"] = new mongoose.Types.ObjectId(userId);
    }



    // ⚡ MongoDB aggregation for fast domain-level stats
    const stats = await Task.aggregate([
      { $unwind: "$domains" },
      ...(role === "TL" || role === "Manager" ? [{ $match: matchStage }] : []),

      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$domains.status", "pending"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$domains.status", "in-progress"] }, 1, 0] },
          },
          delayed: {
            $sum: { $cond: [{ $eq: ["$domains.status", "delayed"] }, 1, 0] },
          },
          inRAndD: {
            $sum: { $cond: [{ $eq: ["$domains.status", "in-R&D"] }, 1, 0] },
          },
          submitted: {
            $sum: { $cond: [{ $eq: ["$domains.status", "submitted"] }, 1, 0] },
          },
          deployed: {
            $sum: { $cond: [{ $eq: ["$domains.status", "deployed"] }, 1, 0] },
          },
          Reopened: {
            $sum: { $cond: [{ $eq: ["$domains.status", "Reopened"] }, 1, 0] },
          },
          Terminated: {
            $sum: { $cond: [{ $eq: ["$domains.status", "Terminated"] }, 1, 0] },
          },
          YetToAssign: {
            $sum: { $cond: [{ $eq: ["$domains.status", "YetToAssign"] }, 1, 0] },
          }
        },
      },

      {
        $project: {
          _id: 0,
          total: 1,
          pending: 1,
          "in-progress": "$inProgress",
          delayed: 1,
          "in-R&D": "$inRAndD",
          submitted: 1,
          deployed: 1,
          Reopened: 1,
          Terminated: 1,
          YetToAssign: 1
        },
      },
    ]);

    // 🧾 Response (return 0s if no data)
    const result = stats[0] || {
      total: 0,
      pending: 0,
      "in-progress": 0,
      delayed: 0,
      "in-R&D": 0,
      submitted: 0,
      deployed: 0,
      Reopened: 0,
      Terminated: 0,
      YetToAssign: 0
    };

    res.status(200).json({
      success: true,
      message: "Domain stats fetched successfully",
      data: result,
    });
  } catch (err) {
    console.error("DomainStats Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch domain stats",
      error: err.message,
    });
  }
};

// GET DEVELOPERS DOMAIN STATUS
export const getDevelopersDomainStatus = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $unwind: "$domains" }, // each domain becomes a row
      { $unwind: "$domains.developers" }, // each developer in domain becomes a row

      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "dev",
        },
      },
      { $unwind: "$dev" }, // get developer details

      {
        $group: {
          _id: {
            devId: "$dev._id",
            devName: "$dev.name",
          },
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: "$domains.status" }, ["submitted", "completed"]] },
                1, 0
              ]
            }
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$domains.status" }, "in-progress"] }, 1, 0]
            }
          },
          inRD: {
            $sum: {
              $cond: [{ $in: [{ $toLower: "$domains.status" }, ["in-r&d", "in-rd"]] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$domains.status" }, "pending"] }, 1, 0]
            }
          },
          delayed: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$domains.status" }, "delayed"] }, 1, 0]
            }
          },
        }
      },

      {
        $project: {
          _id: 0,
          devId: "$_id.devId",
          name: "$_id.devName",
          total: 1,
          completed: 1,
          inProgress: 1,
          inRD: 1,
          pending: 1,
          delayed: 1,
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error("Error fetching developer domain stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// export const getTLUsers = async (req, res) => {
//   try {
//     // Get TL users
//     const users = await User.find({ role: "TL" }).select("_id name email role");

//     // Inject developer stats
//     const final = await Promise.all(
//       users.map(async (user) => {
//         const tasks = await Task.find({ assignedTo: user._id });

//         return {
//           name: user.name,
//           total: tasks.length,
//           completed: tasks.filter(t => t.status === "submitted").length,
//           inProgress: tasks.filter(t => t.status === "in-progress").length,
//           delayed: tasks.filter(t => t.status === "delayed").length,
//           inRD: tasks.filter(t => t.status === "in-R&D").length,
//           Reopened: tasks.filter(t => t.status === "Reopened").length,
//           Terminated: tasks.filter(t => t.status === "Terminated").length,
//         };
//       })
//     );

//     res.json(final);
//   } catch (error) {
//     console.error("getAssignToUsers error:", error);
//     res.status(500).json({ message: "Failed to fetch users" });
//   }
// };

export const getTLUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "TL" }).select("_id name");

    const final = await Promise.all(
      users.map(async (user) => {
        const tasks = await Task.find({ assignedTo: user._id }).lean();

        let stats = {
          total: 0,
          pending: 0,
          inProgress: 0,
          inRD: 0,
          delayed: 0,
          submitted: 0,
          Reopened: 0,
          Terminated: 0,
        };

        tasks.forEach(task => {
          task.domains?.forEach(domain => {
            const status = domain.status;

            stats.total++;

            if (status === "pending") stats.pending++;
            else if (status === "in-progress") stats.inProgress++;
            else if (status === "in-R&D") stats.inRD++;
            else if (status === "submitted") stats.submitted++;
            else if (status === "delayed") stats.delayed++;
            else if (status === "Reopened") stats.Reopened++;
            else if (status === "Terminated") stats.Terminated++;
          });
        });

        return {
          name: user.name,
          ...stats,
        };
      })
    );

    res.json(final);
  } catch (error) {
    console.error("getTLUsers error:", error);
    res.status(500).json({ message: "Failed to fetch TL summary" });
  }
};

export const updateTaskDomainStatus = async (req, res) => {
  try {
    const { taskId, domainName, status, reason, url } = req.body;

    if (!taskId || !domainName || !status || !reason) {
      return res.status(400).json({ message: "taskId, domainId,reason and status are required" });
    }


    // Find the task by its ID
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Find the domain inside the domains array
    const domain = task.domains?.find(d => d.name === domainName); // using Mongoose subdocument id method
    if (!domain) return res.status(404).json({ message: "Domain not found" });

    // Update status
    domain.status = status;
    if (reason) domain.reason = reason;

    if (req.file) {
      domain.upload = `uploads/${req.file.filename}`;
    }

    if (url) {
      // Handle both string or object safely
      if (typeof url === "string") {
        domain.uploadUrl = url;
      } else if (typeof url === "object") {
        domain.uploadUrl = url.path || url.url || JSON.stringify(url);
      }
    }


    // Optional: update domain's completeDate if submitted
    if (status === "submitted") {
      domain.completeDate = new Date();
      if (domain.submission) domain.submission.status = status;
    }

    await task.save();

    try {
      const assigner = await User.findById(task.assignedBy).lean();

      let submittedDevId;
      if (task.domains?.length) {
        for (const d of task.domains) {
          if (d.name === domainName && d.developers?.length) {
            submittedDevId = d.developers[0];
            break;
          }
        }
      }
      if (!submittedDevId) submittedDevId = task.assignedTo;

      const dev = await User.findById(submittedDevId).lean();

      const space = "   ";
      const taskUrl = `${process.env.FRONTEND_URL}/TMS-operations/tasks`;

      const DomainName = `\`${domain.name}\``

      const slackMsg = `
<@${assigner?.slackId || ''}>
:🧩: *Task Move  IN-R&D:*
${space}:briefcase: *Task:*  ${task.title || task.projectCode}
${space}:jigsaw: *Domain:* ${DomainName}
${space}:bust_in_silhouette: *Sales Person:* <@${assigner?.slackId || ''}> (Sales)
${space}:female-technologist: *Submitted By:* <@${dev?.slackId || ''}> (Manager)
${space}:memo: *Reason:* ${reason}
${space}:bar_chart: *View Task:*  <${taskUrl}|Open Dashboard>
CC: <@${process.env.SLACK_ID_DEEP}>,<@${process.env.SLACK_ID_VISHAL}>,<@${process.env.SLACK_ID_SUNIL}>
`;

      await sendSlackMessage(process.env.SALES_OP_CHANNEL, slackMsg);
    } catch (err) {
      console.error("⚠️ Slack notify error:", err.message);
    }

    await ActivityLog.create({
      taskId: task._id,
      domainName: domain.name,
      action: `Status Update to In-R&D`,
      changedBy: req.user?.name || "Unknown User",
      role: req.user?.role || "Unknown Role",
      timestamp: new Date(),
    });

    res.json({ message: "Domain status updated", domain });

  } catch (err) {
    console.error("updateTaskDomainStatus Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

export const getReopenTaskData = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .select(
        "title description typeOfDelivery mandatoryFields optionalFields frequency RPM oputputFormat domains inputUrls clientSampleSchemaUrls sowUrls sowFiles sampleFileRequired requiredValumeOfSampleFile assignedTo assignedBy taskAssignedDate targetDate completeDate"
      )
      .populate("assignedTo", "_id name")
      .populate("assignedBy", "_id name");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    console.error("ReOpen Prefill Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const reOpenTask = async (req, res) => {
  try {
    const { id } = req.params;



    const task = await Task.findById(id).select(
      "title projectCode description typeOfDelivery mandatoryFields optionalFields frequency RPM oputputFormat domains inputUrls clientSampleSchemaUrls sowFiles sampleFileRequired requiredValumeOfSampleFile assignedBy assignedTo reopenCount taskAssignedDate targetDate completeDate"
    )
      .populate("assignedBy", "name slackId")
      .populate("assignedTo", "name slackId");


    if (!task) return res.status(404).json({ message: "Task not found" });

    // 🚫 Block if already reopened once
    if (task.reopenCount >= 1) {
      return res.status(400).json({
        message: "Task can be reopened only once"
      });
    }


    // taskAssignedDate → reset to now
    const assignedDate = new Date();
    task.taskAssignedDate = assignedDate;

    // completeDate → reset
    task.completeDate = null;

    // targetDate → +2 days from assigned date
    const targetDate = new Date(assignedDate);
    targetDate.setDate(assignedDate.getDate() + 2);

    task.targetDate = targetDate;



    const oldTaskData = JSON.parse(JSON.stringify(task.toObject()));

    if (!oldTaskData.RPM) oldTaskData.RPM = task.RPM || "-";





    // FIX OUTPUT FORMAT mismatch
    if (oldTaskData.oputputFormat) {
      oldTaskData.outputFormat = Array.isArray(oldTaskData.oputputFormat)
        ? oldTaskData.oputputFormat
        : oldTaskData.oputputFormat.split(",").map(v => v.trim());
    }

    // 3️⃣ FIX: domains missing on reopen
    if (oldTaskData.domains) {
      oldTaskData.domains = oldTaskData.domains.map(d => ({
        name: d.name || "-",
        typeOfPlatform: d.typeOfPlatform || "-",
        domainRemarks: d.domainRemarks || "-"
      }));
    } else {
      oldTaskData.domains = [];
    }

    // 4️⃣ FIX: input URLs
    oldTaskData.inputDescription = Array.isArray(oldTaskData.inputUrls)
      ? oldTaskData.inputUrls.join(", ")
      : oldTaskData.inputUrls || "-";

    // 5️⃣ FIX: Client Sample Schema URLs
    oldTaskData.clientSampleSchemaUrls = Array.isArray(oldTaskData.clientSampleSchemaUrls)
      ? oldTaskData.clientSampleSchemaUrls.join(", ")
      : oldTaskData.clientSampleSchemaUrls || "-";


    let updateData = req.body || {};

    // Parse JSON from FormData
    Object.keys(updateData).forEach((key) => {
      try {
        if (typeof updateData[key] === "string" && updateData[key].startsWith("{"))
          updateData[key] = JSON.parse(updateData[key]);

        if (typeof updateData[key] === "string" && updateData[key].startsWith("["))
          updateData[key] = JSON.parse(updateData[key]);
      } catch (_) { }
    });

    // Boolean + Numbers
    if (updateData.sampleFileRequired !== undefined) {
      updateData.sampleFileRequired =
        updateData.sampleFileRequired === "true" || updateData.sampleFileRequired === true;
    }

    if (updateData.requiredValumeOfSampleFile !== undefined) {
      updateData.requiredValumeOfSampleFile =
        updateData.requiredValumeOfSampleFile === "" ||
          updateData.requiredValumeOfSampleFile === null
          ? undefined
          : Number(updateData.requiredValumeOfSampleFile);
    }


    // 🔥 BUILD changedFields CORRECTLY (NEW VALUES ONLY)
    const changedFields = {};

    Object.keys(updateData).forEach((key) => {
      const skipFields = ["sampleFileRequired", "requiredValumeOfSampleFile"];
      if (skipFields.includes(key)) return;

      if (key === "domains") return;

      const oldValue = task[key];
      let newValue = updateData[key];

      // ❌ If frontend sent empty or undefined → ignore
      if (newValue === "" || newValue === null || newValue === undefined) return;

      // Normalize ObjectId → string
      const oldNormalized =
        typeof oldValue === "object" && oldValue !== null && oldValue.toString
          ? oldValue.toString()
          : oldValue;

      const newNormalized =
        typeof newValue === "object" && newValue !== null && newValue.toString
          ? newValue.toString()
          : newValue;

      // If array → convert to clean string
      if (Array.isArray(newNormalized)) {
        if (JSON.stringify(oldNormalized) !== JSON.stringify(newNormalized)) {
          changedFields[key] = newNormalized.join(", ").replace(/,\s*$/, "");
        }
        return;
      }

      // Final compare
      if (JSON.stringify(oldNormalized) !== JSON.stringify(newNormalized)) {
        changedFields[key] = newNormalized;
      }
    });

    let oldSowFiles = [];
    let newSowFile = null;



    // ------------------------------------------
    // DOMAIN CHANGE DETECTION (CRITICAL LOGIC)
    // ------------------------------------------
    let oldDomainsForCompare = JSON.parse(JSON.stringify(task.domains || []));
    let newDomains = [];

    if (updateData.domains) {
      newDomains = Array.isArray(updateData.domains)
        ? updateData.domains
        : JSON.parse(updateData.domains);
    } else {
      newDomains = oldDomainsForCompare; // no changes sent
    }

    // Normalize for comparison (remove status field)
    const normalize = (arr) =>
      arr.map((d) => ({
        name: d.name,
        typeOfPlatform: d.typeOfPlatform,
        domainRemarks: d.domainRemarks || "",
      }));

    const hasDomainChanged =
      JSON.stringify(oldDomainsForCompare) !== JSON.stringify(newDomains);


    //console.log("DOMAIN CHANGED?", hasDomainChanged);

    // ------------------------------------------
    // UPDATE DOMAIN ONLY IF CHANGED
    // ------------------------------------------
    // if (hasDomainChanged) {
    //   //console.log("➡ Updating domain status to Reopened");

    //   if (!Array.isArray(task.previousDomain)) task.previousDomain = [];

    //   task.previousDomain.push({
    //     oldValue: JSON.parse(JSON.stringify(task.domains)),
    //     changedAt: new Date(),
    //   });

    //   task.domains = newDomains.map((d) => ({
    //     ...d,
    //     status: "Reopened",
    //   }));
    //   task.markModified("domains");

    //   // Add to changedFields so SOW is generated
    //   changedFields.domains = newDomains.map(d => ({
    //     name: d.name,
    //     typeOfPlatform: d.typeOfPlatform,
    //     domainRemarks: d.domainRemarks || ""
    //   }));

    // } else {
    //   //console.log("➡ Domains unchanged → NOT updating domain status");
    // }

    // const savedTask = await Task.findById(id);
    // console.log(savedTask.domains);

    let changedDomainList = [];


    if (updateData.domains) {
      const newDomains = Array.isArray(updateData.domains)
        ? updateData.domains
        : JSON.parse(updateData.domains);

      const onlyNewDomains = [];

      newDomains.forEach((newD) => {
        const oldD = oldDomainsForCompare.find(od => od.name === newD.name);

        // ✅ It is NEW if NOT found in old list
        if (!oldD) {
          onlyNewDomains.push({
            name: newD.name || "-",
            typeOfPlatform: newD.typeOfPlatform || "-",
            domainRemarks: newD.domainRemarks || "-"
          });
        }
      });

      // If new domains exist → add ONLY them to changedFields
      if (onlyNewDomains.length > 0) {
        changedFields.domains = onlyNewDomains;
      }
    }



    // 2️⃣ Update normal fields
    Object.keys(updateData).forEach((key) => {
      if (key !== "domains") task[key] = updateData[key];
    });




    // 3️⃣ Generate SOW only if changed fields exist
    if (Object.keys(changedFields).length > 0) {
      console.log("🔥 Generating SOW...");

      oldSowFiles = [...(task.sowFiles || [])];

      // ensure RPM exists in mergedTaskData
      if (!oldTaskData.RPM && task.RPM !== undefined) {
        oldTaskData.RPM = task.RPM;
      }

      const mergedTaskData = oldTaskData;



      newSowFile = await generateSOWDocxFromTemplate(
        mergedTaskData,
        changedFields,   // <-- NOW CORRECT
        "edit"
      );

      task.sowFiles = [newSowFile];

      console.log("✅ SOW Generated:", newSowFile);
    } else {
      console.log("⚠ No changed fields → SOW not generated");
    }
    if (newSowFile) {
      task.reopenCount = (task.reopenCount || 0) + 1;
    }

    if (Object.keys(changedFields).length > 0) {
      if (!Array.isArray(task.previousDomain)) {
        task.previousDomain = [];
        task.assignedTo=null
      }
      task.previousDomain.push({
        oldValue: JSON.parse(JSON.stringify(task.domains)),
        changedAt: new Date(),
      });
    }

    if (Object.keys(changedFields).length > 0) {


      task.domains.forEach((d) => {
        d.completeDate = null;
        d.submission = [];
        d.developers = [];
        
        d.status = "Reopened";
      });

      task.markModified("domains");
    }


    // 4️⃣ Save task
    await task.save();

    // 5️⃣ Delete old SOW files
    oldSowFiles.forEach((filePath) => {
      if (filePath !== newSowFile) {   // 🔥 prevent deleting new file
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    });

    //log genrate 

    try {
      const domainList = task.domains?.map(d => d.name) || ["-"];

      for (const domain of domainList) {
        await ActivityLog.create({
          taskId: task._id,
          domainName: domain,   // <-- single domain
          action: "Task Reopened",
          changedBy: req.user?.name || "Unknown",
          role: req.user?.role || "Unknown",
        });
      }



    } catch (err) {
      console.error("Failed to create ActivityLog:", err);
    }



    const dashboardUrl = `${process.env.FRONTEND_URL}/TMS-operations/tasks`;
    const assignedByName = task.assignedBy?.slackId
      ? `<@${task.assignedBy.slackId}>`
      : task.assignedBy?.name;

    const assignedToName = task.assignedTo?.slackId
      ? `<@${task.assignedTo.slackId}>`
      : task.assignedTo?.name;


    // slack notification
    const slackMessage = `
:repeat: Task Reopened
${space}:briefcase: Task: ${task.title}
${space}:bust_in_silhouette: Assigned By: ${assignedByName}(Sales)
${space}:date:Assigned To: ${assignedToName} (Manager)
${space}:memo: Details: The task has been reopened due to required updates. Please review the changes and proceed accordingly.
${space}:link: <${dashboardUrl} |Open Dashboard>
CC: <@${process.env.SLACK_ID_DEEP}>, <@${process.env.SLACK_ID_VISHAL}>,<@${process.env.SLACK_ID_SUNIL}>
`

    // send slack message whene files are uploaded
    if (newSowFile) {
      await sendSlackMessage(process.env.SALES_OP_CHANNEL, slackMessage);
    }

    return res.json({
      message: "Task reopened and SOW generated",
      newSowFile,
      changedFields,
      task,
    });

  } catch (err) {
    console.error("ReOpenTask Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// TERMINATE DOMAIN (domain-wise)
export const terminateDomain = async (req, res) => {
  try {
    const { taskId, domainName } = req.body;
    const { terminatedReason } = req.body;

    if (!taskId || !domainName) {
      return res.status(400).json({ message: "taskId and domainName are required" });
    }

    const task = await Task.findById(taskId);
    // console.log("Task:- ", task);

    if (!task) return res.status(404).json({ message: "Task not found" });

    // find domain
    const domain = task.domains.find((d) => d.name === domainName);
    if (!domain)
      return res.status(404).json({ message: "Domain not found in this task" });

    // Update domain
    domain.status = "Terminated";
    domain.terminatedReason = terminatedReason;


    await task.save();

    // Log entry
    await ActivityLog.create({
      taskId: task._id,
      domainName,
      action: "Domain Terminated",
      changedBy: req.user?.name || "Unknown User",
      role: req.user?.role || "Unknown Role",

      timestamp: new Date(),
      remark: terminatedReason || "",
    });

    // slack notification
    const assignedByUser = await User.findById(task.assignedBy).lean();
    const assignedToUser = await User.findById(task.assignedTo).lean();

    const assignedBySlack = assignedByUser?.slackId ? `<@${assignedByUser.slackId}>` : assignedByUser?.name || "-";
    const assignedToSlack = assignedToUser?.slackId ? `<@${assignedToUser.slackId}>` : assignedToUser?.name || "-";




    const slackMessage = `
    *Task Terminated*:no_entry_sign: 
${space}:briefcase: *Task:* ${task.title || task.projectCode}
${space}:bust_in_silhouette: *Assigned By:* ${assignedBySlack}
${space}:date: *Assigned To:* ${assignedToSlack}
${space}:jigsaw: *Domain:* \`${domain.name}\`
${space}:memo: *Reason:* ${terminatedReason}
${space}:memo: *Details:* This task is now terminated and no further updates are allowed.
${space}:link: *View Task:* <${process.env.FRONTEND_URL}/TMS-operations/tasks|Open Dashboard>
CC: <@${process.env.SLACK_ID_DEEP}>, <@${process.env.SLACK_ID_VISHAL}>,<@${process.env.SLACK_ID_SUNIL}>
`;


    await sendSlackMessage(process.env.SALES_OP_CHANNEL, slackMessage);

    return res.json({
      message: "Domain terminated successfully",
      domain,
      taskStatus: task.status,
    });

  } catch (error) {
    console.error("terminateDomain Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL USERS + TASKS CREATED BY EACH USER + STATUS COUNT
export const getAllUsersTaskCreatedStats = async (req, res) => {
  try {
    // 1️⃣ Get all users
    const users = await User.find()
      .select("_id name email role")
      .lean();

    if (!users.length) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // 2️⃣ Build stats for each user
    const stats = await Task.aggregate([
      { $unwind: "$domains" },

      {
        $group: {
          _id: {
            userId: "$assignedBy",
            status: "$domains.status"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // 3️⃣ Format result by user
    const result = users.map((user) => {
      const userStats = stats.filter(
        (s) => String(s._id.userId) === String(user._id)
      );

      const formatted = {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        total: 0,
        pending: 0,
        "in-progress": 0,
        delayed: 0,
        "in-R&D": 0,
        submitted: 0,
        deployed: 0,
        Reopened: 0,
        Terminated: 0
      };

      userStats.forEach((row) => {
        const status = row._id.status;
        formatted[status] = row.count;
        formatted.total += row.count;
      });

      return formatted;
    });

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error("getAllUsersTaskCreatedStats Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// export const getTaskRD = async (req, res) => {
//   try {
//     console.log("getTAsk", req.query);

//     const { search = "", status = "", page = 1, limit = 10, assignedBy = "" } = req.query;

//     const parsedLimit = parseInt(limit) || 10;
//     const parsedPage = parseInt(page) || 1;
//     const skip = (parsedPage - 1) * parsedLimit;

//     const match = {};

//     // Status filter
//     if (status) {
//       match["domains.status"] = { $in: status.split(",").map(s => s.trim()) };
//     }

//     // AssignedBy filter
//     if (assignedBy) {
//       const assignedUsers = await UserDB2.find({
//         name: { $regex: assignedBy, $options: "i" }
//       }).select("_id");

//       match.assignedBy = { $in: assignedUsers.map(u => u._id) };
//     }

//     // Search filter
//     if (search) {
//       const searchRegex = new RegExp(search, "i");
//       match.$or = [
//         { projectCode: searchRegex },
//         { title: searchRegex },
//         { description: searchRegex },
//         { "domains.name": searchRegex }
//       ];
//     }

//     // ----------------------------
//     // 🔥 AGGREGATION PIPELINE
//     // ----------------------------
//     const tasks = await TaskDB2.aggregate([
//       { $match: match },

//       // Convert string → ObjectId for developers
//       {
//         $addFields: {
//           domains: {
//             $map: {
//               input: "$domains",
//               as: "dom",
//               in: {
//                 $mergeObjects: [
//                   "$$dom",
//                   {
//                     developers: {
//                       $map: {
//                         input: "$$dom.developers",
//                         as: "dev",
//                         in: { $toObjectId: "$$dev" }
//                       }
//                     }
//                   }
//                 ]
//               }
//             }
//           }
//         }
//       },

//       // --- populate assignedBy ---
//       {
//         $lookup: {
//           from: "users",
//           localField: "assignedBy",
//           foreignField: "_id",
//           as: "assignedBy"
//         }
//       },
//       { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },

//       // --- populate assignedTo ---
//       {
//         $lookup: {
//           from: "users",
//           localField: "assignedTo",
//           foreignField: "_id",
//           as: "assignedTo"
//         }
//       },
//       { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

//       // --- populate ALL developers (flat) ---
//       {
//         $lookup: {
//           from: "users",
//           localField: "domains.developers",
//           foreignField: "_id",
//           as: "developersList"
//         }
//       },

//       // Attach developers to each domain
//       {
//         $addFields: {
//           domains: {
//             $map: {
//               input: "$domains",
//               as: "dom",
//               in: {
//                 $mergeObjects: [
//                   "$$dom",
//                   {
//                     developers: {
//                       $filter: {
//                         input: "$developersList",
//                         as: "dev",
//                         cond: { $in: ["$$dev._id", "$$dom.developers"] }
//                       }
//                     }
//                   }
//                 ]
//               }
//             }
//           }
//         }
//       },

//       { $project: { developersList: 0 } },

//       { $sort: { createdAt: -1 } },

//       { $skip: skip },
//       { $limit: parsedLimit }
//     ]);

//     const total = await TaskDB2.countDocuments(match);

//     res.json({
//       tasks,
//       total,
//       totalPages: Math.ceil(total / parsedLimit),
//       page: parsedPage,
//       limit: parsedLimit
//     });

//   } catch (err) {
//     console.log("GetTaskRD Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

export const getTaskRD = async (req, res) => {
  try {

    //await updateDelayedDomainsDebug();
    const { search = "", status = "", page = 1, limit = 10, assignedBy = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let token = req.cookies?.TMSAuthToken;

    let userId, role;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded?.id;
        role = decoded?.role;
      } catch { }
    }
    const match = {};
    const now = new Date();

    await TaskDB2.updateMany(
      {
        targetDate: { $lt: now }, // target date passed
        "domains.status": { $in: ["pending", "in-progress"] }, // match both
      },
      {
        $set: {
          "domains.$[elem].status": "delayed",
        },
      },
      {
        arrayFilters: [
          { "elem.status": { $in: ["pending", "in-progress"] } } // filter both
        ],
      }
    );

    /* ---------------- Match before lookups ---------------- */

    if (role === "Developer" && userId) {
      match["domains.developers"] = new mongoose.Types.ObjectId(userId);
    }

    // Status filter
    if (status) {
      const statusArray = status.split(",").map(s => s.trim());
      match["domains"] = {
        $not: { $elemMatch: { status: { $nin: statusArray } } }
      };
    } else {
      // default → only submitted
      match["domains"] = {
        $not: { $elemMatch: { status: { $nin: ["submitted"] } } }
      };
    }





    const tasksAggregate = await TaskDB2.aggregate([
      { $match: match }, // initial match (by role, etc.)

      // Lookups for assignedBy, assignedTo
      { $lookup: { from: "users", localField: "assignedBy", foreignField: "_id", as: "assignedBy" } },
      { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },
      // Assigned By Filter
      ...(assignedBy
        ? [
          {
            $match: {
              "assignedBy.name": { $regex: new RegExp(`^${assignedBy}$`, "i") }
            }
          }
        ]
        : []),

      { $lookup: { from: "users", localField: "assignedTo", foreignField: "_id", as: "assignedTo" } },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

      // 🔹 Unwind domains so each domain is a separate row
      { $unwind: { path: "$domains", preserveNullAndEmptyArrays: true } },
      ...(status
        ? [
          {
            $match: {
              "domains.status": { $in: status.split(",").map(s => s.trim()) },
            },
          },
        ]
        : []),

      // 🔹 Lookup developers for this domain
      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "domainDevelopers",
        },
      },


      // 🔹 Search filter (title, domain name, etc.)
      ...(search.trim()
        ? [
          {
            $match: {
              $or: [
                { projectCode: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { "domains.name": { $regex: search, $options: "i" } },
                { "assignedBy.name": { $regex: search, $options: "i" } },
                { "assignedTo.name": { $regex: search, $options: "i" } },
                { "domainDevelopers.name": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
        : []),

      // 🔹 Final projection: show domain-level info clearly
      {
        $project: {
          _id: 1,
          projectCode: 1,
          title: 1,
          description: 1,
          taskAssignedDate: 1,

          assignedBy: {
            name: { $ifNull: ["$assignedBy.name", "-"] },
            role: { $ifNull: ["$assignedBy.role", "-"] }
          },

          assignedTo: {
            name: { $ifNull: ["$assignedTo.name", "-"] },
            role: { $ifNull: ["$assignedTo.role", "-"] }
          },

          domainName: "$domains.name",
          domainStatus: "$domains.status",
          domainDevelopers: {
            $map: {
              input: "$domainDevelopers",
              as: "dev",
              in: "$$dev.name",
            },
          },
          feasible: "$domains.submission.feasible",
          completeDate: { $ifNull: ["$domains.completeDate", "$completeDate"] },
          createdAt: 1,
          targetDate: 1,
          reopenCount: { $ifNull: ["$reopenCount", 0] },
        },
      }
      ,

      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ]);



    let tasksData = tasksAggregate[0]?.data || [];
    //tasksData = applyDelayedStatus(tasksData);

    const total = tasksAggregate[0]?.metadata[0]?.total || 0;

    res.json({
      tasks: tasksData,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("GetTask Aggregation Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

export const getSingleTaskRD = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid task ID" });

    const task = await TaskDB2.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $lookup: { from: "users", localField: "assignedBy", foreignField: "_id", as: "assignedBy" } },
      { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "users", localField: "assignedTo", foreignField: "_id", as: "assignedTo" } },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "users", localField: "domains.developers", foreignField: "_id", as: "domainDevelopers" } },
      {
        $addFields: {
          domains: {
            $map: {
              input: "$domains",
              as: "dom",
              in: {
                $mergeObjects: [
                  "$$dom",
                  { developers: { $filter: { input: "$domainDevelopers", as: "dev", cond: { $in: ["$$dev._id", "$$dom.developers"] } } } },
                ],
              },
            },
          },
        },
      },
      { $project: { domainDevelopers: 0 } },
    ]);

    if (!task.length) return res.status(404).json({ message: "Task not found" });

    const obj = task[0];
    obj.assignedBy = obj.assignedBy?.name || "-";
    obj.assignedTo = obj.assignedTo?.name || "-";
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});

    res.json(obj);
  } catch (err) {
    console.error("GetSingleTask Error:", err);
    res.status(500).json({ message: "Failed to fetch task" });
  }
};

export const testDB2 = async (req, res) => {
  try {
    console.log("▶ TEST DB2: Running find() on TaskDB2");

    const tasks = await TaskDB2.find({});

    console.log("▶ DB2 TASK COUNT:", tasks.length);
    if (tasks.length > 0) {
      console.log("▶ First Task:", tasks[0]);
    }

    res.json({
      dbName: TaskDB2.db.name,
      collection: TaskDB2.collection.name,
      count: tasks.length,
      sample: tasks.slice(0, 2)
    });
  } catch (err) {
    console.error("TEST DB2 ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getDomainStatsRD = async (req, res) => {
  try {
    // 🔐 Token validation
    let token = req.cookies?.TMSAuthToken;

    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    let userId, role;
    try {
      const decoded = jwtDecode(token);
      userId = decoded?.id;
      role = decoded?.role;
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // 🎯 Match condition (restrict Developer to their own domains)
    const matchStage = {};
    if (role === "Developer") {
      matchStage["domains.developers"] = new mongoose.Types.ObjectId(userId);
    }

    // ⚡ MongoDB aggregation for fast domain-level stats
    const stats = await TaskDB2.aggregate([
      { $unwind: "$domains" },
      ...(role === "Developer" ? [{ $match: matchStage }] : []),

      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$domains.status", "pending"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$domains.status", "in-progress"] }, 1, 0] },
          },
          delayed: {
            $sum: { $cond: [{ $eq: ["$domains.status", "delayed"] }, 1, 0] },
          },
          inRAndD: {
            $sum: { $cond: [{ $eq: ["$domains.status", "in-R&D"] }, 1, 0] },
          },
          submitted: {
            $sum: { $cond: [{ $eq: ["$domains.status", "submitted"] }, 1, 0] },
          },
          deployed: {
            $sum: { $cond: [{ $eq: ["$domains.status", "deployed"] }, 1, 0] },
          },
          Reopened: {
            $sum: { $cond: [{ $eq: ["$domains.status", "Reopened"] }, 1, 0] },
          },
          Terminated: {
            $sum: { $cond: [{ $eq: ["$domains.status", "Terminated"] }, 1, 0] },
          }
        },
      },

      {
        $project: {
          _id: 0,
          total: 1,
          pending: 1,
          "in-progress": "$inProgress",
          delayed: 1,
          "in-R&D": "$inRAndD",
          submitted: 1,
          deployed: 1,
          Reopened: 1,
          Terminated: 1,
        },
      },
    ]);

    // 🧾 Response (return 0s if no data)
    const result = stats[0] || {
      total: 0,
      pending: 0,
      "in-progress": 0,
      delayed: 0,
      "in-R&D": 0,
      submitted: 0,
      deployed: 0,
      Reopened: 0,
      Terminated: 0
    };

    res.status(200).json({
      success: true,
      message: "Domain stats fetched successfully",
      data: result,
    });
  } catch (err) {
    console.error("DomainStats Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch domain stats",
      error: err.message,
    });
  }
};


export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: { $in: [null, undefined] }
    })
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role");

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};




// export const assignTask = async (req, res) => {
//   console.log("Assigning task...",req.body);
  
//   try {
//     const { id } = req.params;
//     const { assignedTo } = req.body;

//     if (!assignedTo)
//       return res.status(400).json({ message: "assignedTo is required" });

//     const task = await Task.findById(id);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     task.assignedTo = assignedTo;

//     if (task.domains && Array.isArray(task.domains)) {
//       task.domains = task.domains.map((domain) => ({
//         ...domain,
//         status: "pending",
//       }));
//     }
    
//     await task.save();



//     const dashboardUrl = `${process.env.FRONTEND_URL}/tasks`;



  

//     const AssignedBySlack= 
//     const AssignedToSlack= 

//     const slackMessage = `
//         :bell: *New Task Assigned*
//         :briefcase: *Task:* ${raw.title}
//         :bust_in_silhouette: *Assigned By:* ${AssignedBySlack} 
//         :date: *Assigned To:* ${AssignedToSlack} 
//         :memo: *Details:* Please review feasibility and assign to a TL accordingly.
//         :link: *View Task:* <${dashboardUrl}|Open Dashboard>
//         CC: <@${process.env.SLACK_ID_DEEP}>, <@${process.env.SLACK_ID_VISHAL}>,<@${process.env.SLACK_ID_SUNIL}>
//       `;

//     await sendSlackMessage(process.env.SALES_OP_CHANNEL, slackMessage);

//     res.json({ message: "Task assigned successfully", task });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


export const assignTask = async (req, res) => {
  console.log("Assigning task...", req.body);

  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo)
      return res.status(400).json({ message: "assignedTo is required" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.assignedTo = assignedTo;

    if (task.domains && Array.isArray(task.domains)) {
      task.domains = task.domains.map((domain) => ({
        ...domain,
        status: "pending",
      }));
    }

    await task.save();

    const dashboardUrl = `${process.env.FRONTEND_URL}/tasks`;

    // Get Slack ID of current logged-in user
    const currentUser = await User.findById(req.user.id); // assuming req.user.id is set from JWT
    const AssignedBySlack = currentUser?.slackId || "";

    // Get Slack ID of assignedTo user from DB
    const assignedToUser = await User.findById(assignedTo);
    const AssignedToSlack = assignedToUser?.slackId || "";

    const slackMessage = `
        :bell: *New Task Assigned*
        :briefcase: *Task:* ${task.title}
        :bust_in_silhouette: *Assigned By:* <@${AssignedBySlack}> 
        :date: *Assigned To:* <@${AssignedToSlack}> 
        :memo: *Details:* Please review feasibility and assign to a TL accordingly.
        :link: *View Task:* <${dashboardUrl}|Open Dashboard>
        CC: <@${process.env.SLACK_ID_DEEP}>, <@${process.env.SLACK_ID_VISHAL}>, <@${process.env.SLACK_ID_SUNIL}>
      `;

    await sendSlackMessage(process.env.OP_CHANNEL, slackMessage);

    res.json({ message: "Task assigned successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
