// import mongoose from "mongoose";

// const POCSchema = new mongoose.Schema({
//     taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
//     date: {
//         type: Date,
//         default: Date.now
//     },
//     asignedBy: {
//         type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
//     },
//     PurposeOftheProject: {
//         type: String,
//         required: true
//     },
//     ProjectCode: {
//         type: String,
//         required: true
//     },
//     RecordCount: {
//         type: String,
//         required: true
//     },
//     TaskId: {
//         type: String,
//         required: true
//     },
//     BitrixURL: {
//         type: String,
//         required: true
//     },
//     Industry: {
//         type: String,
//         required: true
//     },
//     ClientGeography: {
//         type: String,
//         required: true
//     },
//     TargetWebsite: {
//         type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true
//     },
//     LocationCoverage: {
//         type: String,
//         required: true
//     },
//     InputParameter: {
//         type: String,
//         required: true
//     },
//     ScopeOfData: {
//         type: String,
//         required: true
//     },
//     OutputAttributes: {
//         type: String,
//         required: true
//     },
//     OutputFormat: {
//         type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true
//     },

//     OutputDeliveryMode: {
//         type: String,
//         required: true
//     },
//     Frequency: {
//         type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true
//     },
//     Timeline: {
//         type: String,
//         required: true
//     },
//     AdditionalNotes: {
//         type: String,
//         required: true
//     },
//     MandatoryFields: [
//         {
//             fieldName: { type: String, required: true },
//             description: { type: String, required: true }
//         }
//     ]

// },
//     {
//         timestamps: true,
//     }
// );
// export default mongoose.model("POC", POCSchema);

import mongoose from "mongoose";

const POCSchema = new mongoose.Schema({

  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
   
  projectName: { type: String, required: false },


  date: { type: Date, default: Date.now },

  // asignedBy is STRING (name) NOT ObjectId
  asignedBy: { type: String, required: true },

  PurposeOftheProject: { type: String, required: true },

  ProjectCode: { type: String, required: true },

  RecordCount: { type: String, required: true },

  // TaskId is duplicated but keeping as String because you send string
  TaskIdForPOC: { type: String, required: true },

  BitrixURL: { type: String, required: true },

  Industry: { type: String, required: true },

  ClientGeography: { type: [String], required: true },

  // TargetWebsite should be ARRAY OF STRING (NOT ObjectId)
  TargetWebsite: [{ type: String, required: true }],

  LocationCoverage: { type: [String], required: true },

  InputParameter: { type: String, required: true },

  ScopeOfData: { type: String, required: true },

  

  // OutputFormat is STRING NOT ObjectId
  OutputFormat: { type: String, required: true },

  OutputDeliveryMode: { type: String, required: true },

  // Frequency is STRING NOT ObjectId
  Frequency: { type: String, required: true },

  Timeline: { type: String, required: true },

  AdditionalNotes: { type: String, required: true },

  // MandatoryFields is ARRAY OF OBJECT
  MandatoryFields: [
    {
      fieldName: { type: String, required: true },
      description: { type: String, required: true }
    }
  ],

  generatedPOCFile: { type: String } 

}, { timestamps: true });

export default mongoose.model("POC", POCSchema);
