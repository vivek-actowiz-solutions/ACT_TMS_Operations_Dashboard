
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType,
  PageNumber,
  TabStopPosition,
  TabStopType
} from "docx";


/**
 * Generate a DOCX buffer for a POC object following the uploaded SOW structure (exact reproduction).
 * @param {Object} poc - populated POC document from Mongo
 * @returns {Buffer} - docx file buffer
 */
const tocItems = [
  { title: "Document Control", page: 3 },
  { title: "Purpose of the Document", page: 4 },
  { title: "Purpose of the Project", page: 5 },
  { title: "Requirement Map", page: 6 },
  { title: "1. Project Details", page: 6 },
  { title: "2. Scope Of Project", page: 6 },
  { title: "3. Additional Notes", page: 7 },
  { title: "4. Mandatory Fields", page: 7 },
  { title: "5. Annotations", page: 9 },
];
export const generatePOCDocxBuffer = async (poc = {}) => {
  console.log("poc projectName:-", poc.projectName);

  // Helper sizes: docx TextRun 'size' uses half-points. 11pt -> 22, 14pt -> 28, etc.
  const SIZE_BODY = 30; // 11pt
  const SIZE_H3 = 35; // 14pt
  const SIZE_H2 = 40; // 16pt
  const SIZE_H1 = 50; // 20pt
  const SIZE_TITLE = 70; // 28pt

  // Utility: page break paragraph
  const pageBreak = () =>
    new Paragraph({
      children: [new TextRun({ text: "", break: 1 })],
    });

  // Utility: many blank paragraph lines (exact reproduction uses many empty paragraphs)
  const blankLines = (count = 1) =>
    Array.from({ length: count }).map(() => new Paragraph({ text: "" }));

  // Header cell with shading and white bold text
  function headerCell(text) {
    return new TableCell({
      width: { size: 40, type: WidthType.PERCENTAGE },
      shading: {
        type: ShadingType.CLEAR,
        fill: "16476A", // header background from your DOCX
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text || "",
              bold: true,
              color: "FFFFFF",
              size: SIZE_BODY,
            }),
          ],
        }),
      ],
    });
  }

  // Row creator used for Project Details, Scope of Project, etc.
  function createRow(title, value) {
    return new TableRow({
      width: { size: 50, type: WidthType.PERCENTAGE },
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: title || "", size: SIZE_BODY }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: value || "", size: SIZE_BODY }),
              ],
            }),
          ],
        }),
      ],
    });
  }


  function headerCellWithWidth(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },  // 🔥 fixed width
    shading: { fill: "16476A" },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 28,
          }),
        ],
      }),
    ],
  });
}

function bodyCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || "",
            size: 28,
          }),
        ],
      }),
    ],
    margins: { top: 120, bottom: 120 }, // small, clean height
  });
}


  // Build the document
  const doc = new Document({
    styles: {
      // Custom styles
      default: {
        document: {
          run: { font: "Calibri", color: "000000", size: 24 }, // default font size 12pt (24 half-points)
          paragraph: { spacing: { line: 360 } }, // 1.5 line spacing
        },
      },
    },
    // Page size & margins (A4 + 1 inch margins)
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: "portrait",
              // A4 size in twentieths of a point: width 11906, height 16838 (these are typical values used by docx lib)
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Title block (centered)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Scope of Work (SOW)",
                bold: true,
                size: SIZE_TITLE,
                font: "Calibri",
              }),
            ],
          }),
          // Insert blank paragraphs (match original file's big gap)
          ...blankLines(4), // Title page has ~20 blank lines in the uploaded DOCX
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Of",
                size: SIZE_H2,
                font: "Calibri",
              }),
            ],
          }),
          ...blankLines(4),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: poc.projectName || "Project Title",
                bold: true,
                size: SIZE_H1 + 8, // larger than H1 like the sample
                font: "Calibri",
              }),
            ],
          }),




          new Paragraph({
            children: [],
            pageBreakBefore: true,   // 🔥 forces a new page
          }),


          // Table of Contents heading
          new Paragraph({
            properties: {
              type: "nextPage",
            },
            children: [
              new TextRun({
                text: "Table of Contents",
                bold: true,
                size: SIZE_H2,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          ...tocItems.map(item =>
            new Paragraph({
              tabStops: [
                {
                  type: TabStopType.RIGHT,
                  position: TabStopPosition.MAX,
                  leader: ".",
                },
              ],
              children: [
                new TextRun({
                  text: item.title,
                  size: SIZE_BODY,
                }),
                new TextRun({
                  text: "\t" + item.page,
                  size: SIZE_BODY,
                }),
              ],
            })
          ),
          

          new Paragraph({
            children: [],
            pageBreakBefore: true,   // 🔥 forces a new page
          }),

          // Document Control heading
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: "Document Control", bold: true, size: SIZE_H2 })],
          }),

          
          new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  layout: "fixed",  // 🔥 forces perfect alignment
  rows: [
    new TableRow({
      children: [
        headerCellWithWidth("Version", 2000),
        headerCellWithWidth("Date", 2500),
        headerCellWithWidth("Author", 2500),
        headerCellWithWidth("Release Summary", 3500),
      ],
    }),

    new TableRow({
      children: [
        bodyCell("1.0", 2000),
        bodyCell(poc.date ? new Date(poc.date).toLocaleDateString() : new Date().toLocaleDateString(), 2500),
        bodyCell(poc.asignedBy || poc.assignedBy || "", 2500),
        bodyCell("First Release", 3500),
      ],
    }),
  ],
}),


          // page break (match file)

          new Paragraph({
            children: [],
            pageBreakBefore: true,   // 🔥 forces a new page
          }),

          // Purpose of the Document
          new Paragraph({

            children: [new TextRun({ text: "Purpose of the Document", bold: true, size: SIZE_H2 })]
          }),
          // large gap like original
          ...blankLines(1),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text:
                  "This document comprises of the requirement details that has been either discussed with Sales team or have been shared by client with Actowiz. Compliance of the requirement will be done by technical team of Actowiz in accordance with requirement details mentioned in this document. For any deviation or change in Scope of Work, client has to explicitly communicate the same with Sales Team & Technical Team. Updated SOW document to be submitted to client in case of any deviation or change in Scope of Work Agreement.",
                size: SIZE_BODY,
              }),
            ],
          }),


          new Paragraph({
            children: [],
            pageBreakBefore: true,   // 🔥 forces a new page
          }),

          // Purpose of the Project heading
          new Paragraph({

            children: [new TextRun({ text: "Purpose of the Project", bold: true, size: SIZE_H2 })]
          }),
          ...blankLines(1),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text:
                  poc.PurposeOftheProject ||
                  "",
                size: SIZE_BODY,
              }),
            ],
          }),



          // Requirement Map heading
          new Paragraph({
            children: [],
            pageBreakBefore: true,   // 🔥 forces a new page
          }),
          new Paragraph({

            children: [new TextRun({ text: "Requirement Map", bold: true, size: SIZE_H2 })]
          }),
          new Paragraph({ text: "" }),

          // 1. Project Details heading
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: "1.Project Details", bold: true, size: SIZE_H3 })]

          }),

          // Project Details table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: "fixed",
            rows: [
              new TableRow({
                children: [
                  headerCell("Item", 50),
                  headerCell("Description", 50),
                ],
              }),
              createRow("Project Code", poc.ProjectCode || ""),
              createRow("Record Count", poc.RecordCount || ""),
              createRow("Task Id", poc.TaskId || (poc.TaskIdForPOC?.toString() || "")),
              createRow("Bitrix URL", poc.BitrixURL || ""),
            ],
          }),

          new Paragraph({ text: "" }),

          // 2. Scope Of Project
          new Paragraph({ children: [new TextRun({ text: "2.Scope Of Project", bold: true, size: SIZE_H3 })] }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [headerCell("Requirement"), headerCell("Details")],
              }),
              createRow("Industry", poc.Industry || ""),
              createRow("Client Geography", Array.isArray(poc.ClientGeography) ? poc.ClientGeography.join(", ") : (poc.ClientGeography || "")),
              createRow("Target Website", Array.isArray(poc.TargetWebsite) ? poc.TargetWebsite.join(", ") : (poc.TargetWebsite || "")),
              createRow("Location Coverage", Array.isArray(poc.LocationCoverage) ? poc.LocationCoverage.join(", ") : (poc.LocationCoverage || "")),
              createRow("Input Parameter", poc.InputParameter || ""),
              createRow("Scope of Data", poc.ScopeOfData || ""),
              createRow("Output Attributes", "Output Attributes	Mentioned Below in Mandatory Fields"),
              createRow("Output Format", poc.OutputFormat?.title || poc.OutputFormat || ""),
              createRow("Output Delivery Mode", poc.OutputDeliveryMode || ""),
              createRow("Frequency", poc.Frequency?.title || poc.Frequency || ""),
              createRow("Timeline", poc.Timeline || ""),
              createRow("Input File", poc.InputFile || ""),
              createRow("Sample", poc.Sample || ""),
            ],
          }),

          new Paragraph({ text: "" }),

          // 3. Additional Notes
          new Paragraph({ children: [new TextRun({ text: "3.Additional Notes", bold: true, size: SIZE_H3 })] }),
          new Paragraph({ children: [new TextRun({ text: poc.AdditionalNotes || "", size: SIZE_BODY })] }),

          new Paragraph({ text: "" }),

          // 4. Mandatory Fields
          new Paragraph({ children: [new TextRun({ text: "4.Mandatory Fields", bold: true, size: SIZE_H2 })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [headerCell("Header"), headerCell("Description")],
              }),
              // If MandatoryFields exists, map; otherwise include static list (as in your SOW)
              ...(Array.isArray(poc.MandatoryFields) && poc.MandatoryFields.length
                ? poc.MandatoryFields.map((mf) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mf.fieldName || "", size: SIZE_BODY })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mf.description || "", size: SIZE_BODY })] })] }),
                    ],
                  })
                )
                : [

                  createRow(""),
                ]),
            ],
          }),

          new Paragraph({ text: "" }),

          // Annotations section
          new Paragraph({ children: [new TextRun({ text: "5.Annotations", bold: true, size: SIZE_H2 })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [headerCell("Item"), headerCell("Annotations")],
              }),
              createRow("Costco", ""),
            ],
          }),

          // final page break if needed
          // pageBreak(),
        ],
      },
    ],
    // Global default run style -> Calibri 11pt
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: SIZE_BODY,
          },
          paragraph: {
            spacing: { line: 276 }, // approx 1.15 line-height
          },
        },
      },
    },
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
};
